/**
 * Design Patterns Module for BloodConnect
 * 
 * Demonstrates:
 * 1. Factory Pattern (Creational) - NotificationFactory
 * 2. Adapter Pattern (Structural) - DonorSearchAdapter
 * 3. Observer Pattern (Behavioral) - RequestStatusSubject
 */

import { type BloodGroup } from '../lib/request-validator';

// ============================================================================
// 1. FACTORY PATTERN (Creational)
// ============================================================================

export interface RequestNotificationPayload {
  requestId: string;
  patientName: string;
  patientEmail: string;
  bloodGroup: BloodGroup;
  units: number;
  location: string;
}

export type NotificationType = 'APPROVAL' | 'REJECTION' | 'FULFILLMENT';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  requestId: string;
  recipientEmail: string;
  createdAt: Date;
}

export class ApprovalNotification implements AppNotification {
  public id: string;
  public type: NotificationType = 'APPROVAL';
  public title = 'Blood Request Approved';
  public message: string;
  public requestId: string;
  public recipientEmail: string;
  public createdAt: Date;

  constructor(payload: RequestNotificationPayload) {
    this.id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.requestId = payload.requestId;
    this.recipientEmail = payload.patientEmail;
    this.createdAt = new Date();
    this.message = `Good news! Your request for ${payload.units} unit(s) of ${payload.bloodGroup} blood has been approved by the administration. Potential donors will be contacted.`;
  }
}

export class RejectionNotification implements AppNotification {
  public id: string;
  public type: NotificationType = 'REJECTION';
  public title = 'Blood Request Rejected';
  public message: string;
  public requestId: string;
  public recipientEmail: string;
  public createdAt: Date;

  constructor(payload: RequestNotificationPayload) {
    this.id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.requestId = payload.requestId;
    this.recipientEmail = payload.patientEmail;
    this.createdAt = new Date();
    this.message = `Notice: We are unable to fulfill your request for ${payload.units} unit(s) of ${payload.bloodGroup} blood at this time. Please check your emergency contacts.`;
  }
}

export class FulfillmentNotification implements AppNotification {
  public id: string;
  public type: NotificationType = 'FULFILLMENT';
  public title = 'Blood Request Fulfilled';
  public message: string;
  public requestId: string;
  public recipientEmail: string;
  public createdAt: Date;

  constructor(payload: RequestNotificationPayload) {
    this.id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.requestId = payload.requestId;
    this.recipientEmail = payload.patientEmail;
    this.createdAt = new Date();
    this.message = `Your request for ${payload.units} unit(s) of ${payload.bloodGroup} blood has been successfully marked as fulfilled. Thank you for using BloodConnect.`;
  }
}

export class NotificationFactory {
  public static createNotification(
    payload: RequestNotificationPayload,
    status: 'APPROVED' | 'REJECTED' | 'FULFILLED'
  ): AppNotification {
    switch (status) {
      case 'APPROVED':
        return new ApprovalNotification(payload);
      case 'REJECTED':
        return new RejectionNotification(payload);
      case 'FULFILLED':
        return new FulfillmentNotification(payload);
      default:
        throw new Error(`Unsupported notification status: ${status}`);
    }
  }
}

// ============================================================================
// 2. ADAPTER PATTERN (Structural)
// ============================================================================

export interface DonorSearchCriteria {
  bloodGroup?: string;
  location?: string;
  availableOnly?: boolean;
}

export interface DonorSearchResult {
  id: string;
  name: string;
  email: string;
  bloodGroup: string;
  location: string;
  availableToDonate: boolean;
}

export interface IDonorSearchService {
  search(criteria: DonorSearchCriteria): Promise<DonorSearchResult[]>;
}

export interface QueryableUserModel {
  find(query: Record<string, unknown>): {
    select(fields: string): Promise<Array<Record<string, unknown>>>;
  };
}

export class DonorSearchAdapter implements IDonorSearchService {
  private userModel: QueryableUserModel;

  constructor(userModel: QueryableUserModel) {
    this.userModel = userModel;
  }

  public async search(criteria: DonorSearchCriteria): Promise<DonorSearchResult[]> {
    // Translate domain criteria into MongoDB query
    const mongoQuery: Record<string, unknown> = {
      role: 'DONOR',
    };

    if (criteria.bloodGroup && criteria.bloodGroup !== 'ALL') {
      mongoQuery.bloodGroup = criteria.bloodGroup;
    }

    if (criteria.location && criteria.location.trim().length > 0) {
      mongoQuery.location = {
        $regex: criteria.location.trim(),
        $options: 'i',
      };
    }

    // Default to available donors unless explicitly set to false
    if (criteria.availableOnly !== false) {
      mongoQuery.availableToDonate = true;
    }

    const rawDonors = await this.userModel
      .find(mongoQuery)
      .select('name email bloodGroup location availableToDonate _id');

    // Normalize output records to decoupled domain DTO
    return rawDonors.map((donor) => ({
      id: String(donor._id || donor.id),
      name: String(donor.name || ''),
      email: String(donor.email || ''),
      bloodGroup: String(donor.bloodGroup || ''),
      location: String(donor.location || ''),
      availableToDonate: Boolean(donor.availableToDonate),
    }));
  }
}

// ============================================================================
// 3. OBSERVER PATTERN (Behavioral)
// ============================================================================

export interface StatusChangeEvent {
  requestId: string;
  previousStatus: string;
  newStatus: string;
  patientId: string;
  updatedBy: string;
  timestamp: Date;
}

export interface IRequestStatusListener {
  onStatusChange(event: StatusChangeEvent): void | Promise<void>;
}

export class RequestStatusSubject {
  private listeners: IRequestStatusListener[] = [];

  public subscribe(listener: IRequestStatusListener): void {
    if (!this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }

  public unsubscribe(listener: IRequestStatusListener): void {
    this.listeners = this.listeners.filter((item) => item !== listener);
  }

  public async notify(event: StatusChangeEvent): Promise<void> {
    for (const listener of this.listeners) {
      await listener.onStatusChange(event);
    }
  }

  public getSubscriberCount(): number {
    return this.listeners.length;
  }
}

/**
 * Concrete Subscriber: Audit logger that records every status update
 */
export class AuditLogSubscriber implements IRequestStatusListener {
  private logs: Array<{ event: StatusChangeEvent; loggedAt: Date }> = [];

  public onStatusChange(event: StatusChangeEvent): void {
    const entry = { event, loggedAt: new Date() };
    this.logs.push(entry);
    // In production, this can also write to an audit database table
  }

  public getLogs(): Array<{ event: StatusChangeEvent; loggedAt: Date }> {
    return [...this.logs];
  }
}

/**
 * Global singleton observer registry for the application instance
 */
export const globalStatusSubject = new RequestStatusSubject();
export const defaultAuditLogger = new AuditLogSubscriber();
globalStatusSubject.subscribe(defaultAuditLogger);

