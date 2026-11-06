# 2026-10-31 â€” Admin access control and QA hardening

## 2026-11-03 â€” Scheduled task timers, moving timeline, and sound reminders

### Roadmap and approach

1. Trace task fields from editor to API, service, database, and timeline. Reuse the existing `durationMinutes`, `startTime`, `dueTime`, and `dueDate` fields so timer state remains derived rather than introducing a second persisted clock.
2. Keep the timer based on the device's local clock. Calculate `now - scheduled start` on each refresh so tab throttling, sleep, or a clock adjustment does not accumulate interval drift.
3. Extract UI and overlap positioning into small components/utilities. The timeline parent and task editor were already large; the feature components stay narrowly scoped and new files remain below 250 lines.
4. Add an in-app tone behind a user-controlled sound switch. Browser audio requires a user gesture, so the switch both enables sound and primes the audio context.

### What changed and why

- `components/task/TaskDurationField.tsx` adds a 1â€“1440 minute duration control for ordinary tasks. Event duration continues to use the existing event details form.
- `components/task/DetailScreen.tsx` now saves duration for either task type and preserves it when switching between task and event. Meeting link and location remain event-only.
- `services/taskService.ts` persists task duration on create and update, including the current-occurrence branch for repeating tasks. No migration is needed because `duration_minutes` already exists.
- `utils/taskTimer.ts` derives a timer's start, elapsed time, remaining time, and completion from the scheduled local date/time and duration. Example: a task scheduled for 09:00 with `durationMinutes: 25` shows 25:00 at 09:00, 10:00 at 09:15, and â€œTimer completeâ€ from 09:25 onward.
- `components/task/TaskTimerLabel.tsx` refreshes each second and recalculates from the device clock. `components/task/TaskTimelineGrid.tsx` presents it inside each active timed task.
- `utils/positionTimelineTasks.ts` owns time conversion and overlap lane assignment, keeping schedule calculation separate from JSX rendering.
- `components/task/TaskTimeline.tsx` shows a 12-hour window for today, starting up to three hours before the current local hour; it refreshes on a minute tick and when the tab regains focus. Other dates remain a full-day view. Quick add maps clicks to the visible local-time window.
- `components/ui/InAppTaskReminders.tsx` adds a short synthesized tone and a persistent Sound on/off control (`localStorage` key `taskflow-reminder-sound`). The existing reminder still appears two minutes before the scheduled start.

### Implementation example and component references

```ts
const timer = getTaskTimerState(task, new Date());
// { started, complete, remainingMs, elapsedMs, startAt }
```

```tsx
<TaskDurationField value={form.durationMinutes ?? null} onChange={setDuration} />
<TaskTimerLabel task={task} />
```

The data path is `DetailScreen â†’ TaskDurationField â†’ saveTask/API â†’ taskService â†’ duration_minutes`. The display path is `TaskTimeline â†’ positionTimelineTasks â†’ TaskTimelineGrid â†’ TaskTimerLabel â†’ taskTimer`. Reminder audio stays in the existing in-app reminder component and does not require a new external audio asset or push permission.

### Challenges, decisions, and audit notes

- Duration existed in storage and DTOs, but the server and editor explicitly cleared it for ordinary tasks. The fix removes that type-specific clearing without changing event fields.
- The database stores date and time separately. Timer calculation constructs a local `Date(year, month, day, hour, minute)` so it follows the device timezone and avoids parsing date-only values as UTC.
- A browser cannot reliably play sound before a user gesture, and an in-app notification only runs while the app page is open. The explicit switch satisfies the gesture requirement; background/closed-app sound still needs platform push notifications and service-worker capabilities.
- Timers are display state only; task completion is not automatically changed when duration expires. This avoids changing task lifecycle semantics without a product rule.
- Today's view refreshes every minute and on focus; each task countdown refreshes every second. Both calculate from current device time rather than decrementing stored counters.
- Existing `TaskTimeline.tsx` and `DetailScreen.tsx` remain over 250 lines after extracting the new feature-specific pieces. Newly added files are each under 250 lines; shrinking those legacy components further requires broader refactoring outside this feature.

### Verification status

- `git diff --check` completed without whitespace errors.
- Reviewed task model/API/service/editor/timeline/reminder paths. No environment files were accessed.
- Tests, lint, TypeScript compilation, and database operations were not run.

## Roadmap and approach

1. Map authentication, feature routes, integrations, and data model before changing authorization. This exposed JWT-only identity checks, existing CDF preferences, and Web Push credentials embedded in source.
2. Add additive, migration-backed role, feature-grant, and service-switch data. Defaults preserve existing user feature access and enabled integrations.
3. Enforce authorization server-side against the current database role and feature grants. A hidden link or disabled browser control is not a security boundary.
4. Provide an admin API and UI to inspect accounts and change roles, per-user feature access, and global email/push switches.
5. Gate integration delivery in its service path, remove embedded push signing keys, and document setup, examples, and audit limits.

## What changed and why

