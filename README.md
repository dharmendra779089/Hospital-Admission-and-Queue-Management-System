# HAQMS: Hospital Appointment & Queue Management System

A production-grade, full-stack healthcare platform designed to streamline outpatient flow, appointment scheduling, and real-time consultation queues in clinical environments.

![HAQMS Reception Preview](frontend/public/hero-reception.png)

---

## 🌟 Key Highlights & Features

- **Live Public Calling Board (`/queue`)**:
  - Full-screen digital display for waiting rooms showing active calling tokens, doctor assignments, and patient queue status in real time.
- **Receptionist Scheduling Engine**:
  - Direct walk-in patient registration, quick slot booking with calendar pickers, and instant queue check-in.
- **Doctor Consultation Worklist**:
  - Live patient queue tracker with one-click status transitions (`Calling`, `Completed`, `Skipped`), consultation histories, and instant patient file access.
- **Clinical Health Archive (`/patients/[id]/history-records`)**:
  - Deep-dive diagnostic records, chronic condition tracking, appointment history timelines, and printable diagnostic summaries.
- **Administrative Intelligence & Reporting**:
  - High-level executive dashboard aggregating physician revenue, appointment completion rates, and daily department throughput.
- **Role-Based Access Control (RBAC)**:
  - Secure stateless JWT authentication with role authorization (`ADMIN`, `DOCTOR`, `RECEPTIONIST`) and bcrypt password hashing.
- **Race-Condition & Double-Booking Protection**:
  - Serializable Prisma database transactions (`$transaction`) prevent duplicate queue tokens; database-level unique constraints (`@@unique([doctorId, appointmentDate])`) eliminate double-booking.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | [Next.js 15 (App Router)](https://nextjs.org/), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/) |
| **Backend** | [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/) |
| **Authentication** | [jsonwebtoken (HS256)](https://github.com/auth0/node-jsonwebtoken) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| **Cloud Deployment** | [Render](https://render.com/) Infrastructure-as-Code via `render.yaml` (Managed PostgreSQL + Web Services) |

---

## 📁 Project Architecture

```text
HAQMS/
├── backend/                  # Express REST API & Database Layer
│   ├── prisma/
│   │   ├── schema.prisma     # PostgreSQL schema definitions & indices
│   │   └── seed.js           # Database seed script with mock doctors & patients
│   ├── src/
│   │   ├── middleware/       # JWT authentication & RBAC middleware
│   │   ├── routes/           # API routes (appointments, auth, doctors, patients, queue, reports)
│   │   └── index.js          # Express app entrypoint & CORS configuration
│   └── package.json
│
├── frontend/                 # Next.js 15 Client Application
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── app/              # Next.js App Router (dashboard, login, queue, patients)
│   │   ├── components/       # UI layout components
│   │   └── context/          # Global React AuthContext
│   └── package.json
│
├── render.yaml               # Infrastructure-as-Code Blueprint for Render deployment
└── package.json              # Monorepo root workspace orchestrator
```

---

## ☁️ Deploying to Render (One-Click Blueprint)

The project includes a pre-configured `render.yaml` Infrastructure-as-Code Blueprint that sets up everything automatically:
1. **Managed PostgreSQL**: Creates a managed `haqms-db` instance on Render.
2. **Backend Web Service (`haqms-backend`)**:
   - Automatically links `DATABASE_URL` from the managed database.
   - Generates a secure `JWT_SECRET`.
   - Runs Prisma migrations and database seed automatically on build/startup.
3. **Frontend Web Service (`haqms-frontend`)**:
   - Injects `NEXT_PUBLIC_API_URL` pointing to the live backend service.
   - Builds and serves the Next.js production bundle.

### Steps to Deploy:
1. Push your repository to **GitHub**.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** → **Blueprint**.
4. Select your **HAQMS** repository and click **Apply**.
5. Render will automatically provision the PostgreSQL database, deploy the backend API, and deploy the frontend client.

---

## 💻 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: Local PostgreSQL instance or cloud database (e.g., Render Managed PostgreSQL)

### 2. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/HAQMS.git
cd HAQMS

# Install root, backend, and frontend dependencies
npm run install:all
```

### 3. Start Database
Ensure your PostgreSQL server (local or hosted on Render) is running and configure `backend/.env`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/haqms?schema=public"
JWT_SECRET="super-secret-jwt-key"
FRONTEND_URL="http://localhost:3000"
```

### 4. Migrate and Seed the Database
```bash
npm run db:setup --prefix backend
```

### 5. Launch Development Servers
Run both frontend and backend concurrently:
```bash
npm run dev
```
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🔑 Pre-Seeded Demo Credentials

All seeded accounts use the password: **`password123`**

| Role | Email | Features / Capabilities |
|---|---|---|
| **Administrator** | `admin@haqms.com` | Access system metrics, physician revenue reports, full patient registry |
| **Receptionist** | `reception1@haqms.com` | Register patients, book appointments, issue direct queue tokens |
| **Doctor** | `doctor1@haqms.com` | Manage active consultation queue (`Calling`, `Completed`), view medical records |

---

## 📡 REST API Reference

| Endpoint | Method | Role Required | Description |
|---|---|---|---|
| `/api/auth/login` | `POST` | Public | Authenticate user & receive JWT token |
| `/api/auth/register` | `POST` | Public | Register new staff or patient account |
| `/api/doctors` | `GET` | Public | Search and list doctors by name or department |
| `/api/patients` | `GET` | Authenticated | Paginated list of patients with search filtering |
| `/api/patients/:id` | `GET` | Authenticated | Fetch complete patient diagnostic history |
| `/api/appointments` | `GET` | Authenticated | Filter appointments by date and physician |
| `/api/appointments` | `POST` | Receptionist / Admin | Create a confirmed patient appointment |
| `/api/queue/today` | `GET` | Public | Live queue token board for today's consultations |
| `/api/queue/checkin` | `POST` | Receptionist / Admin | Atomic queue check-in with auto-sequenced token |
| `/api/queue/:id/status` | `PATCH` | Doctor / Receptionist | Update token status (`WAITING`, `CALLING`, `COMPLETED`, `SKIPPED`) |
| `/api/reports/doctor-stats`| `GET` | Admin | Aggregate doctor revenue, appointments, and queue volume |

---

## 🧪 Testing & Quality Assurance

HAQMS features an automated 57-point end-to-end test suite covering authentication, RBAC, appointment scheduling, race-condition slot collision prevention, atomic queue state transitions, input validation, and performance benchmarking.

### Run the Test Suite
```bash
npm test
```

### Test Coverage Highlights
- **RBAC & Authorization**: Strict role-level guards for `ADMIN`, `DOCTOR`, and `RECEPTIONIST`.
- **Concurrency & Race Conditions**: Atomic `$transaction` guards against duplicate check-ins and physician slot double-booking.
- **Data Integrity & Boundaries**: Input sanitization, extreme age bounds (0–150), negative pagination handling, and empty clinical histories.
- **Continuous Integration**: Automated GitHub Actions CI pipeline running linting, production build verification, and end-to-end integration tests on every commit.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
