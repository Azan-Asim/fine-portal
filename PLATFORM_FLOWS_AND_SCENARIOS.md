# Fine Portal - Integrated Flows and Scenarios

## 1. Purpose
This document summarizes all currently integrated user flows and business scenarios in the Fine Portal platform, based on the active codebase as of 8 April 2026.

## 2. Platform Scope
The portal supports these operational domains:
- Role-based authentication and access routing
- Employee lifecycle and profile management
- Attendance tracking and daily reporting
- Performance tracking and reviews
- Penalty issuance, payment, and verification
- Payroll generation and salary-slip distribution
- Company expenses, penalty expenses, and company income
- Company asset allocation tracking
- Project document management with access control
- Rule acknowledgement flow (feature-wired, currently API-disabled)

## 3. Roles and Access Model
Active roles in the platform:
- admin
- hr
- manager
- lead
- employee

Access behavior:
- Full-access roles: admin, hr, manager
- Team-view roles: lead, manager, hr, admin
- Employee management roles: manager, hr, admin
- Weekly performance edit roles: lead, manager
- Final review edit roles: hr, admin
- Rules-gate bypass: admin only

Multi-role behavior:
- Users can have multiple roles and switch active role from the sidebar.
- Home redirect is role-derived:
  - any full-access role -> /admin/dashboard
  - otherwise -> /employee/dashboard

## 4. End-to-End Core Flows

### 4.1 Authentication and Session Flow
Scenario: user opens portal
1. Root route checks session user.
2. If not logged in -> redirect to /login.
3. If logged in -> redirect to role-specific dashboard.

Scenario: login with email
1. User enters email.
2. System validates email against registered employees list.
3. On success, user session is stored in localStorage.
4. User is redirected to dashboard based on role set.

Scenario: login with Google
1. Google identity token is decoded in client.
2. Verified email is matched against registered employees list.
3. On success, session is persisted and user is redirected.

Failure scenarios:
- email not registered by admin -> login denied
- Google token invalid/unverified -> login denied
- employee lookup failure -> login denied with error

### 4.2 Layout Guard and Authorization Flow
Scenario: access admin area
1. Admin layout checks authentication.
2. Confirms assigned roles include at least one full-access role.
3. If no access -> redirect to employee dashboard.

Scenario: access employee area
1. Employee layout checks authentication.
2. Confirms assigned roles include at least one non-full-access role.
3. If no access -> redirect to admin dashboard.

### 4.3 Rules Gate Flow
Expected design scenario:
1. On protected layout load, rules are fetched by role.
2. If applicable rules exist and user has not accepted latest version, modal blocks workflow.
3. User must accept to continue.

Current integrated state:
- Rules UI and data actions are implemented.
- Rules API usage is feature-toggled off in UI components (ENABLE_RULES_API = false).
- Current runtime behavior is fail-open (no blocking in normal flow).

## 5. Functional Module Scenarios

### 5.1 Employees Module
Primary route: /admin/employees

Scenarios:
- Add employee with profile, bank, role(s), department, lead mapping, status
- Edit employee details and role/permission assignment
- Delete employee record
- Search and filter employee list
- Optional profile image upload

Permission-specific scenario:
- Fine-grained permission management is available only to authorized users.

### 5.2 Attendance Module (Admin)
Primary routes:
- /admin/attendance
- /admin/attendance/[employeeId]

Scenarios:
- Mark attendance per employee per date
- Set day type (working day or holiday)
- Add present/absent/leave records
- For present records, capture sessions and break windows
- Save and upsert attendance entries
- View employee monthly summary details
- Export employee monthly attendance/performance PDF

Performance review scenario from detail page:
- lead/manager can save weekly comments and scores
- hr/admin can save final monthly comment and score

### 5.3 Attendance + Daily Work Report Module (Employee)
Primary route: /employee/attendance

Scenarios:
- Submit daily check-in
- Submit daily check-out after check-in exists
- Daily submissions merge into daily attendance summary
- Hours and late flags are computed by backend logic
- Historical lock policy and monthly payroll integration are supported via backend actions

### 5.4 Performance Module
Primary route: /employee/performance

Scenarios:
- employee: view own monthly attendance/performance metrics
- lead: view own and direct-report records; edit weekly comments/scores
- full-access roles: broader employee selection and review visibility
- export attendance/performance PDF

### 5.5 Penalty Module
Primary routes:
- /admin/issue-penalty
- /admin/penalties
- employee dashboard penalty panel
- /bank-info

Admin scenarios:
- Issue penalty against employee
- Include reason, amount, date, optional evidence URL
- Trigger penalty email notification
- View penalties with status filters and proof viewing
- Mark penalties paid manually
- Delete penalties

Employee scenarios:
- View own penalties
- Open bank info page for payment details
- Submit payment details with screenshot proof
- Await admin verification (status transitions)

### 5.6 Payroll Module
Primary route: /admin/payroll
Related route: /employee/salary-slips

