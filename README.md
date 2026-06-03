# UKG Reports — HR Analytics & Attendance System
### Iron & Steel Plant · Full-Stack Enterprise Application

> **5-minute setup guide.** Everything you need to go from a fresh clone to a running app.

---

## 📁 Repository Structure

```
ukg/
├── client/          ← React 18 frontend (this is the ukg-hr-client folder)
│   ├── src/
│   │   ├── features/        ← One folder per page/domain
│   │   ├── shared/          ← Reusable UI, hooks, utils
│   │   ├── layouts/         ← AppShell, Sidebar, Topbar
│   │   ├── lib/api/         ← Axios client + all React Query fetchers
│   │   ├── store/           ← Zustand auth & UI state
│   │   ├── router/          ← All routes with role guards
│   │   └── styles/          ← Tailwind globals + CSS variables
│   ├── vite.config.js       ← Proxy /api → localhost:5000
│   ├── tailwind.config.js
│   └── package.json
│
└── server/          ← Express + MongoDB backend (pre-built)
    ├── src/
    ├── .env
    └── package.json
```

---

## ⚡ 5-Minute Setup

### Prerequisites (install once, skip if already done)

| Tool | Version | Check | Install |
|------|---------|-------|---------|
| Node.js | ≥ 18.x | `node --version` | https://nodejs.org |
| npm | ≥ 9.x | `npm --version` | comes with Node |
| MongoDB | ≥ 6.x | `mongod --version` | https://www.mongodb.com/try/download/community |
| Git | any | `git --version` | https://git-scm.com |

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/ukg.git
cd ukg
```

---

### Step 2 — Set up the Server

```bash
# Move into the server folder
cd server

# Install dependencies
npm install

# Create the environment file
cp .env.example .env
```

Open `server/.env` and fill in these values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ukg_hr
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

> ⚠️ **MongoDB must be running locally.** Start it with `mongod` or via the MongoDB service.

```bash
# Seed the database with 25 employees + 90 days of attendance data
npm run seed

# Start the server
npm run dev
```

✅ Server is live at → **http://localhost:5000**  
✅ Test it: open http://localhost:5000/ping — you should see `{ "ok": true }`

---

### Step 3 — Set up the Client

Open a **new terminal tab**, then:

```bash
# From the repo root
cd client

# Install dependencies
npm install

