Multi-Tenant Event Booking System – Payload CMS
Overview
A backend system built with Payload CMS to manage events across multiple organizations (tenants) with strict data isolation.
Features include capacity enforcement, waitlisting, automatic promotions, notifications, and an organizer dashboard with live stats.

Key Features
Multi-Tenancy – All records tied to a tenant with backend-enforced access rules.

Smart Booking Flow – Auto-confirm if seats available, waitlist if full, promote oldest waitlisted on cancellations.

Notifications & Logs – Created automatically for every booking status change.

Organizer Dashboard – Event counts, capacity usage, summary stats, and recent activity feed.

Seed Script – Quickly populate tenants, users, events, and bookings for testing.

Tech Stack
Backend: Node.js + Payload CMS

Database: MongoDB

Deployment: Vercel

Setup
bash
Copy
Edit
git clone <repo-url>
cd <project-folder>
npm install
Create .env from .env.example:

ini
Copy
Edit
DATABASE_URI=<your-mongodb-uri>
PAYLOAD_SECRET=<your-secret>

bash
Copy
Edit
npx tsx src/scripts/seed-manual.ts
Run locally: npm run dev

bash
Copy
Edit
npm run dev
Admin panel: http://localhost:3000/admin

Demo Credentials -
Admin – admin@example.com / Password123!
Organizer – t1org@example.com / Password123!
Attendee – t1a1@example.com / Password123!

Deployment
Push to a private GitHub repo.

Deploy to Vercel.

Add .env variables in project settings.
