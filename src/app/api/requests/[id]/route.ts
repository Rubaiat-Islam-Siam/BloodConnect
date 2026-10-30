import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { BloodRequest } from '@/models/BloodRequest';
import { User, type IUser } from '@/models/User';
import { getSessionUser } from '@/lib/auth';
import {
  isValidStatusTransition,
  type RequestStatus,
} from '@/lib/request-validator';
import {
  NotificationFactory,
  globalStatusSubject,
  type AppNotification,
} from '@/patterns/patterns';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/requests/[id]
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid blood request ID format' }, { status: 400 });
    }

    await connectToDatabase();
    const bloodRequest = await BloodRequest.findById(id).populate('patientId', 'name email location');

    if (!bloodRequest) {
      return NextResponse.json({ error: 'Blood request not found' }, { status: 404 });
    }

    // Role check: Only the requesting patient, admin, or donor can view
    const patientOwnerId = (bloodRequest.patientId as unknown as { _id?: unknown })?._id?.toString() ||
      bloodRequest.patientId?.toString();

    if (session.role === 'PATIENT' && patientOwnerId !== session.userId) {
      return NextResponse.json({ error: 'Access denied to this request' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      request: bloodRequest,
    });
  } catch (error: unknown) {
    console.error('GET /api/requests/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Error fetching request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/requests/[id]
 * Updates request status.
 * - DONOR: may accept (PENDING → APPROVED) a request they have not created.
 * - ADMIN: may approve, reject, or mark fulfilled.
 * Integrates Factory Pattern (NotificationFactory) and Observer Pattern (globalStatusSubject).
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only ADMIN or DONOR may change statuses
    if (session.role !== 'ADMIN' && session.role !== 'DONOR') {
      return NextResponse.json(
        { error: 'Unauthorized: Only donors or administrators can update request status' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid blood request ID format' }, { status: 400 });
    }

    const body = await request.json();
    const { status: newStatus } = body;

    if (!newStatus) {
      return NextResponse.json({ error: 'New status is required' }, { status: 400 });
    }

    // Donors may only accept (PENDING → APPROVED); all other transitions are admin-only
    if (session.role === 'DONOR' && newStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Donors can only accept (approve) blood requests' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const bloodRequest = await BloodRequest.findById(id);

    if (!bloodRequest) {
      return NextResponse.json({ error: 'Blood request not found' }, { status: 404 });
    }

    const currentStatus = bloodRequest.status;

    // Donors cannot accept a request that is not PENDING
    if (session.role === 'DONOR' && currentStatus !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending requests can be accepted by a donor' },
        { status: 400 }
      );
    }

    // Validate permitted status transition
    if (!isValidStatusTransition(currentStatus, newStatus as RequestStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from "${currentStatus}" to "${newStatus}". Permitted: PENDING -> APPROVED | REJECTED, APPROVED -> FULFILLED`,
        },
        { status: 400 }
      );
    }

    // Apply the update
    bloodRequest.status = newStatus as RequestStatus;
    await bloodRequest.save();

    // Fetch patient details to craft notification
    const patientUser = await User.findById(bloodRequest.patientId) as IUser | null;
    const patientName = patientUser ? patientUser.name : 'Valued Patient';
    const patientEmail = patientUser ? patientUser.email : 'patient@bloodconnect.local';

    // 1. BEHAVIORAL PATTERN: Observer Pattern
    // Notify all decoupled subscribers (e.g. AuditLogSubscriber, analytics, etc.)
    await globalStatusSubject.notify({
      requestId: bloodRequest._id.toString(),
      previousStatus: currentStatus,
      newStatus,
      patientId: bloodRequest.patientId.toString(),
      updatedBy: session.userId,
      timestamp: new Date(),
    });

    // 2. CREATIONAL PATTERN: Factory Pattern
    // Generate specialized notification object for the new status
    let notification: AppNotification | null = null;
    if (newStatus === 'APPROVED' || newStatus === 'REJECTED' || newStatus === 'FULFILLED') {
      notification = NotificationFactory.createNotification(
        {
          requestId: bloodRequest._id.toString(),
          patientName,
          patientEmail,
          bloodGroup: bloodRequest.bloodGroup,
          units: bloodRequest.units,
          location: bloodRequest.location,
        },
        newStatus
      );
    }

    return NextResponse.json({
      success: true,
      message: session.role === 'DONOR'
        ? `You have accepted this blood request. The patient will see it as APPROVED.`
        : `Request status updated to ${newStatus}`,
      request: bloodRequest,
      notification,
    });
  } catch (error: unknown) {
    console.error('PATCH /api/requests/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Error updating request status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