# Start the dev server
npm run dev
```

✅ Frontend is live at → **http://localhost:3000**

> The Vite proxy is pre-configured — all `/api/v1/*` calls automatically forward to `http://localhost:5000`. No extra config needed.

---

### Step 4 — Log In

Open **http://localhost:3000** in your browser. Use any of these demo accounts:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| IT Admin | `admin@steelplant.in` | `Admin@123` | Everything |
| HR Admin | `hr@steelplant.in` | `Admin@123` | Dashboard, Attendance, Analytics, Employees, Exports, Audit Logs (if permitted) |
| Time Office | `timeoffice@steelplant.in` | `Admin@123` | Dashboard, Attendance, Employees |

> 💡 The login page has **one-click demo credential buttons** — just click any role to auto-fill the form.

---

## 🏗️ Tech Stack

### Frontend (`client/`)

| Library | Version | Purpose |
|---------|---------|---------|
| React | 19.x | UI framework |
| Vite | 8.x | Build tool + dev server |
| Tailwind CSS | 3.x | Utility-first styling |
| TanStack Query | 5.x | Server state, caching, loading/error states |
| React Router DOM | 7.x | Routing with role-based guards |
| Zustand | 5.x | Global state (auth token, UI) |
| Recharts | 3.x | All charts (bar, pie, trend) |
| Axios | 1.x | HTTP client with interceptors |
| date-fns | 4.x | Date formatting (IST display) |
| lucide-react | latest | Icons |
| Radix UI | various | Accessible headless components |
| clsx + tailwind-merge | latest | Conditional className utility |

### Backend (`server/`)

| Library | Purpose |
|---------|---------|
| Express.js | REST API framework |
| MongoDB + Mongoose | Database + ODM |
| JWT | Authentication tokens |
| ExcelJS | `.xlsx` export generation |
| Node-cron | Scheduled sync jobs |

---

## 🗺️ All Pages & Routes

| Page | Route | Who can see it |
|------|-------|----------------|
| Login | `/login` | Public |
| Dashboard | `/dashboard` | All roles |
| Daily Attendance | `/attendance/daily` | All roles |
| Monthly Attendance | `/attendance/monthly` | All roles |
| Miss Punch | `/attendance/miss-punch` | All roles |
| Overtime | `/attendance/overtime` | IT Admin, HR Admin |
| Analytics | `/analytics` | IT Admin, HR Admin |
| Employees | `/employees` | All roles |
| Employee Detail | `/employees/:empCode` | All roles |
| Exports | `/exports` | IT Admin, HR Admin |
| System Health | `/monitoring/health` | IT Admin only |
| Jobs | `/monitoring/jobs` | IT Admin only |
| Audit Logs | `/monitoring/audit` | IT Admin always · HR Admin if permitted |
| Admin | `/admin` | IT Admin only |

---

## 🔌 API Reference (Quick)

**Base URL:** `http://localhost:5000/api/v1`  
**Auth:** All protected endpoints require `Authorization: Bearer <token>` header  
**Token storage:** `localStorage['hr_token']` and `localStorage['hr_user']`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | ❌ | Login, returns token + user |
| GET | `/auth/me` | ✅ | Get current user |
| GET | `/analytics/dashboard` | ✅ | KPI summary |
| GET | `/analytics/trend` | ✅ | `?days=7\|30` |
| GET | `/analytics/shift-breakdown` | ✅ | `?month=&year=` |
| GET | `/analytics/dept-rate` | ✅ | `?month=&year=` |
| GET | `/attendance/today` | ✅ | Today's counts |
| GET | `/attendance/daily` | ✅ | `?date=&department=&status=&shift=&page=` |
| GET | `/attendance/monthly` | ✅ | `?month=&year=&department=` |
| GET | `/attendance/miss-punch` | ✅ | `?dateFrom=&dateTo=` |
| GET | `/attendance/overtime` | ✅ | `?dateFrom=&dateTo=&minOtMinutes=` |
| GET | `/employees` | ✅ | `?search=&department=` |
| GET | `/employees/departments` | ✅ | List of department names |
| GET | `/employees/:empCode` | ✅ | Single employee |
| GET | `/exports/monthly-attendance` | ✅ | Downloads `.xlsx` |
| GET | `/exports/overtime` | ✅ | Downloads `.xlsx` |
| GET | `/monitoring/health` | ✅ | DB/memory/disk status |
| GET | `/monitoring/jobs` | ✅ | Scheduled job statuses |
| GET | `/monitoring/job-logs` | ✅ | `?status=failed\|skipped` |
| GET | `/monitoring/audit-logs` | ✅ | System audit trail |
| POST | `/monitoring/jobs/trigger/:jobName` | ✅ | Manual job trigger |

**Standard response envelope:**
```json
// Success
{ "success": true, "data": { ... } }

// Paginated
{ "success": true, "data": [...], "meta": { "page": 1, "limit": 50, "total": 200, "pages": 4, "hasNext": true, "hasPrev": false } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "errors": [] } }
```

---

## 📂 Client Folder Deep-Dive

```
client/src/
│
├── lib/api/
│   ├── client.js        # Axios instance. Sets Bearer token on every request.
│   │                    # On 401 → clears localStorage → redirects to /login
│   └── queries.js       # All queryKey factories + all fetcher functions.
│                        # NEVER call fetch/axios directly in components — always use this.
│
├── store/
│   ├── auth.store.js    # Zustand. Holds token + user. Persists to localStorage.
│   └── ui.store.js      # Zustand. Sidebar open/closed + toast notifications.
│
├── shared/
│   ├── ui/
│   │   ├── StatCard.jsx         # KPI card: icon + big number + delta
│   │   ├── StatusBadge.jsx      # Coloured pill: Present/Absent/Miss Punch/Leave/OT
│   │   ├── Spinner.jsx          # Loading spinner + PageSpinner (centered full-page)
│   │   ├── Pagination.jsx       # Prev/Next + "Page X of Y — Z total"
│   │   ├── FiltersBar.jsx       # Filter card above tables. Also exports SearchInput, FilterSelect
│   │   ├── EmptyState.jsx       # "No records found" with icon
│   │   ├── ErrorState.jsx       # Error display with retry button
│   │   ├── SkeletonRow.jsx      # Table skeleton rows during loading
│   │   ├── ExportButton.jsx     # Download button with built-in loading spinner
│   │   ├── PageHeader.jsx       # Page title + subtitle + optional action slot
│   │   └── NotificationToast.jsx # Bottom-right toast notifications
│   │
│   ├── hooks/
│   │   ├── useAuth.js      # Reads auth store → exposes user, role, isITAdmin, etc.
│   │   ├── useDebounce.js  # 300ms debounce for search inputs
│   │   ├── useFilters.js   # Filter state with auto page-reset
│   │   ├── useNotify.js    # notify.success() / .error() / .warning() / .info()
│   │   └── useExport.js    # Blob download helper with loading state + toast
│   │
│   └── utils/
│       ├── cn.js           # clsx + tailwind-merge → cn('class1', condition && 'class2')
│       ├── formatters.js   # formatDate, formatTime, minutesToHHMM, toApiDate, etc.
│       └── constants.js    # STATUS_CONFIG, ROLES, ROLE_ROUTES, SHIFTS, CHART_COLORS
│
├── layouts/
│   ├── AppShell.jsx    # Outer wrapper: Sidebar + Topbar + <Outlet />
│   ├── Sidebar.jsx     # Dark navy sidebar. NAV_GROUPS drives which items show per role.
│   └── Topbar.jsx      # Hamburger + brand + search + bell + user dropdown with logout
│
├── router/
│   └── index.jsx       # createBrowserRouter. <Guard roles={[...]}> wraps protected routes.
│                       # Unauthorized role → redirects to /dashboard (not 403)
│
├── features/           # Each folder = one domain. Features NEVER import from each other.
│   ├── auth/           LoginPage.jsx
│   ├── dashboard/      DashboardPage.jsx
│   ├── attendance/     DailyAttendancePage, MonthlyAttendancePage, MissPunchPage, OvertimePage
│   ├── analytics/      AnalyticsPage.jsx
│   ├── employees/      EmployeesPage.jsx, EmployeeDetailPage.jsx
│   ├── exports/        ExportsPage.jsx
│   ├── monitoring/     SystemHealthPage, JobsPage, AuditLogsPage
│   └── admin/          UsersAdminPage.jsx
│
└── styles/
    └── globals.css     # Tailwind directives + CSS variables + .card, .data-table, .btn-* classes
```

---

## 🎨 Design System

**Color tokens (defined in `globals.css` and `tailwind.config.js`):**

| Token | Value | Used for |
|-------|-------|----------|
| Sidebar bg | `#12183A` | Left navigation background |
| Brand 500 | `#3B82F6` | Primary buttons, active nav, links |
| Surface page | `#F5F6FA` | Main content background |
| Surface card | `#FFFFFF` | Card backgrounds |
| Surface border | `#E8EAF0` | Card and table borders |
| Text primary | `#0F172A` | Headings, values |
| Text secondary | `#64748B` | Labels, subtitles |
| Text muted | `#94A3B8` | Placeholders, timestamps |

**Status badge colors:**

| Status | Background | Text |
|--------|-----------|------|
| Present | `#DCFCE7` | `#15803D` |
| Absent | `#FEE2E2` | `#B91C1C` |
| Miss Punch | `#FEF9C3` | `#92400E` |
| Leave | `#DBEAFE` | `#1D4ED8` |
| Overtime | `#F3E8FF` | `#7C3AED` |
| Holiday | `#F0FDF4` | `#166534` |
| Week Off | `#F8FAFC` | `#64748B` |

**Reusable CSS classes (from `globals.css`):**

```css
.card            /* white card with border + rounded-[12px] */
.data-table      /* full-width table with styled th/td */
.form-input      /* styled text input with focus ring */
.form-select     /* styled select dropdown */
.btn-primary     /* blue filled button */
.btn-secondary   /* white outlined button */
.btn-ghost       /* transparent hover button */
.skeleton        /* grey pulsing placeholder block */
.page-content    /* flex-1 overflow-y-auto p-5 */
```

---

## 🔐 Role-Based Access

Access is controlled in two places:

**1. Router (`router/index.jsx`)** — redirects to `/dashboard` if role not in allowed list:
```jsx
<Guard roles={['IT_ADMIN', 'HR_ADMIN']}>
  <ExportsPage />
