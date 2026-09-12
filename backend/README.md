# HAQMS Backend - Node + Express + Prisma API Server

RESTful API service and database layer for the **Hospital Appointment & Queue Management System (HAQMS)**. Built with Node.js, Express, Prisma ORM, and PostgreSQL.

---

## 🏗️ Architecture & Features

- **Authentication & RBAC**: Stateless JWT authentication (`HS256`) with strict role-based access control (`ADMIN`, `DOCTOR`, `RECEPTIONIST`). Passwords securely hashed with `bcryptjs`.
- **Atomic Queue Management**: Concurrent check-ins protected inside serializable database transactions (`$transaction`) preventing duplicate tokens and race conditions.
- **Appointment Scheduling**: Real-time slot booking with unique physician-slot constraints (`@@unique([doctorId, appointmentDate])`) to prevent double-booking.
- **Optimized Analytics**: Parallel aggregations (`Promise.all` with Prisma `groupBy`) delivering sub-millisecond doctor performance and queue metrics without blocking the event loop.
- **SQL Injection Prevention**: Safe ORM queries with parameterized Prisma filters.

---

## 🚀 Getting Started

### 1. Configure Environment Variables
Copy `.env.example` to `.env` and set your PostgreSQL connection string and JWT secret:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` points to your PostgreSQL instance:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/haqms?schema=public"
JWT_SECRET="your-secure-jwt-secret-key"
```

### 2. Run Database Migrations & Seed
Apply schema migrations and populate initial hospital data (doctors, patients, appointments, tokens, and staff accounts):
```bash
npm run db:setup
```

### 3. Start Development Server
```bash
npm run dev
```
The server will boot on `http://localhost:5000`.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token |
| `POST` | `/api/auth/register` | Public | Register new staff / patient user |
| `GET` | `/api/doctors` | Public | List doctors with optional search/department filter |
| `GET` | `/api/patients` | Authenticated | Paginated patient registry |
| `GET` | `/api/patients/:id` | Authenticated | Fetch patient record and medical history |
| `GET` | `/api/appointments` | Authenticated | List appointments by date / doctor |
| `POST` | `/api/appointments` | Receptionist / Admin | Book a new physician appointment |
| `GET` | `/api/queue/today` | Public | Fetch live clinic queue tokens for today |
| `POST` | `/api/queue/checkin` | Receptionist / Admin | Check in a patient and issue sequential token |
| `PATCH` | `/api/queue/:id/status` | Doctor / Receptionist | Update queue status (`CALLING`, `COMPLETED`, `SKIPPED`) |
| `GET` | `/api/reports/doctor-stats` | Admin | Aggregate doctor revenue, appointments, and queue size |
