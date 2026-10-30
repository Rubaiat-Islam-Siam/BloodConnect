import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import {
  hashPassword,
  comparePassword,
  createToken,
  validateRegistrationInput,
  getSessionUser,
  setAuthCookie,
  clearAuthCookie,
} from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ user: null });
    }

    await connectToDatabase();
    const user = await User.findById(session.userId).select('-password');
    if (!user) {
      const response = NextResponse.json({ user: null });
      clearAuthCookie(response);
      return response;
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bloodGroup: user.bloodGroup,
        location: user.location,
        availableToDonate: user.availableToDonate,
      },
    });
  } catch (error) {
    console.error('GET /api/auth error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching user profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { action } = body;

    // 1. LOGIN
    if (action === 'login') {
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        );
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user || !user.password) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const token = createToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
      });

      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          bloodGroup: user.bloodGroup,
          location: user.location,
          availableToDonate: user.availableToDonate,
        },
      });

      setAuthCookie(response, token);
      return response;
    }

    // 2. REGISTER
    if (action === 'register') {
      const { name, email, password, role, bloodGroup, location } = body;

      // Validate registration input (strictly prevents public registration as ADMIN)
      const validation = validateRegistrationInput({
        name,
        email,
        password,
        role,
        bloodGroup,
        location,
      });

      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.errors.join(', ') },
          { status: 400 }
        );
      }

      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        );
      }

      const hashedPassword = await hashPassword(password);

      const newUser = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        bloodGroup: bloodGroup || undefined,
        location: location ? location.trim() : '',
        availableToDonate: role === 'DONOR' ? true : undefined,
      });

      const token = createToken({
        userId: newUser._id.toString(),
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
      });

      const response = NextResponse.json(
        {
          success: true,
          message: 'Account registered successfully',
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            bloodGroup: newUser.bloodGroup,
            location: newUser.location,
            availableToDonate: newUser.availableToDonate,
          },
        },
        { status: 201 }
      );

      setAuthCookie(response, token);
      return response;
    }

    // 3. SEED INITIAL ADMIN (Secure endpoint protected by ADMIN_SECRET_KEY)
    if (action === 'seed-admin') {
      const { adminSecretKey, name, email, password } = body;
      const expectedKey =
        process.env.ADMIN_SECRET_KEY || 'admin_initial_setup_secret_key_change_me';

      if (!adminSecretKey || adminSecretKey !== expectedKey) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid Admin Secret Key' },
          { status: 403 }
        );
      }

      if (!name || !email || !password || password.length < 6) {
        return NextResponse.json(
          { error: 'Name, valid email, and minimum 6-character password are required' },
          { status: 400 }
        );
      }

      const existingAdmin = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingAdmin) {
        return NextResponse.json(
          {
            message: 'User already exists with this email. Role: ' + existingAdmin.role,
            user: {
              id: existingAdmin._id,
              name: existingAdmin.name,
              email: existingAdmin.email,
              role: existingAdmin.role,
            },
          },
          { status: 200 }
        );
      }

      const hashedPassword = await hashPassword(password);
      const adminUser = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'ADMIN',
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Initial ADMIN account provisioned successfully',
          user: {
            id: adminUser._id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role,
          },
        },
        { status: 201 }
      );
    }

    // 4. UPDATE PROFILE (e.g. for Donors to toggle availability or update details)
    if (action === 'update-profile') {
      const session = await getSessionUser(request);
      if (!session) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      const updateData: Record<string, unknown> = {};
      if (typeof body.availableToDonate === 'boolean') {
        updateData.availableToDonate = body.availableToDonate;
      }
      if (typeof body.location === 'string' && body.location.trim().length > 0) {
        updateData.location = body.location.trim();
      }
      if (typeof body.bloodGroup === 'string') {
        updateData.bloodGroup = body.bloodGroup;
      }

      const updatedUser = await User.findByIdAndUpdate(session.userId, updateData, {
        new: true,
      }).select('-password');

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser,
      });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('POST /api/auth error:', error);
    const message = error instanceof Error ? error.message : 'Authentication operation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// LOGOUT
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });
  clearAuthCookie(response);
  return response;
}

