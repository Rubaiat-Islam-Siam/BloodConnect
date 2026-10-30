# 🩸 BloodConnect — Simple e-Blood Management System

> **CSE 3206: Software Engineering Lab Project**  
> An educational, full-stack e-Blood Management System connecting voluntary blood donors with patients in urgent need, governed by strict administrative approval workflows.

---

## 1. Project Overview & Features

**BloodConnect** is designed to address emergency blood donor discovery and coordination in a clean, accessible, and structured manner. It enforces role-based access control and integrates three distinct software engineering design patterns.

### Key Roles & Capabilities:
- **Public**:
  - Educational homepage introducing blood donation and blood group classifications.
  - Public directory search for registered voluntary donors.
  - Secure login and registration.
- **Patient**:
  - Submit new blood requests specifying required blood group (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`), number of bags/units, and hospital location.
  - Track real-time status of submitted requests (`PENDING`, `APPROVED`, `REJECTED`, `FULFILLED`).
  - Strict privacy: Patients can only view and track their own requests.
- **Donor**:
  - Register with designated blood group and primary city/area location.
  - Toggle donation availability (`availableToDonate: true/false`) with one click.
  - Browse verified, approved patient blood requests in their area.
- **Admin**:
  - Protected central dashboard displaying overview statistics and all system requests.
  - Approve or reject pending requests.
  - Mark completed requests as fulfilled.
  - State changes trigger the **NotificationFactory** (Factory pattern) and **RequestStatusSubject** (Observer pattern).

> [!IMPORTANT]
> **Educational Disclaimer**: BloodConnect is an academic laboratory demonstration developed for university software engineering evaluation. It is not a medically certified blood-matching platform. Matching blood groups and locations does not guarantee clinical compatibility or patient suitability.

---

## 2. Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: HTTP-Only Secure Cookies + JWT ([jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Testing**: [Vitest](https://vitest.dev/) with V8 Test Coverage
- **Continuous Integration**: [GitHub Actions](https://github.com/features/actions)

---

## 3. Design Patterns Applied

All three design patterns reside in [`src/patterns/patterns.ts`](src/patterns/patterns.ts) and are actively utilized in application workflows:

1. **Factory Pattern (Creational) — `NotificationFactory`**:
   - Centralizes the creation of specialized in-app notification objects (`ApprovalNotification`, `RejectionNotification`, `FulfillmentNotification`).
   - Integrated into `src/app/api/requests/[id]/route.ts` when requests are approved or rejected.
2. **Adapter Pattern (Structural) — `DonorSearchAdapter`**:
   - Translates domain search criteria (`bloodGroup`, `location`, `availableOnly`) into low-level Mongoose query filters, returning normalized DTOs.
   - Integrated into `src/app/api/donors/route.ts` to isolate presentation layers and enable fast unit tests with mock repositories.
3. **Observer Pattern (Behavioral) — `RequestStatusSubject`**:
   - Defines a pub/sub event mechanism (`StatusChangeEvent`) notifying registered listeners (such as `AuditLogSubscriber`) whenever a blood request transitions status.
   - Integrated into `src/app/api/requests/[id]/route.ts`.

See detailed analysis in [`docs/design-patterns.md`](docs/design-patterns.md) and class diagrams in [`docs/uml.md`](docs/uml.md).

---

## 4. Project File Structure

```
bloodconnect/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI pipeline
├── docs/
│   ├── requirements.md            # SRS, user stories, incremental model
│   ├── design-patterns.md         # Factory, Adapter, Observer documentation
│   ├── uml.md                     # Mermaid class diagram
│   ├── testing-report.md          # TDD workflow and verified coverage report
│   └── git-workflow.md            # Branching, reviews, conflict resolution
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout with Navbar & Footer
│   │   ├── page.tsx               # Home landing page
│   │   ├── globals.css            # Tailwind CSS styling
│   │   ├── login/page.tsx         # User login page
│   │   ├── register/page.tsx      # Patient & Donor registration
│   │   ├── dashboard/page.tsx     # Role-based dashboard (Admin/Donor/Patient)
│   │   ├── donors/page.tsx        # Public donor search directory
│   │   ├── requests/page.tsx      # Blood requests feed & submission
│   │   └── api/
│   │       ├── auth/route.ts      # Authentication & session route handler
│   │       ├── donors/route.ts    # Donor search handler (Adapter Pattern)
│   │       └── requests/
│   │           ├── route.ts       # Requests collection handler
│   │           └── [id]/route.ts  # Request status handler (Factory & Observer)
│   ├── components/
│   │   ├── Navbar.tsx             # Navigation header with session profile
│   │   ├── DonorCard.tsx          # Donor card display component
│   │   └── BloodRequestForm.tsx   # Blood request creation form
│   ├── lib/
│   │   ├── mongodb.ts             # Cached Mongoose database connection
│   │   ├── auth.ts                # Password hashing, JWT & cookie utilities
│   │   └── request-validator.ts   # Input validation & state transitions
│   ├── models/
│   │   ├── User.ts                # Mongoose User schema & model
│   │   └── BloodRequest.ts        # Mongoose BloodRequest schema & model
│   └── patterns/
│       └── patterns.ts            # Factory, Adapter & Observer implementations
├── tests/
│   ├── patterns.test.ts           # Factory, Adapter & Observer unit tests
│   ├── auth.test.ts               # Security, password & authorization tests
│   └── request.test.ts            # Request validation & state transition tests
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore rules
├── package.json                   # Dependencies and npm scripts
├── tsconfig.json                  # TypeScript configuration
├── vitest.config.ts               # Vitest & V8 coverage configuration
└── README.md                      # Project manual
```

---

## 5. Getting Started & Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/<your-username>/bloodconnect.git
cd bloodconnect
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to create your local `.env.local` file:
```bash
cp .env.example .env.local
```

Open `.env.local` and configure your credentials:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/bloodconnect?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
ADMIN_SECRET_KEY=admin_initial_setup_secret_key_change_me
NODE_ENV=development
```

### Step 4: MongoDB Atlas Setup
1. Log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a free **M0 Sandbox** cluster.
3. Under **Database Access**, create a user (e.g. `bloodconnect_user`) with read/write permissions.
4. Under **Network Access**, add IP `0.0.0.0/0` (allow access from anywhere) or your local IP.
5. Click **Connect** → **Drivers** (Node.js) and copy the connection string into `MONGODB_URI` in `.env.local`.

### Step 5: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 6. How to Configure the Initial Admin Account

Public registration as an `ADMIN` is strictly forbidden by server-side validation to prevent unauthorized privilege escalation. To create the first administrator safely:

Use `curl` or Postman to make a POST request to `/api/auth`:

```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "seed-admin",
    "adminSecretKey": "admin_initial_setup_secret_key_change_me",
    "name": "System Administrator",
    "email": "admin@bloodconnect.com",
    "password": "AdminPassword123"
  }'
```

Once executed, you can log in directly at `http://localhost:3000/login` with:
- **Email**: `admin@bloodconnect.com`
- **Password**: `AdminPassword123`

---

## 7. Running Unit Tests and Generating Coverage

All unit tests are isolated using Vitest mocks, meaning **no live MongoDB connection is required to run tests**.

- **Run all unit tests**:
  ```bash
  npm test
  ```
- **Run tests in interactive watch mode**:
  ```bash
  npm run test:watch
  ```
- **Run tests with V8 coverage report**:
  ```bash
  npm run test:coverage
  ```

### Verified Test Results:
- **Total Tests**: 24 passed (100% pass rate)
- **Patterns Coverage**: 92.30%
- **Request Validator Coverage**: 100.00%
- Detailed report in [`docs/testing-report.md`](docs/testing-report.md).

---

## 8. Self-Directed Technique: GitHub Actions CI

### What is GitHub Actions?
GitHub Actions is a continuous integration and continuous delivery (CI/CD) platform that automates build, test, and deployment pipelines directly inside a GitHub repository.

### Why Was It Selected?
As the course self-directed learning technique, GitHub Actions was chosen to automate quality control. In modern software engineering teams, manual verification is prone to human error. Automating linting, test suites, and production builds ensures that broken code or regressions cannot be silently merged into `main`.

### How the Workflow Runs:
The pipeline defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) executes on every push and pull request to `main` and feature branches:
1. Provisions an `ubuntu-latest` runner.
2. Checks out repository code and sets up Node.js 20.
3. Installs clean dependencies via `npm ci`.
4. Executes `npm run lint` for coding style compliance.
5. Executes `npm run test:coverage` to verify that all 24 unit tests pass.
6. Executes `npm run build` to verify Next.js production compilation.

