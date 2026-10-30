import { describe, it, expect, vi } from 'vitest';
import {
  NotificationFactory,
  DonorSearchAdapter,
  RequestStatusSubject,
  type IRequestStatusListener,
  type StatusChangeEvent,
} from '../src/patterns/patterns';

describe('Design Pattern 1: Factory Pattern (Creational) - NotificationFactory', () => {
  const mockRequest = {
    requestId: 'req_123',
    patientName: 'Jane Doe',
    patientEmail: 'jane@example.com',
    bloodGroup: 'A+' as const,
    units: 2,
    location: 'Dhaka Central Hospital',
  };

  it('should create an ApprovalNotification with correct metadata and message', () => {
    const notification = NotificationFactory.createNotification(mockRequest, 'APPROVED');
    expect(notification.type).toBe('APPROVAL');
    expect(notification.title).toBe('Blood Request Approved');
    expect(notification.message).toContain('Your request for 2 unit(s) of A+ blood has been approved');
    expect(notification.requestId).toBe('req_123');
    expect(notification.recipientEmail).toBe('jane@example.com');
    expect(notification.createdAt).toBeInstanceOf(Date);
  });

  it('should create a RejectionNotification with correct metadata and message', () => {
    const notification = NotificationFactory.createNotification(mockRequest, 'REJECTED');
    expect(notification.type).toBe('REJECTION');
    expect(notification.title).toBe('Blood Request Rejected');
    expect(notification.message).toContain('unable to fulfill your request');
    expect(notification.requestId).toBe('req_123');
    expect(notification.recipientEmail).toBe('jane@example.com');
  });

  it('should create a FulfillmentNotification with correct metadata and message', () => {
    const notification = NotificationFactory.createNotification(mockRequest, 'FULFILLED');
    expect(notification.type).toBe('FULFILLMENT');
    expect(notification.title).toBe('Blood Request Fulfilled');
    expect(notification.message).toContain('successfully marked as fulfilled');
    expect(notification.requestId).toBe('req_123');
  });

  it('should throw an error for unsupported status types', () => {
    expect(() => {
      // Testing invalid status runtime protection
      NotificationFactory.createNotification(mockRequest, 'PENDING' as unknown as 'APPROVED');
    }).toThrow('Unsupported notification status');
  });
});

describe('Design Pattern 2: Adapter Pattern (Structural) - DonorSearchAdapter', () => {
  it('should adapt criteria into MongoDB query and return normalized results', async () => {
    // Mock user model / repository without real MongoDB connection
    const mockDbUsers = [
      {
        _id: 'usr_1',
        name: 'Rahim Khan',
        email: 'rahim@example.com',
        bloodGroup: 'O+',
        location: 'Dhanmondi, Dhaka',
        availableToDonate: true,
        role: 'DONOR',
      },
    ];

    const mockUserModel = {
      find: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue(mockDbUsers),
      }),
    };

    const adapter = new DonorSearchAdapter(mockUserModel);
    const results = await adapter.search({
      bloodGroup: 'O+',
      location: 'dhaka',
      availableOnly: true,
    });

    expect(mockUserModel.find).toHaveBeenCalledWith({
      role: 'DONOR',
      bloodGroup: 'O+',
      location: { $regex: 'dhaka', $options: 'i' },
      availableToDonate: true,
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      id: 'usr_1',
      name: 'Rahim Khan',
      email: 'rahim@example.com',
      bloodGroup: 'O+',
      location: 'Dhanmondi, Dhaka',
      availableToDonate: true,
    });
  });

  it('should handle optional criteria gracefully when only bloodGroup is provided', async () => {
    const mockUserModel = {
      find: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue([]),
      }),
    };

    const adapter = new DonorSearchAdapter(mockUserModel);
    await adapter.search({ bloodGroup: 'B+' });

    expect(mockUserModel.find).toHaveBeenCalledWith({
      role: 'DONOR',
      bloodGroup: 'B+',
      availableToDonate: true, // Default to available donors
    });
  });
});

describe('Design Pattern 3: Observer Pattern (Behavioral) - RequestStatusSubject', () => {
  it('should notify all registered listeners when request status changes', async () => {
    const subject = new RequestStatusSubject();

    const listenerA: IRequestStatusListener = {
      onStatusChange: vi.fn(),
    };
    const listenerB: IRequestStatusListener = {
      onStatusChange: vi.fn(),
    };

    subject.subscribe(listenerA);
    subject.subscribe(listenerB);

    const event: StatusChangeEvent = {
      requestId: 'req_456',
      previousStatus: 'PENDING',
      newStatus: 'APPROVED',
      patientId: 'patient_789',
      updatedBy: 'admin_001',
      timestamp: new Date(),
    };

    await subject.notify(event);

    expect(listenerA.onStatusChange).toHaveBeenCalledTimes(1);
    expect(listenerA.onStatusChange).toHaveBeenCalledWith(event);
    expect(listenerB.onStatusChange).toHaveBeenCalledTimes(1);
    expect(listenerB.onStatusChange).toHaveBeenCalledWith(event);
  });

  it('should not notify unsubscribed listeners', async () => {
    const subject = new RequestStatusSubject();
    const listener: IRequestStatusListener = {
      onStatusChange: vi.fn(),
    };

    subject.subscribe(listener);
    subject.unsubscribe(listener);

    const event: StatusChangeEvent = {
      requestId: 'req_456',
      previousStatus: 'PENDING',
      newStatus: 'REJECTED',
      patientId: 'patient_789',
      updatedBy: 'admin_001',
      timestamp: new Date(),
    };

    await subject.notify(event);

    expect(listener.onStatusChange).not.toHaveBeenCalled();
  });
});