- `db/schema.ts` and `drizzle/0008_admin_access_control.sql` add `users.role`, the `user_permissions` feature overrides, and global `platform_settings` switches. The migration is additive; no account is silently made an administrator.
- `services/accessControlService.ts` centralizes role, per-feature, and service-switch reads/writes. Missing per-user overrides preserve current access; missing global service rows preserve current integration behavior.
- `middlewares/authMiddleware.ts` rechecks the persisted account role for authenticated API requests and provides `withFeatureAuth`. This makes role revocation take effect immediately instead of waiting for token expiry.
- `app/api/admin/route.ts` exposes an authenticated, admin-only read/update boundary. Zod schemas reject unknown or malformed actions; the API prevents self-demotion and checks target users.
- `app/admin/page.tsx` provides role selection, feature checkboxes per user, and global email/push switches. Access is still decided by the API.
- CDF preference reads/writes honor feature grants. `services/notificationService.ts` honors the global push switch and per-user notification grant before sending.
- `lib/webpush.ts` no longer embeds a private signing key. It expects deployment-provided `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, and `VAPID_PRIVATE_KEY` configuration and errors when unavailable.

## Example: per-user feature grant

```ts
await setUserFeature(userId, "cdf", false);
const allowed = await canAccessFeature(userId, "cdf"); // false for a non-admin
```

An admin account retains administrative feature access; a user grant controls the selected feature for a standard account. To gate another API handler, wrap it with `withFeatureAuth("lists", handler)`. To control an outbound service, call `isServiceEnabled("email")` immediately before delivery.

## Example: global integration switch

```ts
await setGlobalService("push", false);
if (!(await isServiceEnabled("push", userId))) return;
await sendPushNotification(subscription, payload);
```

Keep secrets in the deployment secret manager. Service switches are operational controls, not substitutes for provider credentials or a user's consent.

## Challenges and audit findings

- There is no existing admin role, admin account, or trusted first-admin bootstrap process. The migration defaults everyone to `user`; therefore an operator must establish the first admin through a controlled, out-of-band database operation after migration. Picking an email from the project or environment would be an unsafe assumption.
- Feature access enforcement has been connected for CDF and notification delivery. Existing task and list routes remain authenticated and owner-scoped, but are not yet wrapped in feature gates. The `withFeatureAuth` helper is available for completing that route-by-route rollout. `email` is represented in the global switch but is not yet wired to the mailer; mail is used for registration verification and password reset, so disabling it requires a product decision about account lifecycle behavior.
- The email switch currently has no effect on email delivery until mailer call sites check it. The push switch and the `notifications` grant are checked by the reminder job; push subscription registration itself still needs the same gate before the UI should present permission controls.
- The push private key previously present in source should be treated as compromised and rotated in deployment. No secret value was read from `.env`.
- Admin changes currently have no durable actor/action audit-log table. Operational deployments should add append-only audit records before delegating admin access broadly.
- Existing README architecture descriptions conflict with this repository's PostgreSQL/Drizzle implementation. Update relevant technical docs from code and migrations rather than treating the old MongoDB descriptions as authoritative.

## QA / verification status

- Inspected route/service/schema call paths and working-tree status; `.env` was not opened.
- TypeScript, ESLint, migration generation, and database migration have not yet been run. No test suite was run.
- First-admin bootstrap, mail-service semantics, audit-log retention, and full task/list route gate rollout need explicit product/operator decisions.

## Monorepo admin workspace â€” 2026-10-31

### Roadmap and architecture

1. Keep the existing TaskFlow backend and consumer app at the repository root, since its API, schema, migrations, and npm dependencies already live there.
2. Create `admin/` as an independent Next.js workspace with its own application routes, package manifest, and port. This makes the admin UI separately runnable/deployable while keeping one repository and shared dependency installation.
3. Route `/api/*` from the admin Next.js app to the TaskFlow backend using `TASKFLOW_API_URL`. The admin browser calls same-origin `/api/...`; the backend continues to validate bearer tokens and administrator role.
4. Keep admin mutations in the backend only. The admin app has no database connection and cannot grant itself roles.

### What changed and why

- Root `package.json` now declares the `admin` npm workspace and adds `admin:dev`, `admin:build`, and `admin:start` scripts.
- `admin/package.json`, `admin/next.config.ts`, `admin/tsconfig.json`, and `admin/postcss.config.mjs` define the standalone console application. Run `npm run admin:dev` from the repository root; it listens on port 3001.
- `admin/app/` holds the admin layout, sign-in, and user/service management console, independent from TaskFlow's consumer router.
- Root `app/api/admin/route.ts` remains the privileged control boundary. `admin/next.config.ts` rewrites the workspace's API paths to the backend configured in `TASKFLOW_API_URL`.
- `.gitignore` excludes the admin app's generated build output.

### Example local topology

```text
work flow/                 root npm workspace + TaskFlow API/database
â”œâ”€â”€ admin/                  standalone Next.js admin UI (port 3001)
â”œâ”€â”€ app/api/admin/          admin authorization and mutation API
â”œâ”€â”€ db/                     shared PostgreSQL schema
â””â”€â”€ drizzle/                additive SQL migrations
```

Set `TASKFLOW_API_URL` in the admin deployment configuration to the origin hosting the root TaskFlow app. Do not put database credentials in the admin workspace. Admin sign-in uses the root `/api/auth/login` endpoint through the rewrite; management calls use the returned short-lived bearer token and the root admin API.

### Monorepo QA and remaining work

- Each new TypeScript/TSX source file is under 250 lines.
- TypeScript/build verification remains unavailable in this environment: local Node/npm executables were denied by the execution policy. `git diff --check` was used for whitespace validation.
- The npm workspace lockfile still needs regeneration by `npm install` in an environment where npm is allowed. The current `package-lock.json` predates the admin workspace.
- First-admin bootstrap remains a controlled operator action after applying migration 0008. The admin app intentionally does not create or assume its first administrator.
- For production, deploy `admin/` and the root TaskFlow app as separate Next.js services in the same monorepo; set `TASKFLOW_API_URL` to the root service origin and keep the admin workspace's API rewrite on the server side.

## Admin sign-in HTML response fix â€” 2026-10-31

The sign-in screenshot showed an HTML document being parsed as JSON. The admin app had no explicit `/api` route when `TASKFLOW_API_URL` was unset or unavailable, so the request could fall through to a Next.js page/404.

- Replaced the conditional rewrite with `admin/app/api/[...path]/route.ts`, a server-side proxy that always handles API requests.
- Missing backend configuration now returns a JSON `503`; backend connection failures return JSON `502`; normal status/body/content type pass through from TaskFlow.
- Admin sign-in and API calls validate the response content type before JSON parsing and show a useful setup error rather than a parser exception.
- Configure `TASKFLOW_API_URL` as the TaskFlow backend origin (for local development, the root app origin) in the admin process environment, then restart the admin server. Do not put the database URL in this setting.
- QA: source review and `git diff --check`; runtime build/test remains unverified because local Node/npm execution is restricted.

## Root environment loading fix â€” 2026-10-31

The user had configured `TASKFLOW_API_URL` in the repository-root `.env`, but the separate Next.js workspace is rooted at `admin/` and did not load that root file. The admin API therefore returned its missing-config 503.

- `admin/next.config.ts` now loads the repository-root `.env` through dotenv before Next config is evaluated. Existing process-level deployment variables take precedence because dotenv does not override them by default.
- `dotenv` is declared directly by the admin workspace.
- The 503 message now distinguishes the admin process environment from the root `.env` location.
- Restart the admin dev server after this config change so Next reads the root settings.
- Do not copy database credentials into the admin app; `TASKFLOW_API_URL` is only the TaskFlow web origin.

## 2026-11-03 — Replace email links with OTP verification

### Roadmap and approach

1. Trace registration verification and password reset through mail templates, database fields, APIs, auth hook, and screens. Registration already uses a six-digit OTP; password reset was the remaining email-link flow.
2. Reuse the established OTP pattern: cryptographically random six-digit code, SHA-256 hash stored in the user row, 10-minute expiry, and a single-use reset operation.
3. Change reset email/UI/API together so no user-facing password reset URL or bearer reset token remains. Add a database migration to replace legacy reset-token columns.
4. Preserve generic forgot-password responses and rate limiting to avoid leaking registered email addresses or enabling unbounded code guesses.

### What changed and why

- `services/authService.ts` now issues a six-digit password reset OTP and validates email + OTP + expiry before changing the password. The conditional database update consumes the code once and prevents concurrent reuse.
- `lib/mailer.ts` sends the code in the password reset email and no longer constructs a reset URL.
- `app/api/auth/reset-password/route.ts` accepts email and a six-digit OTP instead of a URL token. The existing rate limit remains active.
- `app/(auth)/reset-password/page.tsx` now collects email, code, and new password; it does not read or require query-string tokens.
- `app/(auth)/forgot-password/page.tsx` explains the OTP flow and directs users to enter the code. `register` and `login` copy now refer to verification codes, matching the already-OTP-based registration API.
- `db/schema.ts`, `types/auth.ts`, and `drizzle/0009_password_reset_otp.sql` replace legacy reset-token fields with `reset_password_otp_hash` and `reset_password_otp_expiry`. The migration is journaled as 0009.
- `lib/jwt.ts` no longer signs or verifies email-purpose JWTs, so `JWT_EMAIL_SECRET` is no longer required. README setup instructions were updated accordingly.

### Implementation example and component references

```ts
// Request: POST /api/auth/forgot-password
{ "email": "person@example.com" }

// Complete: POST /api/auth/reset-password
{ "email": "person@example.com", "otp": "123456", "password": "SecurePass1", "confirmPassword": "SecurePass1" }
```

The code path is `ForgotPasswordPage ? useAuth.forgotPassword ? forgot-password API ? authService ? sendPasswordResetEmail`. Completion flows `ResetPasswordPage ? useAuth.resetPassword ? reset-password API ? conditional one-time DB update`.

### Challenges and audit notes

- The app had mixed patterns: registration was OTP-based already, while password reset emailed a signed URL token. This change aligns both email verification tasks on codes.
- Six-digit codes have a small search space. They are stored as hashes, expire in 10 minutes, consumed once, and the reset API remains rate limited. Production deployments should also enforce request throttling at the edge and monitor abuse.
- Generic forgot-password responses remain the same for known and unknown email addresses. The reset form requires the email again; neither the email nor reset secret is placed in a URL.
- Existing outstanding reset links stop working after migration; users can request a fresh code. The migration must be applied before deploying the new service code.
- The generic URL builder and its unit test remain in the repository, but no authentication email or screen uses a verification/reset URL now.

### Verification status

- Searched auth screens, APIs, services, and mailer for reset/verification URL flows; no auth email link path remains.
- `git diff --check` passed and the migration/schema were reviewed. Tests and database migration have not been run.
- No environment files were accessed.

## 2026-11-03 — Whole-system Software Design Document

### Roadmap and approach

1. Inventory application routes, services, types, schema/migrations, UI pages/components, hooks, integrations, and admin workspace. The design should reflect checked-in implementation, not older README architecture prose.
2. Describe the system in layers: whole-system architecture and actors; feature behavior and workflows; API contracts and data model; module/function responsibilities; security, operations, and audit findings.
3. Trace critical user flows from UI through hook, route, service, persistence/provider, and back to the UI. This makes ownership and failure boundaries clear for an implementer.
4. Mark source-derived facts separately from deployment assumptions. Do not open environment files, query a database, run migrations, or claim runtime verification as part of a documentation pass.
5. Record findings and learning examples here so the SDD is useful for implementation and review, not only as a feature list.

### What changed and why

- Added SDD.md, a detailed as-built design for TaskFlow's consumer app, PostgreSQL/Drizzle persistence, App Router APIs, standalone admin workspace, browser/offline layer, SMTP, Web Push, and CDF.
- The document describes each user-facing feature, route family, important service function, hook, page/component, data table, and end-to-end workflow. It includes architecture and sequence diagrams, request/data-flow examples, API and runtime configuration catalogs, security boundaries, non-functional requirements, operational dependencies, and audit recommendations.
- Added a route handler register and feature-to-code traceability examples. For example, email reset follows ResetPasswordForm -> useAuth.resetPassword -> reset-password route -> resetPassword -> conditional DB update; timed task display follows TaskTimeline -> TaskTimelineGrid -> TaskTimerLabel -> getTaskTimerState.
- The SDD records the source-discovered nested task route parameter mismatch and the Drizzle snapshot/journal mismatch. These are review findings, not behavior changed by this documentation task.
- Corrected the task delete description to distinguish default soft delete from the explicit ?permanent=true path and restore via PATCH.

### Challenges and audit findings

- Older README text describes a MongoDB-era system, while current source uses PostgreSQL and Drizzle. The SDD prioritizes code and migrations and calls out stale documentation.
- The filesystem path app/api/tasks/[taskId]/tasks does not match its handler's listId parameter handling and comments. The intended URL is unclear from source alone, so the SDD flags it for owner resolution rather than guessing.
- Migrations 0008/0009 are present but their application state is not established; metadata snapshots stop at 0007. The document treats this as a deployment gate.
- Source review also identifies incomplete task/list feature-gate wiring, an email service switch not enforced at delivery points, in-memory rate limits, fire-and-forget CDF recalculation, and partial offline mutation replay.
- “Complete” is bounded to repository-visible implementation: inline callbacks are documented through component responsibilities, and no external provider, database state, secret value, or production deployment was inspected.

### Teaching notes: implementation and review patterns

**Follow a feature vertically.** For a new field such as durationMinutes, check the editor, API schema, service normalization, DB column, DTO type, cache/offline serialization, and display component. Missing any boundary can make a value look saved but disappear after refresh.

```text
DetailScreen -> TaskDurationField -> POST/PATCH /api/tasks -> taskService -> tasks.duration_minutes
```

**Keep derived state derived.** A countdown can be computed from local scheduled start + duration + current device time. Persisting a second remaining-seconds counter would drift when a tab sleeps. Example: at 09:15, a 09:00 task with a 25-minute duration has 10 minutes remaining.

**Put authorization at the server boundary.** A hidden UI control does not protect an API. Route middleware should authenticate, validate the resource ID, check feature access, and then call an owner-scoped service. For example, withFeatureAuth("lists", handler) only enforces a list grant when applied to the relevant route.

**Treat side effects and writes as separate failure points.** Registration can create an unverified user before SMTP fails. Task completion and CDF event creation are separate calls. Review retries, idempotency, and user-facing recovery for each boundary.

**Use schema + migration + runtime state as three distinct things.** db/schema.ts describes intended ORM shape; SQL migration files describe transitions; only the database migration ledger tells whether those transitions ran. The SDD therefore does not infer deployment state from a migration file.

### Verification status

- Source inventory and route/migration review completed without opening environment files.
- No database query, migration, automated test, lint, build, or type-check was performed for this documentation task.
- Documentation whitespace and changed-file status are checked separately; prior application edits in the working tree are preserved.

## 2026-11-03 — Feature-flow and database reference

### Roadmap and approach

1. Derive the feature list from the current SDD and source routes; use db/schema.ts and migrations as the schema authority.
2. Keep the new document focused on feature catalog, feature flow diagrams, database UML, and feature-to-table reference.
3. Show each feature's user entry point, API/service path, persistence responsibility, and relevant relationships so implementation work can be traced without reading the full architecture audit.

### What changed and why

- Added FEATURES.md with a feature catalog covering account lifecycle, task/list work, timeline/timer, offline support, CDF, notifications, themes, and administration.
- Added Mermaid flowcharts/sequence diagrams for account lifecycle, task/list operations, timers, offline replay, CDF, notification delivery, and admin requests.
- Added a Mermaid ER diagram for all PostgreSQL tables in the current schema and feature-related table mappings.
- Added a concise constraints table for uniqueness, ownership, deletion, and time validation rules reflected in the schema.

### Challenges and approach

- Several features combine persistent and derived/client-only state. The document labels timer/status as derived and offline/theme state as browser-owned instead of assigning those to server tables.
- platform_settings is a global service table without a user relationship; it is shown separately from user-owned entities in the UML.
- Flow diagrams describe source-level behavior. They do not assert that migrations have been applied or external email/push services are configured.

### Verification status

- Cross-checked the table/field inventory against db/schema.ts and the current SDD without accessing environment files.
- No application code, database, or migration was changed or run for this document task.

## 2026-11-03 — Render database UML in Markdown viewers

### Roadmap and approach

1. Inspect the Markdown-renderer setup without reading environment files.
2. Confirm why the Mermaid block is shown literally: the repository has no Mermaid Markdown rendering dependency/configuration, so viewer support cannot be assumed.
3. Add a static image fallback for the database UML and retain Mermaid source for compatible editors.

### What changed and why

- Added docs/diagrams/taskflow-database-uml.svg, a standalone SVG rendering of the current database entities and foreign-key relationships.
- Embedded the SVG in FEATURES.md immediately before its Mermaid source. Markdown viewers that support relative SVG images can display the UML without Mermaid rendering.

### Challenges

- Mermaid rendering depends on the viewer; a valid Mermaid code block can still appear as a code listing in ordinary Markdown previews.
- The image and Mermaid diagram must both stay aligned with db/schema.ts when tables or relationships change.

### Verification status

- Checked the relative image link and SVG entity relationships against the schema inventory.
- No environment files or database were accessed; no application tests were run.

## 2026-11-03 — Feature-by-feature system diagrams

### Roadmap and approach

1. Put the complete feature-name list first so readers can scan scope before details.
2. Give every listed feature its own detailed, step-ordered system diagram.
3. Use SVG diagrams instead of Mermaid because the active Markdown preview displays Mermaid fences as code.
4. Retain the database UML and feature-to-table mappings from the requested reference.

### What changed and why

- Reorganized FEATURES.md around a 12-feature index followed by one rendered system diagram per feature.
- Added individual SVGs for registration/verification, login/session, password recovery, task/event management, lists, search/status, timeline/timer, offline replay, CDF, reminders/push, settings/themes, and administration.
- Removed Mermaid source blocks from the feature guide so the preview does not show diagram syntax as code.
- Preserved the PostgreSQL database UML and feature-to-table mapping section.

### Challenges and choices

- The preview renderer does not render Mermaid. Each flow is therefore a regular SVG image that can display in standard Markdown previews and exports.
- The diagrams trace UI, route, validation/auth, service, storage/provider, and response behavior. They document currently supported behavior and call out limited offline replay and route/service enforcement dependencies.

### Verification status

- Checked all feature image references resolve to SVG files and validated SVG XML parsing.
- `git diff --check` reported no whitespace errors. No tests or database operations were run; no environment files were accessed.

## 2026-11-03 — Replace SVGs with inline text-code system diagrams

### Roadmap and approach

1. Keep the feature-name index at the top.
2. Replace every linked image with an ASCII/text-code flow embedded in FEATURES.md.
3. Write each flow step-by-step through the UI, API, validation/auth, service, persistence/provider, and response paths, including important branches and failure behavior.
4. Express the database UML as text-code ER relationships and entity summaries.
5. Remove the generated SVG diagrams because the requested deliverable is text directly inside the Markdown file.

### What changed and why

- Replaced all feature SVG image links with text diagrams inside Markdown code blocks.
- Added separate code diagrams for registration/verification, sessions, password recovery, tasks/events, lists, search/status, timeline/timer, offline replay, CDF, reminders/push, settings/themes, and administration.
- Replaced the image database UML with text ER relationships plus compact table/entity field summaries.
- Kept the feature index and feature-to-table mapping so readers can scan scope first and then trace storage.
- Removed the previously generated SVG diagram assets to avoid retaining an unwanted image-based version.

### Verification status

- Confirmed FEATURES.md no longer references SVGs or Mermaid blocks and all requested diagrams are inline text.
- `git diff --check` used for whitespace validation. No tests, DB operations, or environment-file access.

## 2026-11-03 — Mermaid system-flow source embedded in FEATURES.md

### Roadmap and approach

1. Place all feature names first.
2. Supply one detailed Mermaid flowchart per feature, directly in Markdown fenced code blocks.
3. Keep the database ER model as Mermaid source in the same file and retain the feature-to-table mapping.
4. Remove reliance on separate SVG assets so the editable diagram source lives with the documentation.

### What changed and why

- Rewrote each feature flow as Mermaid source directly in FEATURES.md: registration, sessions, OTP recovery, task/event, lists, search/status, timeline/timer, offline replay, CDF, reminders/push, settings/themes, and admin.
- Added validation, decisions, persistence/provider calls, successful outcomes, and important failure branches to the diagrams.
- Replaced the database's text sketch with a Mermaid ER diagram and kept table responsibility mappings.
- No SVG links or generated diagram assets remain in the feature document.

### Verification status

- Confirmed 13 Mermaid diagrams (12 features plus database ER) have balanced Markdown fences and FEATURES.md contains no SVG image links.
- `git diff --check` used for whitespace validation. No tests, database operations, or environment-file access.

## 2026-11-03 — Complete TaskFlow use-case flow

### Roadmap and approach

1. Connect the existing per-feature diagrams into one end-to-end user journey.
2. Start with account decision and registration/login, including OTP verification and password recovery.
3. Continue through session bootstrap, data loading, list/task actions, reminder setup/delivery, task completion/CDF, offline replay, and sign-out.
4. Include the separate administrator actor and privileged API path.
5. Keep the complete flow as Mermaid code in FEATURES.md, consistent with the requested editable Markdown source.

### What changed and why

- Added a complete TaskFlow use-case activity diagram after the feature-to-table reference in FEATURES.md.
- The diagram connects user-facing screens to API routes, validation/auth checks, services, PostgreSQL or IndexedDB, SMTP, Web Push, and UI outcomes.
- Added branches for account creation, OTP success/failure, password recovery, session refresh, online/offline operation, CDF eligibility, notification availability, and administrator authorization/actions.

### Verification status

- Reviewed the diagram paths against the per-feature descriptions and current source-derived behavior.
- `git diff --check` used for whitespace validation; no tests, database operations, or environment-file access.

## 2026-11-03 — Diagnose forgot-password request failure

### Roadmap and approach

1. Trace the visible error through the forgot-password page, auth hook, API route, service, database, and mailer without opening environment files.
2. Preserve existing public errors for rate limits and known SMTP setup/delivery failures.
3. Add a safe server diagnostic for unclassified failures and a specific response for a missing password-reset OTP schema migration.
4. Do not guess at live SMTP or database state; those require runtime evidence, which was not accessed.

### What changed and why

- `app/api/auth/forgot-password/route.ts` now logs safe error metadata (error name, database code, column/table when supplied) without logging email addresses, OTP values, SQL details, or secrets.
- If PostgreSQL reports a missing `reset_password_otp_hash` or `reset_password_otp_expiry` column, the route responds with HTTP 503 and explains that the database needs an update instead of returning the generic 500 message.
- Existing SMTP error mapping remains intact: missing mail configuration and provider send failures already have separate safe messages.

### Challenges and findings

- The screenshot's generic message means an unclassified failure reached the route or the deployed app differs from this source. A missing 0009 OTP migration is a plausible cause because the service selects/writes the new OTP columns; SMTP configuration and database connectivity are other possibilities.
- The actual runtime cause cannot be confirmed without the server log or database migration state. No database query or environment-file access was performed.

### Verification status

- Reviewed route-to-service-to-mailer error mapping and migration column names from source.
- `git diff --check` used for whitespace validation. No tests, lint, build, DB operations, or environment-file access.

## 2026-11-03 — Fix Mermaid reserved node identifier

- The complete use-case diagram used `end` as a node ID, which Mermaid parses as a reserved terminator and rejected at that line.
- Renamed the node to `signedOut` and also renamed the timeline node ID `click` to `timelineAction` to avoid a possible directive-name collision.
- Searched the diagrams for other common Mermaid reserved tokens used as node IDs. `git diff --check` reports no whitespace errors. No application tests were run.

## 2026-11-04 — Load database URL for Drizzle CLI

### Roadmap and approach

1. Compare the migration command output with the Drizzle config and migration files without opening any environment file or connecting to the database.
2. Check whether the CLI receives a usable database URL rather than silently receiving an empty string.
3. Make the CLI load normal root dotenv configuration and fail with a clear message when the URL is absent.
4. Leave migration execution to the user's command because it connects to and changes the configured database.

### What changed and why

- `drizzle.config.ts` now imports `dotenv/config`, matching Drizzle's documented config pattern for `process.env.DATABASE_URL`.
- Removed the empty-string fallback. The config now stops with a direct error if no database URL is available instead of passing an invalid/ambiguous value to `pg`.
- Migration files 0008 and 0009 are present in the SQL output folder and journal. The missing 0008/0009 snapshots affect future schema generation, not the migrate command's SQL/journal execution path.

### Verification status

- Reviewed the config, SQL migration, journal, and installed Drizzle Kit migration output behavior; did not open environment files or contact the database.
- `git diff --check` used for whitespace validation. The migration command, tests, build, and lint were not run by the agent.

## 2026-11-04 — Carry reset email into OTP form automatically

### Roadmap and approach

1. Keep the server contract requiring email + OTP, since the OTP digest belongs to a user account.
2. Carry the address from successful forgot-password submission through tab-scoped session storage; do not put personal data or OTP in the URL.
3. Remove the email input from reset form and handle direct navigation when no reset request is available.
4. Clear the carried address after successful password reset.

### What changed and why

- Forgot-password page stores the normalized email in `sessionStorage` after the API returns success.
- Reset-password page loads that value on mount and submits it with the OTP/password without showing an email field.
- Successful reset clears the stored email. Direct visits without a stored address show a request-code action and explanation.
- Storage failures do not turn a successful email request or password reset into a displayed server error.

### Verification status

- Reviewed the form-to-hook-to-API payload path and confirmed the reset email input is removed.
- `git diff --check` used for whitespace validation. No tests, build, DB operation, or environment-file access.

## 2026-11-04 â€” Complete and smooth the administrator console

### Roadmap and approach

1. Trace the admin page, login/refresh/logout routes, same-origin proxy, persisted admin role check, and access-control service before changing the UI. This keeps the dashboard aligned with the API contract.
2. Improve the console as a set of small components: session-aware shell, overview cards, searchable user controls, and platform service switches. Keeping each source file under 250 lines makes the UI easier to review and change.
3. Make session recovery use the existing HTTP-only refresh cookie and keep access tokens in memory. When a protected request expires, refresh once, retry once, and return to sign-in if it still fails.
4. Connect saved access controls to server-side checks on task, list, CDF, notification, and email-delivery paths. A disabled checkbox should change actual API behavior, not just presentation.
5. Review the diff and source line counts. Do not run tests, builds, or database commands for this documentation/request turn.

### What changed and why

- Replaced the minimal admin screen with a responsive dashboard: overview, recent accounts, quick actions, user access, service switches, refresh, sign-out, and clear loading/error/forbidden states.
- Added focused components and shared types under `admin/components/` and `admin/lib/adminTypes.ts`. The user table supports search and account filters; role and feature changes are reflected from the API response.
- Improved session restoration and expired-token handling in `admin/app/admin/page.tsx`. Login uses the root auth API; the dashboard restores a session through the refresh cookie, obtains the current profile, and never stores the access token in browser storage.
- Updated `admin/app/api/[...path]/route.ts` to forward the auth refresh cookie to the backend and preserve refreshed/cleared cookies in responses. This makes login, silent refresh, and logout work across the admin proxy.
- Added feature-gated API wrappers to the task, list, CDF, and notification endpoints. Access is evaluated on the server against the persisted user role and permission override for every wrapped call.
- Enforced the global email service switch before registration and password-reset email delivery. Push delivery was already gated by its global service switch.
- Updated `SDD.md` and `FEATURES.md` to describe the now-enforced controls and the admin flow accurately.

### Challenges and decisions

- The admin app is a separate Next.js workspace, so its browser cannot call the root service directly without cross-origin and cookie complications. The same-origin proxy is retained and now passes only the refresh cookie needed by auth routes.
- Access JWTs are intentionally short-lived and held only in memory. Session restore therefore has to rotate the HTTP-only refresh cookie, then re-read the user profile before displaying admin data.
- Frontend controls alone are not authorization. Each protected backend route must apply feature access checks; global integrations have a separate service-level switch. This preserves the server as the authority even if a client modifies requests.
- The admin account cannot demote itself from its own row; the API already rejects that request and the UI now communicates the restriction. Administrators bypass per-user feature grants as defined by access control.
- Current verification was limited to source review, file-size checks, and whitespace review. No test, build, lint, DB operation, or environment-file access was performed.

### Implementation walkthrough

The request path is: `UserAccessTable` or `ServiceControls` -> `change()` in `admin/app/admin/page.tsx` -> same-origin `/api/admin` proxy -> root `app/api/admin/route.ts` -> `accessControlService` -> PostgreSQL. The response is a fresh admin snapshot, which replaces the displayed state so the screen follows persisted server values.

A feature check is composed at the route boundary. For an item route, `withFeatureAuthAndId("tasks", "taskId", handler)` first verifies the access JWT, then checks the persisted feature grant, validates the UUID parameter, and only then calls the handler. For a collection route, `withFeatureAuth("tasks", handler)` applies the same access decision without an ID step. Example: a user whose task grant is disabled receives HTTP 403 from task APIs even if they call them outside the UI.

Session recovery in the admin page follows this pattern:

```ts
const refreshed = await fetch("/api/auth/refresh", {
  method: "POST",
  credentials: "include",
});
// The browser sends the HTTP-only cookie; JavaScript never reads it.
```

The returned access token stays in React state. A later 401 triggers one refresh and one retry. If either fails, the local session is cleared and the user is asked to sign in again.

### Project and component references

- `admin/app/admin/page.tsx`: session lifecycle, dashboard navigation, API request helper, retry/refresh behavior, and overview composition.
- `admin/components/AdminLogin.tsx`: accessible email/password form, pending state, and API error display.
- `admin/components/AdminSummary.tsx`: account, verification, administrator, and service totals.
- `admin/components/UserAccessTable.tsx`: account search/filter, role changes, self-protection, and per-feature switches.
- `admin/components/ServiceControls.tsx`: global email and Web Push switches with current state descriptions.
- `admin/lib/adminTypes.ts`: shared role, feature, service, user, and snapshot contracts.
- `admin/app/api/[...path]/route.ts`: same-origin proxy, refresh-cookie forwarding, and JSON backend errors.
- `middlewares/authMiddleware.ts`, `middlewares/validateObjectId.ts`: auth, feature checks, and parameter composition.
- `app/api/tasks/`, `app/api/lists/`, `app/api/cdf/`, `app/api/notifications/subscribe/`: feature-gated route entry points.
- `services/accessControlService.ts`: persisted grants, service switches, and admin snapshots.
- `services/authService.ts`: global email switch enforcement during registration and reset-code delivery.

### Audit notes and examples

- Good boundary: a React checkbox expresses intent, but `app/api/admin/route.ts` validates the action and confirms the caller's persisted admin role before writing. The feature-gated business route then enforces the stored grant.
- Good session practice: refresh token remains HTTP-only; access token is memory-only; proxy restricts forwarded cookie data to the TaskFlow refresh cookie.
- Operational dependency: `TASKFLOW_API_URL` must point at the root TaskFlow API. A missing or unreachable backend is reported as a structured JSON error. The admin workspace must not receive database credentials.
- Remaining audit gap: admin changes are not recorded in an immutable actor/action audit table. Current code secures the mutation but does not provide a durable history of who changed which role, grant, or service switch.
- Remaining design consideration: the process must already have an administrator account. Bootstrap of the first admin is an operator-controlled database task, not an exposed admin UI action.

### Verification status

- Reviewed admin UI, proxy, auth routes, admin API, access-control service, and gated routes.
- Confirmed the main admin page is 239 lines and the newly added component files are below the 250-line project limit.
- `git diff --check` is the whitespace check for this change; no tests, lint, or build were run, per the project instruction not to run tests unless requested.

## 2026-11-04 â€” Full-day timeline with current-time navigation

### Roadmap and approach

1. Keep the existing task-positioning rules and render the complete local day (00:00 through 24:00).
2. Put the hour labels and task grid inside one bounded native scroll area so both move together and users can scroll to any hour.
3. On mount or selected-date change, auto-scroll to the device's current hour when the selected date is today. Start non-today dates at midnight.
4. Draw the current-time marker at the device's current hour/minute/second position and refresh it periodically, also refreshing when the browser regains focus.
5. Allow enough trailing scroll space late in the day so 11 PM can still appear at the top while the rest of the day remains available.

### What changed and why

- `TaskTimeline` now always passes the full 00:00â€“24:00 range instead of shortening the current-day range to a 12-hour window.
- `TaskTimelineGrid` owns a 480-pixel maximum-height vertical scroll area. Hour labels and task blocks share the same scroll container, so manual scrolling keeps the times aligned.
- On initial display and selected-date changes, the grid scrolls to the current local hour for today. For another date it begins at midnight. It does not reset a user's manual scroll as the clock advances.
- For today, a primary-color line, dot, and local-time label are positioned by the current minute and update every 15 seconds. The marker is absent on other dates.
- When few hours remain, the scroll area receives trailing blank space. Without it, browser scroll limits would prevent a late current hour from reaching the top of the viewport.
- Quick-add still calculates the clicked time relative to the full-day grid, including after the user scrolls.

### Challenges and design decisions

- A 24-hour grid is taller than the viewport, so simply drawing all hours would push the rest of the screen away. A bounded native scroll area preserves the full day while keeping the page compact and supports wheel, touch, and keyboard scrolling.
- Browser scroll limits normally prevent 11 PM from being aligned to the top because there is little content after it. Calculated trailing space makes the requested auto-position possible without changing the time scale or moving task positions.
- The now line is computed from device-local hours, minutes, and seconds. The task date/time model is still device-local; no timezone or database behavior changes.
- Auto-scroll is keyed to date/day mode and runs only on the timeline's initial mount for that date. Re-renders and clock ticks do not override a user's manual scroll position.

### Implementation walkthrough and example

`TaskTimeline` converts the clock to a fractional minute-of-day, for example 11:30:30 becomes `690.5`. `TaskTimelineGrid` converts that to pixels using the hour scale: `690.5 * (64 / 60)`, placing the marker between the 11 AM and noon rows. The initial scroll offset for an 11 AM open is `11 * 64 = 704` pixels. At 8 AM the offset is `8 * 64 = 512` pixels.

```tsx
<TaskTimelineGrid
  startHour={0}
  endHour={24}
  initialScrollHour={isToday ? now.getHours() : 0}
  currentMinute={currentMinute}
  showCurrentTime={isToday}
  // task, action, and sizing props omitted from this example
/>
```

The grid uses one scroll parent around both columns. The now marker is absolutely positioned inside the full-day grid, while the scroll parent only clips the viewport; scrolling therefore moves the marker and task blocks with their hour labels.

### Project and component references

- `components/task/TaskTimeline.tsx`: local clock, selected-day check, full-day range, timeline mount key, scroll start hour, and quick-add coordinate conversion.
- `components/task/TaskTimelineGrid.tsx`: synchronized scroll container, 24 hour labels, task lanes, live now line, and late-day trailing space.
- `utils/positionTimelineTasks.ts`: overlap grouping and lane placement reused without changing the task layout algorithm.
- `components/task/TaskTimerLabel.tsx`: per-task countdown remains independent from the timeline's current-time marker.

### Verification and audit notes

- Confirmed both edited source files remain below 250 lines and `git diff --check` reports no whitespace errors.
- No tests, lint, or build were run, following the project instruction not to run tests unless requested.
- Manual browser verification is still needed for touch scrolling, exact marker appearance at 00:00/23:59, and quick-add time after scrolling.

## 2026-11-04 follow-up — Use the complete Home screen's normal scroll

### Correction and approach

The prior timeline change put scrolling inside a 480-pixel timeline viewport. That did not meet the clarified interaction. This follow-up removes that nested scroller and makes the complete Home screen the one native scroll area.

1. Make the Home screen root the `overflow-y-auto` element and remove the separate scrollable content child. The header, search/filter controls, stats, timeline, and task sections now belong to the same scrolling surface.
2. Keep the full 24-hour grid in ordinary document flow. Do not set `scrollTop` on the timeline.
3. Attach a ref to today's current-hour label and call `scrollIntoView({ behavior: "smooth", block: "start" })` once when that day is shown. This asks the browser to move its normal nearest scroll container.
4. Add only the normal-flow trailing space needed when the remaining day is shorter than the Home screen viewport. This lets a late hour align at the top without introducing another scroller.
5. Leave the live time marker refreshing from the device clock; clock refreshes do not reset manual scroll position.

### What changed and why

- `HomeScreen` now owns the one visible native vertical scrollbar. Removed the prior `scrollbar-hide` class so the standard scrollbar remains available.
- Removed the timeline's `max-height`, `overflow-y-auto`, `scrollTop`, and nested scrolling behavior. Hour labels, tasks, and marker remain in normal flow.
- Auto-positioning now calls `scrollIntoView` on the hour row. The browser scrolls the Home screen naturally, including its header, filters, and stats.
- A normal-flow spacer is sized from the Home screen viewport and hours remaining. It only extends the content tail where native scroll bounds would otherwise stop a late current hour from reaching the top.
- Preserved manual scrolling and the live device-time line. The 15-second clock refresh only moves the line; it does not repeatedly pull the user's scroll position back.

### Engineering walkthrough

The root app shell uses a fixed `100dvh` layout with outer overflow hidden, so `window.scrollTo` cannot move the visible home content. `HomeScreen` is the actual viewport-height region. The grid finds that nearest element with computed `overflow-y: auto`, measures its client height to calculate optional trailing space, and then asks the current hour label to `scrollIntoView`. Example: at 11 AM the 11 AM row becomes the top of the Home screen; at 8 AM the 8 AM row does. The line itself remains positioned by fractional minutes from midnight, such as `690.5 * 64 / 60` pixels at 11:30:30.

### Code and component references

- `components/task/HomeScreen.tsx`: single full-height native scrolling root; header, filters, stats, timeline, and task sections scroll together.
- `components/task/TaskTimeline.tsx`: maintains the 24-hour range, local clock, current-time marker inputs, and selected-day remount behavior.
- `components/task/TaskTimelineGrid.tsx`: current-hour anchor via `scrollIntoView`, time marker, task geometry, nearest scroll viewport measurement, and optional normal-flow trailing space.
- `utils/positionTimelineTasks.ts`: overlap lanes are unchanged and remain independent of the scroll behavior.

### Challenges and audit notes

- Because the app shell locks the document viewport, the intended scroll target is the Home screen element rather than `window`. `scrollIntoView` locates that native overflow area without manual scroll math.
- The root scroll includes header and summary controls by design. This changes the earlier fixed-header arrangement so it matches the requested complete-screen movement.
- The timeline no longer creates a special internal scrollbar; the Home screen uses normal browser wheel, touch, keyboard, and scrollbar interaction.
- `git diff --check` was run. Source review confirms no `scrollTop` or nested `overflow-y-auto` remains in the timeline. No tests, lint, or build were run.

## 2026-11-04 follow-up — Keep the header and bottom navigation fixed

The previous follow-up made the entire Home screen, including the header and summary controls, scroll. The clarified layout keeps those controls fixed and moves only the main body.

- Restored the Home screen flex-column layout. Header, cache/search/filter controls, and stats remain outside the body scroller; the app's bottom navigation remains its existing sibling and stays fixed.
- The body alone uses the native visible `overflow-y-auto` scrollbar. Its `min-h-0` flex sizing ensures the 24-hour timeline and task sections scroll inside the available space instead of expanding the fixed shell.
- `TaskTimelineGrid` continues to call `scrollIntoView` on the current hour. The browser's nearest scrollable ancestor is now the body, so the fixed header/footer do not move.
- The late-day normal-flow spacer is measured against the body viewport to preserve current-hour alignment without adding a nested timeline scroller.
- Source review and `git diff --check` completed; tests/build were not run.

## 2026-11-04 — Default per-task CDF tracking to unchecked

### Approach and reason

The user-facing requirement is that a task's CDF tracking checkbox is off for a newly created task. CDF itself and per-task tracking are distinct settings: this change affects only the new task's checkbox/row default. It does not turn off the user's CDF dashboard preference and does not change existing task choices.

I traced all task creation paths from UI defaults through optimistic/offline state, API service inserts, and the database schema. The default is now consistently `false` at each layer, while an explicitly checked task still sends `true` and remains tracked.

### Changes made

- Timeline Quick Add initializes and resets its “Track this task in CDF” checkbox to false.
- Task Detail creation defaults a new task's CDF field to false. Existing task records continue to load their saved true/false value.
- Floating Quick Add's local optimistic task uses false; its API request can omit the field because the service now defaults missing values to false.
- The generic API client and local app state use false when constructing new tasks or adapting missing CDF values.
- `taskService.createTask` now applies `input.cdfTracking ?? false`, and `db/schema.ts` declares the database column default as false.
- Added migration `drizzle/0010_cdf_tracking_default_off.sql` and its journal entry. It changes only the database default; it does not rewrite existing task rows.
- Updated the SDD to document the default.

### Engineering walkthrough

For an unchecked Timeline Quick Add, React state begins at `false`, the checkbox renders unchecked, and the save callback sends `cdfTracking: false`. If a create route omits the optional field, `taskService.createTask` still inserts `false`. The schema and migration provide the same fallback for inserts that rely on PostgreSQL's column default.

```ts
const [cdfTracking, setCdfTracking] = useState(false);
// Explicit user opt-in is preserved in the create payload.
await saveTask({ title, cdfTracking });
```

Updates do not use this default: `taskService.updateTask` writes `cdfTracking` only when the update includes the field, so editing another task property preserves the task's existing tracking choice.

### Challenges and audit considerations

- Changing only the checkbox would have left API and database defaults enabled for clients that omit the optional property. The same false default is therefore applied in the UI, service, schema, and migration.
- Existing task rows are intentionally not changed. A task that was already opted into CDF stays opted in; default behavior applies to new tasks and missing-field fallbacks.
- Migration 0010 must be applied to update an existing database's column default. The application service already sends/uses false for new tasks, so the UI behavior does not rely solely on migration execution.
- No environment files or database were accessed, and the migration was not run.

### Component and file references

- `components/task/TaskTimeline.tsx`: timeline quick-add checkbox state and submission.
- `components/task/DetailScreen.tsx`: new task field fallback, checkbox, and save payload.
- `hooks/useQuickAdd.ts`: floating quick-add offline task state.
- `hooks/useAppApiClient.ts`, `hooks/useAppState.ts`: DTO and local new-task defaults.
- `services/taskService.ts`: authoritative service fallback and update preservation.
- `db/schema.ts`, `drizzle/0010_cdf_tracking_default_off.sql`, `drizzle/meta/_journal.json`: schema default and deployment migration.
- `SDD.md`: source-derived behavior record.

### Verification status

- Confirmed no remaining `cdfTracking: true`, `cdfTracking ?? true`, or `cdf_tracking DEFAULT true` defaults in the identified task creation/edit paths.
- `git diff --check` was run. Tests, build, database access, and migration execution were not performed.

## 2026-11-06 — Malware and unwanted-code audit

### What the audit changes and why

This entry records a read-only source audit. No application code, suspicious artifact, dependency, process, or environment file was changed. The purpose is to preserve evidence and obtain explicit approval before remediation.

### Confirmed critical findings

1. `postcss.config.mjs:10` contains Base64-obfuscated JavaScript appended after the legitimate PostCSS export. Static decoding shows network discovery through Ethereum services, XOR-decoded payload retrieval, `eval`, and a detached `node -e` child process. Because PostCSS configuration loads during normal development/build activity, this is an executable malware loader.
2. `public/fonts/fa-solid-700.otf:1` is a second copy of the same loader family disguised as a font. It is text, not a valid OpenType font. It is a malicious repository artifact and potential reinfection source.

Evidence hashes (SHA-256):

- `postcss.config.mjs`: `70709145EB87F1DA8A5EB26EDC9B491F79E28CA7B43C4DB2EF184D9D9D027F14`
- `public/fonts/fa-solid-700.otf`: `7E748BC2FBDC47001C50077E8C2D400473C43B5C613F28E51CD04E708D944026`

Git history attributes both malicious additions to commit `45d7f88` (`feat: notification set up.`). Current head `d23961e` is titled `remove male code.`, but both artifacts remain, so that remediation was incomplete.

### Unwanted and maintainability findings

- `package.json` defines `generate-icons` twice. JSON parsers keep only the last value, making the first declaration dead and misleading.
- Root `dev` and `build` scripts execute `node api.js`, but no tracked `api.js` exists. These scripts should fail unless an untracked file supplies it; intent must be clarified before changing them.
- Twenty-one TypeScript/TSX files exceed the 250-line policy. The largest include `components/ui/DatePicker.tsx` (1002), `app/settings/page.tsx` (989), `components/task/DetailScreen.tsx` (819), and `components/cdf/CdfScoreCard.tsx` (779). These are refactoring candidates, not malware evidence.
- The two `public/fallback-*.js` files are identical, benign PWA fallback bundles. One may be stale, but removal requires checking which filename the current service worker references.
- No additional loader execution markers were found outside the two confirmed artifacts. No plaintext private keys or live-looking cloud/API tokens were found in scanned non-environment files.

### Approach adopted and why

The audit combined repository inventory, targeted execution/network/obfuscation searches, manual static decoding, Git provenance checks, secret-pattern scanning, hashes for evidence integrity, and line-count checks. Static analysis was chosen because executing a suspected loader could contact command-and-control infrastructure or start a persistent process.

Example: legitimate configuration should end at `export default config;`. An encoded string followed by `atob(...)` and `eval(...)` turns hidden data into executable code. A safe architecture never evaluates downloaded text; configuration remains declarative and remote data is schema-validated before use.

### Challenges and audit limits

- Environment files and environment data were intentionally not accessed.
- The second payload used a trusted-looking `.otf` extension, so extension-only inspection would miss it.
- Dependency auditing could not run because `npm`/`npm.cmd` was unavailable. Dependency risk is unknown, not clean.
- Static source inspection cannot prove whether the loader executed or whether host persistence exists outside the repository. Host/process/network forensics require separately authorized system scope.
- `today.md` contained legacy non-UTF-8 bytes; it was mechanically converted to UTF-8 so this required entry could be patched reliably.

### Implementation and component references

- `postcss.config.mjs`: build-time execution point and confirmed loader.
- `public/fonts/fa-solid-700.otf`: disguised malicious artifact.
- `package.json`: duplicate key and missing `api.js` reference.
- `public/fallback-INwFhOzkvm3GbH2CSTvpP.js` and `public/fallback-T8KEXFcjJRNBDsVIarI_q.js`: benign generated duplicates requiring reference validation.
- Commit `45d7f88`: introduction point for both confirmed artifacts.
- Commit `d23961e`: incomplete prior remediation visible at current head.

Recommended remediation project: quarantine/remove both confirmed artifacts, restore a minimal clean PostCSS config and a verified Font Awesome font from a trusted source, inspect every file changed in `45d7f88`, rotate secrets used on any machine that executed development/build commands, perform host forensics, reinstall dependencies from a trusted lockfile, then run tests/build and a second indicator scan. These actions are intentionally pending explicit approval.

## 2026-11-06 — Malware remediation

### What changed and why

- Removed the malicious `public/fonts/fa-solid-700.otf`. Repository-wide reference checks found no consumer, so replacing it would add an unnecessary artifact.
- Rebuilt `postcss.config.mjs` as an eight-line declarative Tailwind/PostCSS configuration. The unused CommonJS bridge and entire executable loader were removed.
- Removed `node api.js &&` from the root `dev` and `build` scripts. Historical inspection confirmed `api.js` was a third copy of the loader, deleted in commit `53820c0`; retaining its execution hooks both preserved the infection chain and broke commands because the file no longer exists.
- Removed the duplicate `generate-icons` package-script key so the manifest has one authoritative declaration.

### Commit inspection and architecture findings

Commit `45d7f88` changed 23 files. Targeted static inspection of every surviving changed file found loader indicators only in `postcss.config.mjs` and the fake font. Historical inspection found the third loader in the commit's added `api.js`. The remaining notification feature, migration, tests, UI, and PWA changes did not match the loader's execution indicators.

The infection chain was:

```text
npm dev/build -> package script -> api.js loader
Next/PostCSS startup -> postcss.config.mjs loader
Repository persistence -> fake fa-solid-700.otf copy
```

Removing only `api.js` was insufficient because Next/PostCSS could still execute the configuration payload. Remediation therefore removed every current payload and the stale command hooks together.

### Verification and challenges

- Scanned all non-environment repository files, excluding only this evidence document, for loader IDs, Ethereum discovery calls, payload headers, `eval`, dynamic functions, and child-process imports. No matches remain.
- A second content-oriented scan found no Base64-to-eval loader structures or known family markers.
- `package.json` parses successfully as JSON.
- `postcss.config.mjs` now contains only the typed configuration, plugin declaration, and export.
- The fake font and `api.js` are absent.
- `git diff --check` found no application-code whitespace errors; the audit document's final newline was normalized by this update.
- Tests, builds, and dependency auditing were not run because a usable Node/npm executable is unavailable in the session. No environment files or environment data were accessed.

### Security follow-up teaching

Repository cleanup stops future execution from these tracked files but does not prove a previously used workstation is clean. If any developer or CI runner executed the affected `dev` or `build` commands after commit `45d7f88`, treat that host as potentially compromised: isolate it, inspect running processes and persistence, rotate credentials from a clean device, invalidate tokens, rebuild dependencies, and review outbound network logs. Rewriting or removing the infected commit from shared history is a separate coordination decision because it changes Git history for every contributor.
