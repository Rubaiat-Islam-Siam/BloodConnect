# Software Requirements Specification (SRS) — BloodConnect

## 1. Project Overview and Scope

**BloodConnect** is an educational e-Blood Management System developed for a university Software Engineering laboratory course (CSE 3206). Its primary objective is to connect voluntary blood donors with patients and their families during medical emergencies, while giving administrative authorities oversight over blood request approvals and fulfillment.

### Scope Boundaries:
- **In-Scope**:
  - Secure role-based user authentication (PATIENT, DONOR, ADMIN) using HTTP-only cookies and bcryptjs.
  - Searchable voluntary donor registry filterable by ABO/Rh blood groups and geographic locations.
  - Patient blood request submission, validation, and real-time status tracking.
  - Admin dashboard to review, approve, reject, or mark requests as fulfilled.
  - Application of three distinct design patterns (Factory, Adapter, and Observer).
  - Vitest test suite with automated coverage reporting and GitHub Actions CI workflow.
- **Out-of-Scope (Non-Goals)**:
  - Financial transactions or paid blood compensation.
  - In-app chat, SMS gateway integrations, or complex mapping APIs.
  - Direct laboratory blood-matching or biological cross-matching verification.

---

## 2. Process Model: The Incremental Model

The development of BloodConnect adopted the **Incremental Process Model**.

### Justification:
1. **Manageable Complexity**: In a university laboratory timeframe, building monolithic systems all at once creates high integration risks. Developing iteratively ensured that foundational layers were thoroughly verified before dependent features were built.
2. **Four Increments Executed**:
   - **Increment 1 — Foundation & Authentication**: Built user schemas, password hashing with bcryptjs, JWT session token generation, HTTP-only cookie handlers, and input validation.
   - **Increment 2 — Donor Search & Adapter**: Implemented donor profiles, availability toggles, and the `DonorSearchAdapter` to decouple MongoDB queries from presentation logic.
   - **Increment 3 — Blood Request Workflow & Patterns**: Created the blood request domain, validation rules, state transitions, `NotificationFactory` (Factory pattern), and `RequestStatusSubject` (Observer pattern).
   - **Increment 4 — Testing, Verification & CI/CD**: Authored unit tests under Vitest following TDD principles, configured V8 test coverage, and established GitHub Actions continuous integration.

---

## 3. Functional Requirements

### FR1: Authentication & Authorization
- **FR1.1**: The system shall permit users to register as either `PATIENT` or `DONOR`.
- **FR1.2**: Public registration as `ADMIN` shall be strictly forbidden. An initial administrator account must only be provisioned using a secure server-side secret key (`ADMIN_SECRET_KEY`).
- **FR1.3**: Passwords must be hashed using `bcryptjs` with a minimum salt round of 10 prior to persistence.
- **FR1.4**: Sessions shall be maintained using encrypted, HTTP-only, secure cookies (`bloodconnect_token`) with a 7-day expiration.
- **FR1.5**: Protected API endpoints and pages shall verify user roles and enforce access restrictions.

### FR2: Donor Management
- **FR2.1**: Donors must specify their blood group (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) and primary geographic location during registration.
- **FR2.2**: Donors shall have the ability to toggle their availability (`availableToDonate: true/false`) and update their location from their dashboard.
- **FR2.3**: Unauthenticated and authenticated users shall be able to search the donor directory filtered by blood group and location.

### FR3: Blood Request Management
- **FR3.1**: Registered Patients shall be able to submit blood requests containing blood group, required units (positive integer), hospital location, and optional contact details.
- **FR3.2**: All newly submitted requests shall be assigned the `PENDING` status.
- **FR3.3**: Patients shall view only their own submitted requests and their real-time statuses.
- **FR3.4**: Donors shall be able to browse relevant approved blood requests.

### FR4: Administrative Supervision
- **FR4.1**: Administrators shall access a protected dashboard listing all blood requests.
- **FR4.2**: Administrators shall be authorized to transition requests from `PENDING` to `APPROVED` or `REJECTED`, and from `APPROVED` to `FULFILLED`.
- **FR4.3**: Illegal status jumps (e.g., `PENDING` directly to `FULFILLED`) shall be blocked by server-side validation.

---

## 4. Non-Functional Requirements

- **NFR1: Security**: No plaintext passwords shall ever be saved or logged. Session tokens must not be accessible via client-side JavaScript (`document.cookie`).
- **NFR2: Performance**: API response times for queries and donor searches should remain under 200ms for typical dataset sizes.
- **NFR3: Reliability**: External database disconnection or validation failures must return informative HTTP status codes (400, 401, 403, 404, 500) and structured JSON error messages.
- **NFR4: Usability & Accessibility**: Responsive, mobile-friendly interface designed with high contrast text, standard typography, clear status indicators, and clean loading/empty states.
- **NFR5: Maintainability**: Strict adherence to TypeScript typing and modular component separation.

---

## 5. User Stories

### Patient User Stories:
- *US-P1*: As a patient, I want to register an account using my email so that I can manage my medical blood requests.
- *US-P2*: As a patient, I want to search for available blood donors near my hospital so that I can reach out to potential donors directly.
- *US-P3*: As a patient, I want to submit a formal blood request specifying the required blood group and units so that hospital authorities and donors can help me.
- *US-P4*: As a patient, I want to track whether my request is pending, approved, or fulfilled in real-time.

