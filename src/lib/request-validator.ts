export const VALID_BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
] as const;

export type BloodGroup = (typeof VALID_BLOOD_GROUPS)[number];

export const REQUEST_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'FULFILLED',
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export interface BloodRequestInput {
  bloodGroup: string;
  units: number;
  location: string;
  contactDetails?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateBloodRequestInput(input: Partial<BloodRequestInput>): ValidationResult {
  const errors: string[] = [];

  if (!input.bloodGroup || !VALID_BLOOD_GROUPS.includes(input.bloodGroup as BloodGroup)) {
    errors.push(`Invalid blood group. Allowed: ${VALID_BLOOD_GROUPS.join(', ')}`);
  }

  if (
    typeof input.units !== 'number' ||
    !Number.isInteger(input.units) ||
    input.units <= 0
  ) {
    errors.push('Units must be a positive integer.');
  }

  if (!input.location || typeof input.location !== 'string' || input.location.trim().length === 0) {
    errors.push('Location is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function isValidStatusTransition(
  currentStatus: RequestStatus,
  newStatus: RequestStatus
): boolean {
  if (currentStatus === newStatus) {
    return false;
  }

  switch (currentStatus) {
    case 'PENDING':
      return newStatus === 'APPROVED' || newStatus === 'REJECTED';
    case 'APPROVED':
      return newStatus === 'FULFILLED';
    case 'REJECTED':
    case 'FULFILLED':
    default:
      return false;
  }
}

