import { describe, it, expect } from 'vitest';
import {
  validateBloodRequestInput,
  isValidStatusTransition,
  VALID_BLOOD_GROUPS,
} from '../src/lib/request-validator';

describe('Blood Request Validation', () => {
  it('should accept valid blood request payload', () => {
    const input = {
      bloodGroup: 'B+',
      units: 2,
      location: 'Dhaka Medical College Hospital',
      contactDetails: '01700000000',
    };
    const result = validateBloodRequestInput(input);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid or missing blood group', () => {
    const input = {
      bloodGroup: 'X+',
      units: 1,
      location: 'City Hospital',
    };
    const result = validateBloodRequestInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      `Invalid blood group. Allowed: ${VALID_BLOOD_GROUPS.join(', ')}`
    );
  });

  it('should reject non-positive or non-integer units', () => {
    const zeroUnits = { bloodGroup: 'A+', units: 0, location: 'Clinic A' };
    const negativeUnits = { bloodGroup: 'A+', units: -2, location: 'Clinic A' };
    const floatUnits = { bloodGroup: 'A+', units: 1.5, location: 'Clinic A' };

    expect(validateBloodRequestInput(zeroUnits).isValid).toBe(false);
    expect(validateBloodRequestInput(negativeUnits).isValid).toBe(false);
    expect(validateBloodRequestInput(floatUnits).isValid).toBe(false);
  });

  it('should require a non-empty location', () => {
    const noLocation = { bloodGroup: 'O-', units: 1, location: '   ' };
    const result = validateBloodRequestInput(noLocation);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Location is required.');
  });
});

describe('Permitted Blood Request Status Transitions', () => {
  it('should allow PENDING to transition to APPROVED or REJECTED', () => {
    expect(isValidStatusTransition('PENDING', 'APPROVED')).toBe(true);
    expect(isValidStatusTransition('PENDING', 'REJECTED')).toBe(true);
  });

  it('should allow APPROVED to transition to FULFILLED', () => {
    expect(isValidStatusTransition('APPROVED', 'FULFILLED')).toBe(true);
  });

  it('should disallow illegal transitions', () => {
    // Cannot jump straight from PENDING to FULFILLED without approval
    expect(isValidStatusTransition('PENDING', 'FULFILLED')).toBe(false);

    // Cannot reopen REJECTED requests back to APPROVED
    expect(isValidStatusTransition('REJECTED', 'APPROVED')).toBe(false);

    // Cannot revert FULFILLED back to PENDING or REJECTED
    expect(isValidStatusTransition('FULFILLED', 'PENDING')).toBe(false);
    expect(isValidStatusTransition('FULFILLED', 'REJECTED')).toBe(false);

    // No-op transition to same status is false
    expect(isValidStatusTransition('APPROVED', 'APPROVED')).toBe(false);
  });
});
