# Software Design Patterns Documentation — BloodConnect

This document details the three software engineering design patterns implemented in BloodConnect, located in `src/patterns/patterns.ts`. Each pattern fulfills a clear design objective and is integrated into the core application workflow.

---

## 1. Pattern 1: Factory Pattern (Creational)

### Category
**Creational Design Pattern**

### Problem Addressed
When an administrator reviews a blood request and updates its status (`APPROVED`, `REJECTED`, or `FULFILLED`), the system needs to produce structured, consistent in-app notification objects tailored to the patient. 

Without a factory, the controller or route handler must manually inspect the status string using arbitrary conditionals and assemble complex JSON objects with varying titles, body text, priority levels, and metadata inline. This causes code duplication, fragile string construction, and tight coupling between the status change logic and notification layout.

### Implementation and Usage
- **Classes/Interfaces**:
  - `AppNotification`: Common interface defining `id`, `type`, `title`, `message`, `requestId`, `recipientEmail`, and `createdAt`.
  - `ApprovalNotification`: Concrete notification class formatted for approved requests.
  - `RejectionNotification`: Concrete notification class formatted for rejected requests.
  - `FulfillmentNotification`: Concrete notification class formatted for fulfilled requests.
  - `NotificationFactory`: Static creator class providing `createNotification(payload, status)`.
- **Where It Is Used**:
  - In `src/app/api/requests/[id]/route.ts` inside the `PATCH` handler when an administrator approves, rejects, or fulfills a blood request.
  - In unit tests in `tests/patterns.test.ts`.

### Alternative Rejected & Why
- **Alternative**: Constructing ad-hoc JSON literals directly inside the API route handler using if/else blocks:
  ```ts
  // Rejected approach:
  const notification = {
    title: status === 'APPROVED' ? 'Approved' : 'Rejected',
    message: 'Your request was ' + status,
    // ...
  };
  ```
- **Why Rejected**: This violates the **Single Responsibility Principle (SRP)** and **Open/Closed Principle (OCP)**. If a new status type (e.g., `DONOR_ASSIGNED` or `CANCELLED`) is introduced, the API route handler itself must be modified and retested. With the Factory pattern, notification creation logic is encapsulated in a dedicated module.

### Benefits and Limitations
- **Benefits**:
  - Encapsulates object creation and ensures uniform notification structures across the platform.
  - Simplifies unit testing of notification generation without requiring database access.
  - Adheres to Open/Closed Principle.
- **Limitations**:
  - Adds a slight layer of abstraction and class hierarchy compared to a raw object literal.

---

## 2. Pattern 2: Adapter Pattern (Structural)

### Category
**Structural Design Pattern**

### Problem Addressed
High-level application layers (such as the donor search API route handler, controllers, and unit tests) need to query for blood donors based on domain criteria (`bloodGroup`, `location`, `availableOnly`). 

If these high-level modules query Mongoose models directly, they become tightly coupled to Mongoose syntax (such as `$regex`, `$options: 'i'`, MongoDB projections, and ObjectId conversions). Furthermore, unit testing the search logic would require spinning up a live MongoDB instance or complex database drivers.

### Implementation and Usage
- **Classes/Interfaces**:
  - `DonorSearchCriteria`: Domain interface defining `{ bloodGroup?: string; location?: string; availableOnly?: boolean }`.
  - `DonorSearchResult`: Normalized Domain Transfer Object (DTO) containing `{ id, name, email, bloodGroup, location, availableToDonate }`.
  - `IDonorSearchService`: Standard target interface declaring `search(criteria: DonorSearchCriteria): Promise<DonorSearchResult[]>`.
  - `QueryableUserModel`: Interface abstracting the minimal model capability needed (`find().select()`).
  - `DonorSearchAdapter`: Concrete adapter that implements `IDonorSearchService` and adapts the query model to the domain interface.
- **Where It Is Used**:
  - In `src/app/api/donors/route.ts` inside the `GET` handler to translate URL query parameters into database searches.
  - In unit tests in `tests/patterns.test.ts` where a lightweight mock model is passed into the adapter without requiring any real MongoDB database.

