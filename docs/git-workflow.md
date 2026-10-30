# Git Workflow & Configuration Management — BloodConnect

This document outlines the version control strategy, branch conventions, review processes, and GitHub Actions continuous integration workflow for the BloodConnect repository.

---

## 1. Branch Naming Conventions

All development activities must follow structured branch prefixes to ensure traceability:

| Branch Type | Prefix Pattern | Description & Example |
| :--- | :--- | :--- |
| **Feature** | `feature/<short-description>` | New feature development.<br>`feature/donor-search-adapter`<br>`feature/patient-request-submission` |
| **Bug Fix** | `fix/<bug-description>` | Resolving a bug or defect.<br>`fix/status-transition-validation`<br>`fix/cookie-samesite-policy` |
| **Testing** | `test/<suite-name>` | Adding or refining unit tests.<br>`test/notification-factory-unit`<br>`test/auth-coverage` |
| **Documentation** | `docs/<doc-title>` | Documentation and report updates.<br>`docs/requirements-specification` |

---

## 2. Meaningful Commit Message Standard

Commits should follow the Conventional Commits specification:
```text
<type>(<scope>): <concise present-tense description>

[Optional longer explanation of WHY the change was made]
```

### Examples:
- `feat(patterns): implement NotificationFactory and unit tests`
- `feat(auth): add bcryptjs password hashing and role validation`
- `fix(routes): enforce role check in status update route handler`
- `test(patterns): add mocked model tests for DonorSearchAdapter`
- `docs(uml): add Mermaid class diagram for domain models and patterns`

---

## 3. Pull Request (PR) & Code Review Procedure

### Workflow Steps:
1. **Create Branch**: Check out a new branch from `main`:
   ```bash
   git checkout -b feature/donor-search
   ```
2. **Commit Changes**: Stage and commit code with meaningful messages:
   ```bash
   git add .
   git commit -m "feat(donors): add DonorSearchAdapter and query parameters"
   ```
3. **Push & Open PR**:
   ```bash
   git push origin feature/donor-search
   ```
   Open a Pull Request on GitHub targeting `main`.
4. **Automated CI Check**: GitHub Actions automatically triggers linting, test suite execution, coverage verification, and production build.
5. **Peer Review**: A peer or lab instructor reviews the PR for coding standards, edge cases, and design pattern correctness.

---

## 4. Realistic Code Review Scenarios

### Scenario A: Accepted Review (Passed)
- **PR Title**: `feat(patterns): implement NotificationFactory with polymorphic subclasses`
- **Reviewer Feedback**:
  > *"The factory correctly returns distinct notification classes for APPROVED, REJECTED, and FULFILLED. The TypeScript interfaces are clean and runtime error handling covers invalid status arguments. Unit tests in `tests/patterns.test.ts` pass with 100% branch coverage on the factory. LGTM!"*
- **Outcome**: **Approved and Merged**.

### Scenario B: Rejected / Revised Review (Changes Requested)
- **PR Title**: `feat(auth): enable registration API route`
- **Reviewer Feedback**:
  > *"Changes requested: The registration endpoint currently accepts `role = "ADMIN"` if supplied in the request body. In a multi-role blood management system, public users must never be allowed to self-appoint as administrators. Please add server-side validation to reject `role === 'ADMIN'` on public registration, and provide a secure mechanism for seeding the initial admin."*
- **Resolution**:
  - Added strict check in `src/lib/auth.ts`:
    ```ts
    if (data.role === 'ADMIN') {
      errors.push('Public registration as ADMIN is strictly prohibited.');
    }
    ```
  - Added unit test in `tests/auth.test.ts` confirming the rejection.
  - Re-submitted for review and **Approved**.

---

## 5. Merge Conflict Resolution Procedure

When two branches modify overlapping lines (e.g., `feature/donor-search` and `feature/request-updates` modifying `src/patterns/patterns.ts`), follow this standard procedure:

```bash
# 1. Fetch latest changes from main
git checkout main
git pull origin main

# 2. Switch back to your feature branch
git checkout feature/donor-search

# 3. Merge main into your feature branch
git merge main

# Git will alert: CONFLICT (content): Merge conflict in src/patterns/patterns.ts

# 4. Open the conflicting file in your editor and look for markers:
# <<<<<<< HEAD (your branch changes)
# =======
# >>>>>>> main (incoming changes from main)

# 5. Resolve the conflict by keeping the appropriate code from both sides,
#    then remove the conflict markers (<<<<<<<, =======, >>>>>>>).

# 6. Re-run tests to confirm everything still works
npm test

# 7. Stage and commit the resolved files
git add src/patterns/patterns.ts
git commit -m "merge: resolve merge conflicts with main in patterns module"

# 8. Push the resolved branch
git push origin feature/donor-search
```

---

## 6. GitHub Actions CI Workflow

The repository includes an automated continuous integration pipeline at `.github/workflows/ci.yml`.

### Workflow Configuration:
```yaml
name: BloodConnect CI

on:
  push:
    branches: [ "main", "feature/**", "fix/**", "test/**" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run lint check
        run: npm run lint

      - name: Run unit tests with coverage
        run: npm run test:coverage

      - name: Build production package
        run: npm run build
        env:
          NODE_ENV: production
```

### What It Does on Every Push & PR:
1. Spins up a clean Ubuntu container.
2. Checks out the repository code.
3. Sets up Node.js 20 with npm caching.
4. Executes `npm ci` for deterministic dependency installation.
5. Runs `npm run lint` to enforce code quality.
6. Runs `npm run test:coverage` to execute all 24 unit tests.
7. Executes `npm run build` to confirm production build compilation.