### Donor User Stories:
- *US-D1*: As a voluntary donor, I want to register with my blood group and location so that patients and doctors can locate me in an emergency.
- *US-D2*: As a voluntary donor, I want to toggle my availability off when I am sick or have recently donated blood so that I do not receive unnecessary inquiries.
- *US-D3*: As a voluntary donor, I want to view approved urgent requests in my area so that I can volunteer to donate.

### Admin User Stories:
- *US-A1*: As a system administrator, I want to access a central dashboard displaying all blood requests across all hospitals.
- *US-A2*: As a system administrator, I want to verify and approve legitimate patient requests before donors are contacted.
- *US-A3*: As a system administrator, I want to mark completed blood requests as fulfilled to keep records accurate.

---

## 6. Use Cases and Acceptance Criteria

### Use Case 1: Submit Blood Request
- **Actor**: Patient
- **Preconditions**: Patient is logged into BloodConnect.
- **Main Flow**:
  1. Patient navigates to `/requests` or `/dashboard`.
  2. Patient enters blood group, units (e.g., 2), hospital location, and attendant phone.
  3. Patient clicks "Submit Blood Request".
  4. Server validates inputs and saves document with `status = "PENDING"`.
- **Postconditions**: Request is visible in the patient's dashboard as `PENDING`.
- **Acceptance Criteria**:
  - Rejects units less than 1 or non-integer values.
  - Rejects missing location.
  - Rejects invalid blood groups.

### Use Case 2: Approve Blood Request
- **Actor**: Admin
- **Preconditions**: Admin is authenticated with `role = "ADMIN"`.
- **Main Flow**:
  1. Admin opens the dashboard table at `/dashboard`.
  2. Admin locates a request with `PENDING` status and clicks "Approve".
  3. Server updates status to `APPROVED`, triggers `NotificationFactory` to build an approval notification object, and notifies the `RequestStatusObserver`.
- **Postconditions**: Request status updates to `APPROVED` and becomes visible to relevant donors.
- **Acceptance Criteria**:
  - Non-admin users attempting this request receive HTTP 403 Forbidden.
  - Observer notifies all subscribers (e.g., audit loggers).

---

## 7. Wireframes / Text-Based Prototypes

### Homepage Wireframe (`/`)
```
+-----------------------------------------------------------------------+
| [🩸 BloodConnect]    Home   Find Donors   Blood Requests   [Sign In]  |
+-----------------------------------------------------------------------+
|                                                                       |
|              Connecting Lifesaving Blood Donors with                  |
|                        Patients in Need                               |
|                                                                       |
|      [ Find Available Donors ]    [ Request Blood ]   [ Donate ]      |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  | Supported Blood Groups:  [A+] [A-] [B+] [B-] [AB+] [AB-] [O+] [O-]|
|  +-----------------------------------------------------------------+  |
|                                                                       |
|  [ 1. Register Account ]   [ 2. Search & Request ]   [ 3. Verify ]    |
|                                                                       |
+-----------------------------------------------------------------------+
|  © 2026 BloodConnect — University SE Lab (CSE 3206) Educational Project|
+-----------------------------------------------------------------------+
```

### Donor Search Wireframe (`/donors`)
```
+-----------------------------------------------------------------------+
| [🩸 BloodConnect]    Home   Find Donors   Blood Requests   [User Profile]
+-----------------------------------------------------------------------+
| Find Blood Donors                                                     |
| Search registered volunteer donors filtered by blood group & location |
|                                                                       |
| [Blood Group: O+  v]  [Location: Dhanmondi   ]  [x Available] [Search]|
|                                                                       |
| +-------------------------+ +-------------------------+               |
| | Rahim Khan        [ O+ ]| | Sarah Connor      [ O+ ]|               |
| | rahim@example.com       | | sarah@example.com       |               |
| | 📍 Dhanmondi, Dhaka     | | 📍 Dhanmondi, Dhaka     |               |
| | 🟢 Available to Donate  | | 🟢 Available to Donate  |               |
| | [Contact Donor ->]      | | [Contact Donor ->]      |               |
| +-------------------------+ +-------------------------+               |
+-----------------------------------------------------------------------+
```

### Admin Dashboard Wireframe (`/dashboard`)
```
+-----------------------------------------------------------------------+
| [🩸 BloodConnect]                                       [Admin | Out] |
+-----------------------------------------------------------------------+
| Administrator Console                                                 |
| [ Total: 18 ]  [ Pending: 4 ]  [ Approved: 11 ]  [ Fulfilled: 3 ]     |
|                                                                       |
| Blood Requests Management                                             |
| +-------------------------------------------------------------------+ |
| | Patient     | Blood Group | Units | Hospital     | Status   | Act | |
| |-------------|-------------|-------|--------------|----------|-----| |
| | Jane Doe    | [ A+ ]      | 2     | Dhaka Med    | PENDING  | [✓] | |
| | Ali Hossain | [ B+ ]      | 1     | Square Hosp  | APPROVED | [F] | |
| +-------------------------------------------------------------------+ |
+-----------------------------------------------------------------------+
```