### Alternative Rejected & Why
- **Alternative**: Direct inline Mongoose queries inside `src/app/api/donors/route.ts`:
  ```ts
  // Rejected approach:
  const donors = await User.find({
    role: 'DONOR',
    bloodGroup: req.query.bg,
    location: { $regex: req.query.loc, $options: 'i' },
    availableToDonate: true
  }).select('name email bloodGroup location');
  ```
- **Why Rejected**: Inlining database operators directly into HTTP handlers prevents query reuse, couples the presentation layer to MongoDB, and makes fast in-memory unit testing virtually impossible without heavy database mocking libraries.

### Benefits and Limitations
- **Benefits**:
  - Isolates Mongoose/MongoDB query dialect behind a clean domain interface.
  - Allows unit tests to verify search translation and result normalization using simple mock objects.
  - Future database migrations (e.g., to PostgreSQL or Prisma) would only require replacing the adapter, leaving route handlers and UI components untouched.
- **Limitations**:
  - Requires writing and maintaining adapter interfaces and classes.

---

## 3. Pattern 3: Observer Pattern (Behavioral)

### Category
**Behavioral Design Pattern**

### Problem Addressed
When a blood request status changes (such as when an admin transitions a request from `PENDING` to `APPROVED`), multiple downstream side effects may need to execute:
1. Writing a security audit log entry.
2. Alerting interested subscribers or notification dispatchers.
3. Updating real-time dashboards or analytics counters.

Hardcoding every follow-up action inside the `PATCH /api/requests/[id]` route handler leads to a bloated, brittle handler where any failure in a secondary task could compromise the main request update.

### Implementation and Usage
- **Classes/Interfaces**:
  - `StatusChangeEvent`: Event payload containing `{ requestId, previousStatus, newStatus, patientId, updatedBy, timestamp }`.
  - `IRequestStatusListener`: Observer interface declaring `onStatusChange(event: StatusChangeEvent): void | Promise<void>`.
  - `RequestStatusSubject`: Observable subject with `subscribe(listener)`, `unsubscribe(listener)`, and `notify(event)`.
  - `AuditLogSubscriber`: Concrete observer that logs status transition events with high-precision timestamps for compliance tracking.
  - `globalStatusSubject`: Singleton subject instance in `src/patterns/patterns.ts`.
- **Where It Is Used**:
  - In `src/app/api/requests/[id]/route.ts` upon successful status update.
  - In unit tests in `tests/patterns.test.ts`.

### Alternative Rejected & Why
- **Alternative**: Hardcoding consecutive synchronous calls directly in the route handler:
  ```ts
  // Rejected approach:
  await updateStatusInDb();
  await writeToAuditLog();
  await sendEmailToDonors();
  await pingHospitalDashboard();
  ```
- **Why Rejected**: This creates tight coupling and breaks the Open/Closed Principle. Adding a new listener requires editing the core status update endpoint. If one secondary action fails or takes time, it threatens the primary transaction.

### Benefits and Limitations
- **Benefits**:
  - Loose coupling between the request state machine and arbitrary side-effect subscribers.
  - Observers can be dynamically registered, removed, or replaced at runtime or during testing.
- **Limitations**:
  - In-memory observers operate within the active Node.js server instance; in multi-node production clusters, a distributed message broker (e.g., Redis Pub/Sub, RabbitMQ) would be required to broadcast across multiple physical servers.

---

## Summary Matrix

| Pattern Name | Pattern Type | Target Problem | BloodConnect Implementation | Location |
| :--- | :--- | :--- | :--- | :--- |
| **NotificationFactory** | Creational | Standardizing polymorphic notification creation | Builds `ApprovalNotification`, `RejectionNotification`, or `FulfillmentNotification` | `src/patterns/patterns.ts` |
| **DonorSearchAdapter** | Structural | Decoupling search queries from Mongoose syntax | Adapts domain criteria into MongoDB queries and normalizes DTOs | `src/patterns/patterns.ts` |
| **RequestStatusSubject** | Behavioral | Decoupling request state transitions from listeners | Broadcasts `StatusChangeEvent` to `IRequestStatusListener` subscribers | `src/patterns/patterns.ts` |

