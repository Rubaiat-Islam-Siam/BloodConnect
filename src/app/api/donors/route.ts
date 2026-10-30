import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { DonorSearchAdapter } from '@/patterns/patterns';
import { getSessionUser } from '@/lib/auth';

/**
 * GET /api/donors
 * Implements the Adapter Pattern: Uses DonorSearchAdapter to decouple the API route
 * from specific Mongoose query logic.
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const bloodGroup = searchParams.get('bloodGroup') || undefined;
    const location = searchParams.get('location') || undefined;
    const availableOnlyParam = searchParams.get('availableOnly');
    const availableOnly = availableOnlyParam === 'false' ? false : true;

    // Use the Adapter Pattern
    const searchAdapter = new DonorSearchAdapter(User);
    const donors = await searchAdapter.search({
      bloodGroup,
      location,
      availableOnly,
    });

    return NextResponse.json({
      success: true,
      count: donors.length,
      donors,
    });
  } catch (error: unknown) {
    console.error('GET /api/donors error:', error);
    const message = error instanceof Error ? error.message : 'Failed to search donors';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/donors
 * Allows authenticated DONOR to update their availability or location
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session || (session.role !== 'DONOR' && session.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized: Donor access required' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const body = await request.json();
    const { availableToDonate, location, bloodGroup } = body;

    const updateFields: Record<string, unknown> = {};
    if (typeof availableToDonate === 'boolean') {
      updateFields.availableToDonate = availableToDonate;
    }
    if (typeof location === 'string' && location.trim().length > 0) {
      updateFields.location = location.trim();
    }
    if (typeof bloodGroup === 'string') {
      updateFields.bloodGroup = bloodGroup;
    }

    const updatedUser = await User.findByIdAndUpdate(session.userId, updateFields, {
      new: true,
    }).select('-password');

    return NextResponse.json({
      success: true,
      message: 'Donor profile updated successfully',
      donor: updatedUser,
    });
  } catch (error: unknown) {
    console.error('PATCH /api/donors error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update donor profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

