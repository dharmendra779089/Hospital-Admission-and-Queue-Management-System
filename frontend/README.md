# HAQMS Frontend - Next.js Application

Modern Next.js client for the **Hospital Appointment & Queue Management System (HAQMS)**. Built with Next.js 15 (App Router), Tailwind CSS, Lucide icons, and React Context API.

---

## 🏗️ Features

- **Role-Based Portals**:
  - **Receptionist**: Search patients, register new admissions, book appointment slots, manage direct walk-in queue check-ins.
  - **Doctor**: Real-time consultation queue worklist, update queue calling status (`Calling`, `Completed`, `Skipped`), review full patient clinical history records.
  - **Administrator**: Comprehensive hospital analytics, doctor performance, total revenue, and queue statistics.
- **Live Public Calling Monitor (`/queue`)**: High-visibility waiting room display for patients showing real-time token calling numbers, status indicators, and department listings.
- **Full Clinical Archives (`/patients/[id]/history-records`)**: Dedicated view with patient diagnostic records, past appointments, active prescription status, and printable clinical summaries.
- **Fast Search & Responsive UI**: Instant client-side search filtering, glassmorphic design system, and mobile-responsive layout.

---

## 🚀 Getting Started

### 1. Configure Environment Variables
Set the API endpoint in `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 2. Start Development Server
```bash
npm run dev
```
The application runs on `http://localhost:3000`.

### 3. Production Build
```bash
npm run build
npm start
```
