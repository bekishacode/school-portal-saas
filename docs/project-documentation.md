# School Portal SaaS — Project Documentation

A living reference for building a multi-tenant school management platform for primary and secondary schools, sold on a subscription basis with per-school branding.

---

## 1. Product vision

One shared platform, many schools ("tenants"), each with their own branding, data, and configuration — not a separate codebase per school. Schools pay a recurring subscription (per student/year or tiered by module). Customization happens through **configuration**, not code forks.

Two layers to build:

- **School App** — what registrars, teachers, students, and parents use daily.
- **SaaS Control Plane** — how you, the vendor, onboard schools, manage billing, and control tenant configuration.

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Backend | Node.js (NestJS) or Laravel (PHP) | NestJS if team is JS-first; Laravel is very fast for CRUD-heavy admin systems |
| Frontend | React or Vue + Tailwind CSS | Tailwind makes per-tenant theming straightforward |
| Database | PostgreSQL (preferred) or MySQL | Postgres has stronger support for row-level security, useful for tenant isolation |
| Auth | JWT + Role-Based Access Control (RBAC) | Roles: super-admin, school-admin, registrar, teacher, student, parent, librarian, accountant |
| File storage | S3-compatible object storage | Student documents, photos, report cards, receipts |
| Notifications | SMTP (SendGrid/Postmark) + SMS gateway | SMS gateway choice depends on target country (e.g., Africa's Talking) |
| Background jobs | Queue system (BullMQ for Node, or Laravel Queues) | For report card generation, bulk SMS/email, ranking recalculation |
| Hosting (start) | Single VPS (Hetzner/DigitalOcean) + Docker | Cheap and simple until you have paying tenants |
| Hosting (scale) | Managed cloud (AWS/GCP) with autoscaling | Move once revenue justifies the operational complexity |
| CI/CD | GitHub Actions | Automated testing + deployment on merge |

---

## 3. System structure

### 3.1 Multi-tenancy model

**Recommended: shared database, `school_id` column on every tenant-scoped table.**

- Simplest and cheapest to build and operate.
- Every query is scoped by `school_id`; enforce this at the ORM/query-builder level, never rely on the frontend to filter correctly.
- Postgres Row-Level Security (RLS) can enforce this at the database layer as a second line of defense.
- Revisit toward schema-per-tenant only if a large client demands stricter isolation, or once you're managing 50+ schools and want easier per-tenant backup/restore.

### 3.2 High-level architecture

```
SaaS control plane (you)
   ↓
School tenant (branded per school: logo, colors, subdomain)
   ↓
Role-based portals: Registrar | Teacher | Student/Parent | Library | Finance
   ↓
Shared academic engine (grading rules, averages, ranking, report cards)
   ↓
Database (school_id scoped)
```

### 3.3 Core entities (draft schema outline)

- `schools` — tenant record: name, subdomain, branding config, subscription tier, status
- `users` — polymorphic across roles, linked to `school_id`
- `students` — profile, guardian info, enrollment status, class/section
- `staff` — teachers, registrars, librarians, accountants, linked to `school_id`
- `academic_years`, `terms` — the calendar structure grading is built around
- `classes`, `sections`, `subjects` — academic structure
- `subject_teacher_assignments` — who teaches what, to which section
- `assessments` — quiz, midterm, final, coursework — each with a weight
- `scores` — student × subject × assessment, entered by teachers
- `grading_scales` — per-school configurable (e.g., A–F bands, pass mark, weighting rules)
- `attendance_records`
- `library_items`, `library_loans`
- `invoices`, `payments` (finance module)
- `audit_logs` — who changed what, when (critical for a system handling grades)

---

## 4. Development phases

### Phase 0 — Discovery (before writing code)
- Interview 2–3 real schools: registrar, teacher, and admin.
- Confirm grading/ranking rules, term structure, and promotion policy — these vary by school/country and are expensive to retrofit.
- Define your MVP feature cut based on what these schools actually need first.

### Phase 1 — MVP core
- Auth + RBAC (admin, registrar, teacher, student, parent)
- Student registration (self-service online application + admin approval)
- Academic structure setup: year, terms, classes, sections, subjects
- Gradebook: teachers enter scores; system computes averages, weighted totals, rank
- Auto-generated, downloadable report cards
- **Goal**: one pilot school running this end-to-end, even before multi-tenancy exists.

### Phase 2 — Multi-tenancy + branding
- Add `school_id` scoping across all tables
- Tenant onboarding flow (create school, set subdomain, upload logo/colors)
- Super-admin control plane: manage tenants, view usage, suspend/activate accounts
- Configurable grading scale per school (not hardcoded)

### Phase 3 — Stickiness features
- Attendance tracking
- Timetable/scheduling
- Parent portal + notifications (SMS/email for grades, attendance, announcements)
- Library module (catalog, issue/return, fines)

### Phase 4 — Revenue-expanding modules (sell as add-ons)
- Finance: invoicing, payment tracking, receipts, payment gateway integration
- HR/payroll for staff
- Analytics dashboards (school-wide performance trends)
- Custom fields per school (covers "we're different" requests without code changes)

### Phase 5 — Scale and harden
- Subscription billing automation (per-student pricing, tiered modules)
- Mobile app (parents/students) — often a strong upsell
- Performance tuning, backups, monitoring, formal SLA if selling to larger institutions

---

## 5. Security — non-negotiables for a system holding minors' data

Because this system handles student (often minors') personal data, grades, and payment information, treat security as a first-class requirement, not a later pass.

- **Tenant isolation**: every query must be scoped by `school_id` at the query layer, not just the UI. Add automated tests that verify one tenant cannot fetch another tenant's data.
- **RBAC enforcement server-side**: never trust the frontend to hide a button as your only protection — enforce permissions in the API layer for every endpoint.
- **Data encryption**: encrypt sensitive fields at rest (national ID numbers, payment info) and always use HTTPS/TLS in transit.
- **Password & auth hygiene**: hash passwords (bcrypt/argon2), support password reset flows safely, consider optional 2FA for admin/registrar roles.
- **Audit logging**: log who changed a grade, attendance record, or student profile, and when — parents and schools will ask for this, and disputes over grades are common.
- **Input validation & injection protection**: parameterized queries everywhere, strict validation on file uploads (type, size, virus scanning if possible).
- **Rate limiting & brute-force protection** on login and password-reset endpoints.
- **Backups**: automated daily backups, tested restore process — losing a term's grades is not recoverable goodwill.
- **Data privacy compliance**: research applicable regulations for the countries you sell into (data localization requirements, parental consent rules for minors' data). This matters more here than in most SaaS categories.
- **Least-privilege access for your own team**: even you shouldn't have unrestricted direct database access to production tenant data as a default habit.
- **Secure file storage**: signed, time-limited URLs for document/report-card downloads rather than public S3 buckets.
- **Dependency hygiene**: keep libraries patched; automate vulnerability scanning (e.g., `npm audit`/Dependabot).

---

## 6. Other things to plan for

- **Grading rule flexibility**: don't hardcode one grading formula — schools differ on weighting, pass marks, and rounding. Build this as configuration from day one; it's the single most common source of costly rework.
- **Offline/low-bandwidth tolerance**: many schools may have unreliable internet — design forms to handle slow connections gracefully (avoid large single-page loads, support retry-safe submissions).
- **Bulk operations**: CSV import/export for student lists and scores — registrars and teachers will not want to hand-enter hundreds of records.
- **Localization**: language and date-format flexibility if you plan to sell across regions.
- **Onboarding effort**: a school migrating from paper or Excel needs a smooth data-import path, or adoption will stall.
- **Pricing model clarity**: decide early — per-student/year, flat fee per school, or tiered by module — and make sure your subscription and billing logic in the control plane supports whichever you pick.
- **Support channel**: even a simple in-app "contact support" or WhatsApp/email channel matters a lot for non-technical school staff.

---

## 7. Quick-reference checklist (use this as you build)

- [ ] Phase 0 discovery interviews completed with 2–3 schools
- [ ] Core schema finalized (students, classes, subjects, terms, scores)
- [ ] RBAC implemented and tested server-side
- [ ] Grading/ranking logic configurable per school
- [ ] Report card generation working end-to-end
- [ ] Pilot school onboarded on MVP
- [ ] `school_id` scoping added across all tables + isolation tests written
- [ ] Branding/config layer for tenants built
- [ ] Audit logging in place for grade/attendance changes
- [ ] Backups automated and restore tested
- [ ] Payment/subscription billing flow implemented
- [ ] Data privacy review done for target country/countries
