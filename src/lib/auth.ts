import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { VALID_BLOOD_GROUPS, type BloodGroup, type ValidationResult } from './request-validator';

export const USER_ROLES = ['PATIENT', 'DONOR', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const AUTH_COOKIE_NAME = 'bloodconnect_token';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  bloodGroup?: BloodGroup;
  location?: string;
}

const DEFAULT_JWT_SECRET = process.env.JWT_SECRET || 'bloodconnect_default_development_secret_key_32chars';

export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

export async function comparePassword(plainPassword: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashed);
}

export function createToken(payload: AuthTokenPayload, secret = DEFAULT_JWT_SECRET): string {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string, secret = DEFAULT_JWT_SECRET): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, secret) as AuthTokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function hasRequiredRole(userRole?: string, allowedRoles: UserRole[] = []): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole as UserRole);
}

export function validateRegistrationInput(data: Partial<RegistrationInput>): ValidationResult {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters.');
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('A valid email address is required.');
  }

  if (!data.password || data.password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  }

  // Security critical check: NEVER trust a role supplied by a public registration form claiming ADMIN
  if (data.role === 'ADMIN') {
    errors.push('Public registration as ADMIN is strictly prohibited.');
  } else if (!data.role || !['PATIENT', 'DONOR'].includes(data.role)) {
    errors.push('Role must be either PATIENT or DONOR.');
  }

  // Role-specific checks for DONOR
  if (data.role === 'DONOR') {
    if (!data.bloodGroup || !VALID_BLOOD_GROUPS.includes(data.bloodGroup)) {
      errors.push('Donors must provide a valid blood group.');
    }
    if (!data.location || data.location.trim().length === 0) {
      errors.push('Donors must provide their primary location.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Extract authenticated user session from NextRequest cookies or incoming headers
 */
export async function getSessionUser(request?: NextRequest | Request): Promise<AuthTokenPayload | null> {
  let token: string | undefined;

  if (request && 'cookies' in request && typeof request.cookies?.get === 'function') {
    token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      // In non-request environments or tests
      token = undefined;
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

/**
 * Set HTTP-only session cookie on a response
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clear session cookie on logout
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
