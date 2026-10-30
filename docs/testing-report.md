# Software Testing and TDD Report — BloodConnect

## 1. Testing Strategy

The testing strategy for BloodConnect focuses on verifying domain business rules, security constraints, and design pattern contracts in isolation from external services (such as live MongoDB Atlas clusters or external network connections).

### Core Testing Objectives:
1. **Security & Authentication**:
   - Password hashing with salt rounds and verification.
   - JWT session token creation, verification, and rejection of tampered tokens.
   - Strict role-based authorization rules.
   - Comprehensive registration input validation, specifically verifying that public registration as `ADMIN` is strictly forbidden.
2. **Blood Request Business Logic**:
   - Blood group validation against the valid ABO/Rh sets.
   - Units validation (positive integer requirement).
   - Strict request lifecycle state transitions (`PENDING -> APPROVED | REJECTED`, `APPROVED -> FULFILLED`, rejecting illegal jumps).
3. **Design Patterns**:
   - `NotificationFactory`: Verifying polymorphic object construction for `APPROVED`, `REJECTED`, and `FULFILLED` statuses, and runtime safety against unsupported statuses.
   - `DonorSearchAdapter`: Verifying translation of domain criteria into MongoDB query syntax and output DTO normalization using isolated mock models.
   - `RequestStatusSubject`: Verifying that registered observers receive status transition notifications and unsubscribed listeners do not.

---

## 2. Test-Driven Development (TDD) Workflow

The core components followed the strict Test-Driven Development (Red-Green-Refactor) cycle:

1. **Phase 1: Red (Test First)**
   - Wrote comprehensive unit tests in `tests/patterns.test.ts`, `tests/auth.test.ts`, and `tests/request.test.ts` prior to full module implementation.
   - Executed `npm test`, successfully observing the expected failures (e.g., missing modules, missing methods, assertion errors).
2. **Phase 2: Green (Minimal Implementation)**
   - Implemented `src/lib/request-validator.ts`, `src/lib/auth.ts`, and `src/patterns/patterns.ts` to satisfy the tests.
   - Re-ran `npm test` until all 24 unit tests passed cleanly.
3. **Phase 3: Refactor (Clean Code & Coverage)**
   - Cleaned up type assertions, ensured zero TypeScript compiler errors, and ran coverage analysis with `@vitest/coverage-v8`.

---

## 3. Unit Test Suites and Vitest Mocks

Unit tests are divided into three dedicated test suites under `tests/`:

1. **`tests/patterns.test.ts`**:
   - Tests `NotificationFactory` creation of `ApprovalNotification`, `RejectionNotification`, and `FulfillmentNotification`.
   - Tests `DonorSearchAdapter` using a mocked queryable user model (`vi.fn().mockReturnValue({ select: vi.fn() })`), proving search query translation without live database connection.
   - Tests `RequestStatusSubject` subscription, event broadcasting, and unsubscription.
2. **`tests/auth.test.ts`**:
   - Tests bcryptjs password hashing and password comparison.
   - Tests JWT creation and verification.
   - Tests `hasRequiredRole` authorization checks.
   - Tests `validateRegistrationInput` edge cases.
3. **`tests/request.test.ts`**:
   - Tests `validateBloodRequestInput` for blood groups, integer units, and locations.
   - Tests `isValidStatusTransition` state machine transitions.

---

## 4. Test Execution Commands

To execute tests and generate coverage, run the following commands:

- Run all unit tests once:
  ```bash
  npm test
  ```
- Run tests in interactive watch mode:
  ```bash
  npm run test:watch
  ```
- Run tests with V8 coverage report generation:
  ```bash
  npm run test:coverage
  ```

---

## 5. Actual Verified Test Results

*Executed using Vitest v5.0.5 with V8 coverage provider on Node v24.21.0.*

### Test Summary:
- **Total Test Suites**: 3 passed (3 total)
- **Total Tests**: 24 passed (24 total)
- **Duration**: ~740ms

### Coverage Report Table (from `npm run test:coverage`):

| File | % Statements | % Branches | % Functions | % Lines | Uncovered Lines |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **All files** | **83.63%** | **80.21%** | **76.00%** | **83.96%** | — |
| `src/lib/auth.ts` | 66.66% | 76.19% | 66.66% | 67.50% | 61, 65, 76, 101–136 |
| `src/lib/request-validator.ts` | **100.00%** | **100.00%** | **100.00%** | **100.00%** | None |
| `src/patterns/patterns.ts` | **92.30%** | **69.23%** | **78.57%** | **92.00%** | 220, 231–237 |

> [!NOTE]
> The uncovered lines in `src/lib/auth.ts` correspond to runtime Next.js HTTP cookie manipulation methods (`getSessionUser`, `setAuthCookie`, `clearAuthCookie`) which execute in live HTTP request contexts and are exercised during API route usage. Core security functions (`hashPassword`, `comparePassword`, `createToken`, `verifyToken`, `validateRegistrationInput`, `hasRequiredRole`) have 100% test coverage.

