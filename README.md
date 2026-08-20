# Placement Portal Application

A full-stack placement management portal built with **React**, **Node.js/Express**, **MongoDB**, and **Redux Toolkit**.

## Features

- **Dashboard Analytics**: Real-time aggregated metrics, placement request stats, monthly trend charts, and system activity feed.
- **Workflow Management**: 4-step interactive placement pipeline:
  1. Student Roster & Filters
  2. Internship Placement Requests
  3. Appointment Calendar & Scheduling
  4. Active Internship Placements
- **Jobs Portal**: Position listings, top employer rankings, status breakdown, multi-column search, and position creation modal.
- **RTO & Industry Partner Management**: Partner dashboards and directory list.
- **Users Administration**: User role management (`Administrator`, `Coordinator`, `RTO Manager`, `Staff`), role statistics, and user account modal.
- **Real-Time Notification System**: Event-driven notifications generated on student, request, appointment, internship, or job creation with an unread badge.
- **Secure Cookie Authentication**: Admin Login, `bcryptjs` password hashing, `HttpOnly` JWT cookie storage, and Redux route protection.
- **Production Environment Readiness**: Dynamic `CLIENT_URL` CORS origin matching and `VITE_API_URL` environment binding.

---

## Tech Stack

- **Frontend**: React 19, React Router v7, Redux Toolkit, TailwindCSS v4, Lucide React Icons, Axios.
- **Backend**: Express v5, MongoDB / Mongoose v9, bcryptjs, jsonwebtoken, cookie-parser, Zod.

---

## Setup & Running

### 1. Backend

```bash
cd backend
npm install
# Setup environment variables in .env
npm run dev
```

To create/reset the primary Administrator account (`mantisplacements@gmail.com`):
```bash
npm run create-admin
```

### 2. Frontend

```bash
cd portal
npm install
# Setup environment variables in .env
npm run dev
```