# ✓ TaskFlow

> **Stay Consistent. Stay Disciplined. Stay Focused.**

A full-stack, mobile-first task manager built with Next.js 16, MongoDB, and TypeScript — featuring a unique **CDF (Consistency · Discipline · Focus)** tracking system that goes beyond simple task completion.

🔗 **Live:** [task-flow-liard-five.vercel.app](https://task-flow-liard-five.vercel.app)
📦 **Repo:** [github.com/Muhammad-Faisal-FTA/task-flow](https://github.com/Muhammad-Faisal-FTA/task-flow)

---

## 📸 Screenshots

| Home | CDF Dashboard | Detail |
|------|---------------|--------|
| Task sections with overdue tracking | Circular gauges + streak | Custom date/time picker |

---

## ✨ Features

### 📋 Task Management
- Create, edit, soft-delete tasks with **undo restore**
- 6 smart sections: **Overdue → Today → Tomorrow → Next Week → Upcoming → No Date**
- Repeat frequency: Daily, Weekdays, Weekly, Monthly, Yearly — **auto-creates next occurrence on completion**
- Due date + due time with custom calendar grid picker
- Assign tasks to custom lists
- **Quick Add** with voice input (Web Speech API)
- **Quick links** — attach named URLs to any task
- Share tasks via native share sheet

### 📁 List Management
- Create, rename, recolor, delete custom task lists
- Live overdue count badge per list
- Default list protection — cannot delete

### 🔍 Search
- Debounced real-time search across all tasks
- Highlighted match text in results
- Status badges + list badges on results

### ⚡ CDF Tracker — Unique Feature
Track **how well** you work, not just what you do.

| Metric | What it tracks | Weight |
|--------|---------------|--------|
| **C — Consistency** | Did you complete your repeat tasks? | 40% |
| **D — Discipline** | Did you finish before the due time? | 35% |
| **F — Focus** | How focused were you? (0–100 slider) | 25% |

- **Grades**: S / A / B / C / D / F per metric
- **Circular speedometer gauges** with zone coloring
- **🔥 Streak counter** — consecutive days of repeat task completion
- **30-day rolling window** — always current
- **Mandatory focus popup** — appears immediately on task completion when CDF is ON
- Full event history grouped by Today / Yesterday / Last 7 Days

### 🔔 Notifications
- Web Push notifications for at-time task reminders
- Browser permission request with enable/disable toggle in settings
- Service worker push handler — works even when app is closed

### 📱 PWA
- Installable on iOS + Android homescreen
- Offline cache via Workbox (next-pwa)
- Safe-area support for iPhone notch

### 🖥️ Desktop Responsive
- **3-column layout**: Sidebar nav + Task list (500px) + Detail panel
- Sidebar replaces bottom nav on desktop (≥768px)
- Bottom nav preserved on mobile
- Quick Add becomes centered modal on desktop

---

## 🛠️ Tech Stack

### Frontend
| Tech | Version | Purpose |
|------|---------|---------|
| Next.js | 16.2.1 | App Router, SSR, API routes |
| React | 19 | UI library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | v4 | Styling (`@import "tailwindcss"` syntax) |
| Lucide React | latest | Icons |

### Backend
| Tech | Version | Purpose |
|------|---------|---------|
| MongoDB | Atlas | Database |
| Mongoose | 9 | ODM |
| JWT | jsonwebtoken v9 | Auth (access 15m + refresh 7d) |
| bcryptjs | v2 | Password hashing |
| Zod | v3 | Input validation |
| web-push | latest | Push notifications (VAPID) |
| Nodemailer | latest | Email verification + reset |

### Infrastructure
- **Vercel** — deployment + cron jobs
- **MongoDB Atlas** — managed database
- **next-pwa v5.6.0** — service worker + offline

---

## 🏗️ Architecture

```
app/
├── (auth)/          # Login, register, verify, reset password
├── api/
│   ├── auth/        # JWT auth endpoints
│   ├── tasks/       # CRUD + toggle + restore
│   ├── lists/       # List management
│   ├── cdf/         # CDF settings, events, scores
│   └── notifications/ # Push subscribe + send
├── cdf/             # CDF dashboard page
├── settings/        # Settings page
└── page.tsx         # Main app shell

components/
├── auth/            # Auth forms
├── cdf/             # Gauges, popup, dashboard
├── layout/          # HeaderBar, BottomNav, SidebarNav
├── task/            # TaskCard, HomeScreen, DetailScreen, etc.
└── ui/              # Toast, DatePicker, TimePicker, etc.

hooks/
├── useAuth.ts           # JWT auth + silent refresh
├── useAppApiClient.ts   # All task/list state + API calls
├── useCdfSettings.ts    # CDF toggle
├── useCdfScores.ts      # Score + event fetching
├── useFocusPopup.ts     # Mandatory focus popup state
├── usePushNotifications.ts # Web push subscribe/unsubscribe
└── useOfflineSync.ts    # Online/offline detection

models/
├── user.model.ts
├── task.model.ts
├── taskList.model.ts
├── cdfSettings.model.ts
├── cdfEvent.model.ts
├── cdfScore.model.ts
└── pushSubscription.model.ts
```

---

## 🧱 Code Management & Scalability

### Layered Architecture
Every feature follows a strict **4-layer separation**:
```
API Route → Middleware → Service → Model
```
- **API routes** handle only HTTP concerns (parse, validate, respond)
- **Service layer** owns all business logic — reusable, testable, framework-agnostic
- **Models** are pure Mongoose schemas — no logic bleeds in
- **Middlewares** are composable — `withAuth`, `validateObjectId`, `withRateLimit` stack cleanly

### Scalability Decisions
| Decision | Why |
|----------|-----|
| **Soft delete** on tasks | Enables undo, audit trail, and future recycle bin without data loss |
| **Pre-aggregated CDF scores** | `CdfScore` document updated async after each event — dashboard reads O(1), never aggregates at query time |
| **Status derived at read time** | `deriveStatus()` runs on each serialisation — no stale status in DB, no migration needed when logic changes |
| **Flat task storage + client grouping** | Tasks stored flat, grouped by status in service layer — DB stays simple, grouping logic is testable |
| **Token in memory + httpOnly refresh cookie** | Access token never touches localStorage — XSS-safe. Silent refresh at 14 min keeps UX seamless |
| **AbortController on search** | Every keystroke cancels the previous fetch — zero race conditions, zero stale results |
| **Async next-occurrence creation** | `createNextOccurrence()` fires after toggle response — user never waits for it |
| **Upsert on CDF scores** | `findOneAndUpdate` with `upsert: true` — atomic, idempotent, no duplicate score documents |

### State Management Pattern
No Redux, no Zustand. Custom hooks compose cleanly:
```
useAuthenticatedApp()
  ├── useAuth()              — JWT state machine
  └── useAppApiClient()      — optimistic UI + API sync
        ├── tasks[]          — flat array, status-derived
        ├── lists[]          — with live counts
        └── screen           — router state (home/detail/lists)
```
Optimistic updates on every mutation — UI responds instantly, reverts silently on failure.

### Type Safety End-to-End
```
MongoDB document (ITask)
    → serialiseTask() → TaskDTO (API response)
    → taskDtoToUi()   → Task (UI model)
    → Task["status"]  → TaskStatus (literal union)
```
No `any`, no `as unknown`. Types flow from DB schema to component props without gaps.

---

## 🧪 SQA — Software Quality Assurance

### Validation Strategy — Defence in Depth
Every write operation is validated at **3 layers**:

```
Layer 1: Client        — disabled button, char limits, URL format check
Layer 2: API Route     — Zod schema (type, shape, length, format)
Layer 3: Service       — ownership check, business rule validation
Layer 4: Mongoose      — schema-level type + constraint enforcement
```

Example — focus score submission:
```typescript
// Zod: integer, 0–100
focusScore: z.number().min(0).max(100).int()

// Service: ownership + range
if (input.focusScore < 0 || input.focusScore > 100) throw new Error("INVALID_FOCUS_SCORE")
const event = await CdfEventModel.findOne({ _id, userId })  // ownership
if (!event) throw new Error("EVENT_NOT_FOUND")

// Mongoose: min/max schema constraint
focusScore: { type: Number, min: 0, max: 100 }
```

### Error Handling Pattern
Every service exports a typed error map:
```typescript
export const TASK_ERRORS: Record<string, { status: number; message: string }> = {
  INVALID_ID:    { status: 400, message: "Invalid ID format."   },
  TASK_NOT_FOUND:{ status: 404, message: "Task not found."      },
  FORBIDDEN:     { status: 403, message: "Permission denied."   },
}
export function resolveTaskError(err: unknown): { status: number; message: string }
```
Routes never hardcode status codes. All errors resolve through the map — consistent, maintainable.

### Security Measures
| Threat | Mitigation |
|--------|-----------|
| XSS | Access token in memory only, never localStorage |
| CSRF | httpOnly refresh cookie + same-origin API |
| Brute force | Rate limiting: 10 req/15min auth, 3 req/hr forgot-password |
| Injection | Zod + Mongoose schema validation on all inputs |
| IDOR | Every query scoped to `userId` from JWT payload |
| Expired push subs | 404/410 responses auto-delete subscription from DB |
| Cron abuse | `CRON_SECRET` bearer token on notification send endpoint |

### Idempotency
- **Duplicate list name** — checked before create, case-insensitive regex
- **Duplicate next occurrence** — existence check before creating repeat task
- **Push subscription** — `findOneAndUpdate` with `upsert` on endpoint field (unique index)
- **CDF score** — single doc per user, always overwritten not appended
- **Default list** — creation guarded by `findOne` check on registration

### Testing Infrastructure
```bash
npm run test          # Jest unit tests
npm run cypress:open  # Cypress E2E (interactive)
npm run cypress:run   # Cypress E2E (headless CI)
npm run lint          # ESLint
```

---

## 🧮 DSA Highlights

### Task Grouping — O(n) Single Pass
```typescript
// utils/taskGrouping.ts
export function groupTasksByStatus(tasks: TaskDTO[]): GroupedTasks {
  const groups: GroupedTasks = {
    overdue: [], today: [], tomorrow: [],
    next_week: [], future: [], nodate: [],
  };
  for (const task of tasks) {
    groups[task.status].push(task);   // O(1) bucket insert
  }
  return groups;                       // Total: O(n), one pass
}
```

### Status Derivation — O(1) Per Task
```typescript
// utils/deriveStatus.ts
export function deriveStatus(
  dueDate: Date | null,
  completed: boolean,
  deletedAt: Date | null
): TaskStatus {
  if (deletedAt || completed) return "nodate";
  if (!dueDate) return "nodate";

  const today    = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);
  const due      = startOfDay(dueDate);

  if (due < today)    return "overdue";
  if (isSameDay(due, today))    return "today";
  if (isSameDay(due, tomorrow)) return "tomorrow";
  if (due <= nextWeek)          return "next_week";
  return "future";
}
// No loops, no DB calls — pure date arithmetic
```

### Streak Calculation — Sliding Window
```typescript
// services/cdfService.ts
async function calculateStreak(userId, windowStart): Promise<{ current, longest }> {
  const events = await CdfEventModel.find({ userId, repeat: { $ne: "none" } })
    .select("completedAt").sort({ completedAt: -1 }).lean();

  // Build Set of unique date strings — O(n)
  const completedDates = new Set(
    events.map(e => e.completedAt.toISOString().split("T")[0])
  );

  // Walk backwards from today — O(30) worst case
  let current = 0;
  for (let i = 0; i < 30; i++) {
    const key = subDays(today, i).toISOString().split("T")[0];
    if (completedDates.has(key)) current++;   // O(1) Set lookup
    else break;
  }

  // Longest streak — single scan through sorted dates — O(n)
  let longest = 1, temp = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const diff = daysBetween(sortedDates[i-1], sortedDates[i]);
    temp = diff === 1 ? temp + 1 : 1;
    longest = Math.max(longest, temp);
  }
  return { current, longest };
}
```

### Debounced Search — Cancellation Pattern
```typescript
// hooks/useSearch.ts
const abortRef = useRef<AbortController | null>(null);
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// On every keystroke:
// 1. Clear previous debounce timer
// 2. Abort previous in-flight HTTP request
// 3. Schedule new search after 350ms

useEffect(() => {
  if (timerRef.current) clearTimeout(timerRef.current);
  timerRef.current = setTimeout(async () => {
    abortRef.current?.abort();                    // cancel previous
    abortRef.current = new AbortController();     // new cancel token
    await search(query, abortRef.current.signal); // pass to fetch
  }, 350);
}, [query]);
// Result: exactly 1 HTTP request per pause, zero stale responses
```

### MongoDB Indexes — Query Complexity
```typescript
// Compound indexes designed for exact query patterns:

// Primary task query: userId + deletedAt + dueDate sort
{ userId: 1, deletedAt: 1, dueDate: 1 }  // covers main list fetch

// Search: MongoDB Atlas text index
{ title: "text" }                          // full-text search O(log n)

// CDF events: user + time range
{ userId: 1, completedAt: -1 }            // covers 30-day window query

// CDF by repeat type (consistency calc)
{ userId: 1, repeat: 1, completedAt: -1 }

// Push subscriptions: unique endpoint
{ endpoint: 1 }  // unique — prevents duplicate subscriptions O(1)
```

### Consistent Hashing for Score Aggregation
CDF scores use a **pre-computation pattern** — scores are never computed at read time:
```
Write path:  Event saved → recalculateScores() async → CdfScore upserted
Read path:   GET /api/cdf/scores → single findOne() → O(1) response

Tradeoff: slightly stale scores (ms delay) vs O(1) read for every dashboard load
Decision: dashboard is read-heavy → pre-compute wins
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- VAPID keys for push notifications

### Installation

```bash
git clone https://github.com/Muhammad-Faisal-FTA/task-flow.git
cd task-flow
npm install
```

### Environment Variables

Create `.env`:

```bash
# Database
MONGODB_URI=mongodb+srv://...

# JWT — generate 3 separate secrets
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_EMAIL_SECRET=

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@taskflow.com

# App
APP_URL=http://localhost:3000
NODE_ENV=development
DISABLE_PWA=true

# Push Notifications — run: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:your@email.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
CRON_SECRET=any-random-string
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

---

## 🔔 Push Notification Setup

```
GET https://your-app.vercel.app/api/notifications/send?window=5
Authorization: Bearer YOUR_CRON_SECRET
```

**Free cron options:** [cron-job.org](https://cron-job.org) · GitHub Actions · Vercel Pro

---

## 🔒 Security

- **bcrypt** salt rounds: 12
- **3 separate JWT secrets** — access (15m), refresh (7d), email (1h–24h)
- **Rate limiting** — 10 req/15min auth, 3 req/hr forgot-password
- **Soft delete** — tasks recoverable within session
- **ObjectId validation** middleware on all dynamic routes
- **Ownership checks** — all queries scoped to authenticated userId
- **VAPID** for push notification authentication

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

*Built with ❤️ — TaskFlow: Realize Discipline, Focus and Consistency*
