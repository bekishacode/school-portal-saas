<!-- testing CI and branch protection pipeline -->
# School Portal SaaS

Multi-tenant school management platform for primary and secondary schools — student registration, gradebook with automatic averages/ranking, and role-based portals for registrar, teacher, student/parent, library, and finance.

Full project reference: see [`docs/project-documentation.md`](./docs/project-documentation.md).

## Stack

- **Backend**: NestJS + TypeScript, PostgreSQL, TypeORM
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Shared types**: `packages/shared-types`
- **Local dev**: Docker Compose (Postgres + API + Web)

## Project structure

```
school-portal-saas/
├── apps/
│   ├── api/              # NestJS backend
│   │   └── src/
│   │       ├── common/   # guards, decorators (RBAC, tenant isolation)
│   │       ├── modules/  # auth, schools, students, academic, grading
│   │       └── config/
│   └── web/               # Next.js frontend
│       └── src/
│           ├── app/       # pages/routes
│           ├── components/
│           └── lib/
├── packages/
│   └── shared-types/       # TypeScript types shared by api and web
├── docs/
│   └── project-documentation.md
├── docker-compose.yml
└── .env.example
```

## Getting started

### 1. Prerequisites
- Node.js 20+
- Docker (for local Postgres, or install Postgres locally)

### 2. Setup
```bash
git clone <your-repo-url>
cd school-portal-saas
cp .env.example .env       # fill in real values
npm install                # installs all workspaces
```

### 3. Run the database
```bash
docker compose up -d postgres
```

### 4. Run the backend
```bash
npm run dev:api
# API available at http://localhost:4000
```

### 5. Run the frontend
```bash
npm run dev:web
# Web available at http://localhost:3000
```

## Development order

Follow the phased roadmap in `docs/project-documentation.md`:

1. **Phase 1 (MVP)**: auth + RBAC, student registration, academic structure, gradebook, report cards
2. **Phase 2**: multi-tenancy (`school_id` scoping) + branding
3. **Phase 3**: attendance, timetable, parent notifications, library
4. **Phase 4**: finance, HR, analytics, custom fields
5. **Phase 5**: billing automation, mobile app, scale/harden

## Security reminders (see docs for full list)

- Every query must be scoped by `school_id` — enforced via `TenantGuard`, never trust the frontend alone.
- Every protected endpoint must declare roles via `@Roles(...)` — enforced via `RolesGuard`.
- Never commit `.env` — only `.env.example` is tracked.

## License

Proprietary — all rights reserved (update this once you decide on licensing terms for resale).