</Guard>
```

**2. Sidebar (`layouts/Sidebar.jsx`)** — each nav item has a `roles` array; items not in the user's role are never rendered.

**Special case — Audit Logs for HR_ADMIN:**  
IT Admin can toggle audit log access for HR_ADMIN users from the `/admin` page. This state is currently managed in the frontend `UsersAdminPage.jsx`. Wire it to a backend users API when one is available.

---

## 🛠️ Common Tasks

### Add a new page

1. Create `src/features/yourfeature/YourPage.jsx`
2. Add a route in `src/router/index.jsx`
3. Add a nav item in `src/layouts/Sidebar.jsx` with the correct `roles` array
4. Add fetcher functions to `src/lib/api/queries.js` if needed

### Add a new API call

In `src/lib/api/queries.js`:
```js
// 1. Add a query key factory
export const queryKeys = {
  yourFeature: {
    list: (filters) => ['yourFeature', 'list', filters],
  }
}

// 2. Add a fetcher function
export const yourApi = {
  list: async (filters) => {
    const { data } = await apiClient.get('/your-endpoint', { params: filters })
    return data // { success, data, meta }
  }
}
```

In your component:
```js
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.yourFeature.list(filters),
  queryFn: () => yourApi.list(filters),
})
```

### Show a toast notification

```js
import { useNotify } from '@/shared/hooks/useNotify'