### What Was Learned:
- How to write declarative YAML workflows.
- How to run headless Vitest tests in isolated CI containers without requiring production database secrets.
- How CI gates prevent merge conflicts and syntax defects from affecting staging environments.

---

## 9. Project Limitations & Future Improvements

### Current Limitations:
1. **In-Memory Observer Scope**: The `RequestStatusSubject` runs in the Node.js server memory. In a distributed multi-server cluster, an external event bus (e.g., Redis Pub/Sub, Kafka) would be needed to synchronize events across instances.
2. **Simplified Matching**: Blood compatibility is evaluated based on ABO and Rh groups; real-world transfusions require biological laboratory cross-matching.
3. **Manual Donor Outreach**: Donors must be contacted via email/phone; automated SMS gateways were excluded to keep the scope appropriate for an academic lab.

### Future Improvements:
- Integration with hospital inventory APIs.
- Geo-distance calculation (Haversine formula) for precise donor proximity sorting.
- Multi-factor authentication (MFA) for administrative actions.

---

## 10. Summary of Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **Development** | `npm run dev` | Starts Next.js development server at port 3000 |
| **Build** | `npm run build` | Compiles production-optimized package |
| **Start** | `npm run start` | Runs production server after build |
| **Lint** | `npm run lint` | Runs ESLint across all source files |
| **Test** | `npm test` | Runs all 24 Vitest unit tests |
| **Watch Tests** | `npm run test:watch` | Runs Vitest in interactive watch mode |
| **Coverage** | `npm run test:coverage`| Runs Vitest and generates V8 coverage report |
