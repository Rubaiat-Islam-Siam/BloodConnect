import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  comparePassword,
  createToken,
  verifyToken,
  hasRequiredRole,
  validateRegistrationInput,
} from '../src/lib/auth';

describe('Authentication & Security: Password Hashing', () => {
  it('should hash a plain text password and verify it correctly', async () => {
    const rawPassword = 'SecurePassword123!';
    const hashed = await hashPassword(rawPassword);

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(rawPassword);
    expect(hashed.length).toBeGreaterThan(20);

    const isMatch = await comparePassword(rawPassword, hashed);
    expect(isMatch).toBe(true);

    const isWrongMatch = await comparePassword('WrongPassword!', hashed);
    expect(isWrongMatch).toBe(false);
  });
});

describe('Authentication & Security: Token Signing & Verification', () => {
  const secret = 'test-secret-key-at-least-32-chars-long';
  const mockPayload = {
    userId: 'user_123',
    email: 'patient@example.com',
    role: 'PATIENT' as const,
    name: 'Test Patient',
  };

  it('should generate a verifiable JWT token', () => {
    const token = createToken(mockPayload, secret);
    expect(token).toBeTypeOf('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = verifyToken(token, secret);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(mockPayload.userId);
    expect(decoded?.email).toBe(mockPayload.email);
    expect(decoded?.role).toBe(mockPayload.role);
  });

  it('should return null for tampered or invalid tokens', () => {
    const token = createToken(mockPayload, secret);
    const tampered = token + 'tampered';
    const decoded = verifyToken(tampered, secret);
    expect(decoded).toBeNull();
  });
});

describe('Authentication & Security: Role-Based Authorization', () => {
  it('should grant access only when user has one of the allowed roles', () => {
    expect(hasRequiredRole('ADMIN', ['ADMIN'])).toBe(true);
    expect(hasRequiredRole('PATIENT', ['PATIENT', 'ADMIN'])).toBe(true);
    expect(hasRequiredRole('DONOR', ['PATIENT'])).toBe(false);
    expect(hasRequiredRole('PATIENT', ['ADMIN'])).toBe(false);
    expect(hasRequiredRole(undefined, ['ADMIN'])).toBe(false);
  });
});

describe('Authentication & Security: Registration Input Validation', () => {
  it('should pass with valid PATIENT inputs', () => {
    const validPatient = {
      name: 'Alice Wonder',
      email: 'alice@example.com',
      password: 'StrongPassword123',
      role: 'PATIENT' as const,
    };
    const result = validateRegistrationInput(validPatient);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should pass with valid DONOR inputs including blood group and location', () => {
    const validDonor = {
      name: 'Bob Builder',
      email: 'bob@example.com',
      password: 'StrongPassword123',
      role: 'DONOR' as const,
      bloodGroup: 'O+' as const,
      location: 'Chittagong',
    };
    const result = validateRegistrationInput(validDonor);
    expect(result.isValid).toBe(true);
  });

  it('should reject registration attempting ADMIN role', () => {
    const maliciousAdmin = {
      name: 'Hacker',
      email: 'hacker@example.com',
      password: 'StrongPassword123',
      role: 'ADMIN' as const,
    };
    const result = validateRegistrationInput(maliciousAdmin);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Public registration as ADMIN is strictly prohibited.');
  });

  it('should require bloodGroup and location for DONOR role', () => {
    const incompleteDonor = {
      name: 'Incomplete Donor',
      email: 'donor@example.com',
      password: 'StrongPassword123',
      role: 'DONOR' as const,
    };
    const result = validateRegistrationInput(incompleteDonor);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Donors must provide a valid blood group.');
    expect(result.errors).toContain('Donors must provide their primary location.');
  });

  it('should enforce minimum password length', () => {
    const shortPassword = {
      name: 'Short Pass',
      email: 'short@example.com',
      password: '123',
      role: 'PATIENT' as const,
    };
    const result = validateRegistrationInput(shortPassword);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must be at least 6 characters.');
  });
});