const notify = useNotify()
notify.success('Done!', 'Record saved successfully.')
notify.error('Failed', 'Something went wrong.')
notify.warning('Heads up', 'This action cannot be undone.')
```

### Trigger an Excel download

```js
import { useExport } from '@/shared/hooks/useExport'

const { download, loading } = useExport()

// Calls /api/v1/exports/overtime with params, saves as filename
download('/exports/overtime', { dateFrom, dateTo }, 'overtime-report.xlsx')
```

---

## 🧩 Environment Variables

### Server (`server/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ukg_hr
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
NODE_ENV=development

# UKG Pro API credentials (if using live sync)
UKG_BASE_URL=https://your-tenant.ukg.com
UKG_USERNAME=your_ukg_username
UKG_PASSWORD=your_ukg_password
UKG_CLIENT_ID=your_client_id
UKG_CLIENT_SECRET=your_client_secret
```

### Client (`client/`)

No `.env` file needed in development — Vite proxies all API calls via `vite.config.js`.

For **production deployment**, create `client/.env.production`:
```env
VITE_API_BASE_URL=https://your-production-api.com
```
Then update `client/src/lib/api/client.js` to use `import.meta.env.VITE_API_BASE_URL`.

---

## 🚀 Production Build

```bash
# Build the frontend
cd client
npm run build
# Output is in client/dist/ — deploy this folder to any static host (Vercel, Netlify, S3, Nginx)

# Start the backend in production
cd server
NODE_ENV=production npm start
```

**Nginx config example** (to serve frontend + proxy API):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve frontend
    root /var/www/ukg/client/dist;
    index index.html;
    try_files $uri $uri/ /index.html;

    # Proxy API to backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| `npm install` fails | Make sure Node ≥ 18: `node --version` |
| Frontend shows blank page | Check browser console for errors. Make sure backend is running on port 5000. |
| Login returns 401 | Backend is running but DB might not have seeded users. Run `npm run seed` in `server/`. |
| API calls return 404 | Vite proxy is only active in dev. Make sure you ran `npm run dev` not `npm start`. |
| MongoDB connection error | Start MongoDB: `mongod --dbpath /data/db` or start the MongoDB service. |
| Charts not rendering | Normal if the backend returns an empty array. Charts gracefully show "No data available". |
| Export download doesn't start | Check that `dateFrom` and `dateTo` are set. Both are required for export endpoints. |
| Port 3000 already in use | Change port in `client/vite.config.js`: `server: { port: 3001 }` |
| Port 5000 already in use | Change in `server/.env`: `PORT=5001` and update Vite proxy in `client/vite.config.js` |

---

## 📋 Scheduled Jobs (Backend)

The backend runs these cron jobs automatically:

| Job Name | Trigger | Description |
|----------|---------|-------------|
| `attendance-live` | Every 15 min | Syncs live attendance from UKG Pro |
| `employees` | Daily 2:00 AM | Syncs employee master data |
| `leaves` | Daily 3:00 AM | Syncs approved leaves |
| `shifts` | Daily 4:00 AM | Syncs shift schedules |

You can manually trigger any job from the **Jobs** page (`/monitoring/jobs`) when logged in as IT Admin.

---

## 🗄️ Database (MongoDB)

**Database name:** `ukg_hr`

**Collections:**
- `employees` — Employee master data from UKG Pro
- `attendances` — Daily punch-in/out records
- `leaves` — Approved leave records
- `shifts` — Shift schedule assignments
- `users` — System users (IT Admin, HR Admin, Time Office)
- `joblogs` — Sync job execution history
- `auditlogs` — System audit trail

**Seeded data:** 25 employees · 90 days of attendance · 3 system users

---

## 👥 Team / Credits

Built for the Iron & Steel Plant HR Department.  
Frontend: React 18 + Vite + Tailwind CSS  
Backend: Node.js + Express + MongoDB  
Design inspiration: UKG Reports enterprise design system

---

*Last updated: June 2026*
