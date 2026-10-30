import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { BloodRequest } from '@/models/BloodRequest';
import { getSessionUser } from '@/lib/auth';
import { validateBloodRequestInput } from '@/lib/request-validator';

/**
 * GET /api/requests
 * - PATIENT: Returns only their own requests
 * - DONOR: Returns approved requests matching their blood group or all approved requests
 * - ADMIN: Returns all requests
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();
    let query: Record<string, unknown> = {};

    if (session.role === 'PATIENT') {
      // Patients can view ONLY their own requests
      query = { patientId: session.userId };
    } else if (session.role === 'DONOR') {
      // Donors see ALL pending requests (so they can accept them) + all approved requests
      query = { status: { $in: ['PENDING', 'APPROVED'] } };
    } else if (session.role === 'ADMIN') {
      // Admin sees all requests
      query = {};
    }

    const requests = await BloodRequest.find(query)
      .populate('patientId', 'name email location')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error: unknown) {
    console.error('GET /api/requests error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch blood requests';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/requests
 * - Allowed for PATIENT role to create a new blood request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (session.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Only registered Patients can submit blood requests' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = validateBloodRequestInput(body);

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
    }

    await connectToDatabase();

    const newRequest = await BloodRequest.create({
      patientId: session.userId,
      bloodGroup: body.bloodGroup,
      units: body.units,
      location: body.location.trim(),
      contactDetails: body.contactDetails ? body.contactDetails.trim() : '',
      status: 'PENDING',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Blood request submitted successfully and is pending approval',
        request: newRequest,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('POST /api/requests error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create blood request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