Admin scenarios:
- Build payroll draft by selecting employees
- Define cheque info, month/year, per-employee amounts
- Generate payroll PDF letter
- Save payroll record history
- Upload cheque/payment proof
- Mark salary received/distributed
- Generate salary slips for payroll batch
- Load historical slips by payroll

Employee scenarios:
- View own generated salary slips
- Download printable salary slip documents

### 5.7 Finance Module (Expenses + Income)
Primary route: /admin/expenses

Integrated tabs/scenarios:
- Penalty expenses
  - add and delete entries
  - view summary against penalties
- Company expenses
  - add/edit/delete entries
  - paginated table, filter by month, paid by, approved by, search text
  - permission-aware read/edit controls
- Company income
  - add and delete entries
- Reports
  - month/year finance reporting
  - PDF export paths via report components

Additional control scenario:
- Authorized approver configuration for expense categories is persisted in localStorage.

### 5.8 Company Assets Module
Primary routes:
- /admin/assets
- /employee/assets

Admin/HR scenarios:
- Add asset and assign to resource
- Edit allocation and lifecycle fields
- Delete asset entry
- Search assets and monitor assignment stats

Employee/other non-manage scenarios:
- View only assets allocated to own account

### 5.9 Projects and Documents Module
Primary routes:
- /admin/projects
- /employee/projects
- /admin/projects/[projectId]
- /employee/projects/[projectId]

Scenarios:
- List projects and project document counts
- Open project document board
- Search project documents
- Upload document with metadata and file
- Assign document access list at upload time (for authorized roles)
- Preview/download document if allowed
- Update document access list (authorized roles)
- Restrict visibility using role + explicit access-list controls

### 5.10 Rules Management Module
Primary routes:
- /admin/rules
- /employee/rules

Scenarios wired in UI:
- View rules by role scope
- Add/edit/delete rule records
- Control active flag and sort order

Current runtime note:
- Because rules API toggle is off in the UI, rule persistence and enforcement flows are present but not currently active in normal execution.

## 6. Dashboard Scenarios

### 6.1 Management Dashboard (/admin/dashboard)
Scenario coverage:
- Aggregated company metrics (employees, projects, finance, payroll, net)
- Role-specific card sets for admin/hr/manager
- Charts for finance, attendance, performance, role/department distribution
- Recent activity tables (penalties, expenses, payroll, employees)
- Refresh flow to re-query consolidated backend bundle

### 6.2 Staff Dashboard (/employee/dashboard)
Scenario coverage:
- Personal penalties and status breakdown
- Monthly attendance and performance snapshot
- Salary slip summary
- Penalty payment submission modal with proof upload
- Lead-only team mini-analytics for direct reports

## 7. Integration and Data Flows

### 7.1 Data Service Pattern
All modules call a centralized frontend service layer in src/lib/googleSheets.ts.

Service capabilities include:
- CRUD and workflow actions for employees, penalties, expenses, incomes, assets
- attendance and performance upsert/retrieval
- payroll records and salary-slip generation/retrieval
- projects/document upload/access updates
- dashboard bundle endpoints
- daily work report and monthly payroll automation endpoints

### 7.2 API Proxy Flow
Route: /api/google-sheets (POST)

Flow:
1. Client sends { action, payload }.
2. API route forwards request to configured Apps Script URL.
3. Route validates Apps Script response handling edge cases:
   - missing config
   - non-JSON responses
   - redirects to Google sign-in
4. Parsed response is returned to client.

### 7.3 External Integrations
- Google Apps Script / Google Sheets as primary backend datastore
- EmailJS for penalty email notifications
- Image upload utility for payment proofs, employee photos, cheque proofs, and other documents
- PDF generation utilities for attendance reports, payroll letters, salary slips, and finance reports

## 8. Scenario Matrix (At-a-Glance)

### Admin / HR / Manager side
- Login and role-routed dashboard
- Employee CRUD and role/permission setup
- Attendance marking and monthly employee detail review
- Performance scoring (weekly/final depending on role)
- Penalty issuance and settlement management
- Payroll lifecycle and salary-slip generation
- Finance entries and monthly reporting
- Asset inventory and allocation
- Project document governance

### Employee / Lead side
- Login and staff dashboard
- Daily attendance and work reporting
- Penalty visibility and payment proof submission
- Salary slip download
- Own performance visibility
- Lead team performance input and team insights
- Project document consumption and upload (where permitted)
- Asset visibility (assigned assets)

## 9. Important Operational Notes
- Rules workflows are implemented but feature-toggled off at UI level.
- Some operational configs are localStorage-backed (for example, approver config and session/rules cache).
- API reliability depends on a correctly deployed and publicly accessible Apps Script /exec endpoint.
- Multiple modules enforce behavior at UI level plus route guard level; final authoritative validation is expected at backend action handlers.

## 10. Suggested Next Documentation Add-ons
- End-to-end sequence diagrams per module
- API action contract reference (action names + payload schemas)
- Role-permission matrix table with module-level CRUD granularity
- Production hardening checklist (audit logs, backend enforcement, observability)
