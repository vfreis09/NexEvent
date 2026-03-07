# NexEvent - Event Management Platform

🌐 **Live Demo:** [https://nexevent-app.vercel.app](https://nexevent-app.vercel.app)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL database (local or hosted via Supabase)

### Setup Instructions

#### 1. Clone and Install

```bash
gh repo clone vfreis09/NexEvent
cd NexEvent
cd server && npm install
cd ../client && npm install
```

#### 2. Environment Configuration

Create a `.env` file in the `/server` directory:

```env
DATABASE_URL=your_supabase_or_postgres_connection_string
PORT=3000
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/user/google/callback
FRONTEND_URL=http://localhost:5173
BREVO_API_KEY=your_brevo_api_key
```

Create a `.env` file in the `/client` directory:

```env
VITE_PUBLIC_API_URL=localhost:3000
VITE_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
VITE_PUBLIC_API_KEY=your_google_maps_api_key
```

#### 3. Start the Application

```bash
# In /server
npm run dev

# In /client
npm run dev
```

#### 4. Seed Data (Optional)

```bash
DB_PORT=5432 npx ts-node server/seed.ts
```

Seeds 50 users, 100 events, tags, and RSVPs.

#### 5. Access the Application

- **Client:** http://localhost:5173
- **Server:** http://localhost:3000

---

## 📋 Description

NexEvent is a full-stack **Event Management Web Application** built for high engagement and user retention. It provides a robust platform for users to create, manage, and discover events, with a sophisticated notification system designed to keep users informed without inbox spam.

---

## ✨ Features

### 🛡️ Authentication

- Email/password sign-up, login, and logout
- **Google OAuth** for one-click sign-in
- Email verification flow
- Password reset via email link with rate limiting

### 🗓️ Event Management

- Full CRUD operations for events
- Public and **private event visibility** — private events are only visible to the author and invited users
- Pagination for efficient event discovery
- RSVP system with live attendee count tracking
- Event status lifecycle: active → full → expired → canceled

### 🗺️ Event Details

- Title, description, date/time, max attendees
- **Google Maps API** integration for location search and map display
- Tag system for categorizing events

### 👥 Invitations

- Event owners can invite users by username or email to private events
- Invited users receive in-app notifications with Accept/Reject actions
- Accepting an invite automatically RSVPs the user

### 🧑‍💻 User Profiles

- View events created and RSVPed by any user
- Profile picture upload
- Notification and digest email preferences
- Light/dark theme preference saved per user

### 👑 Admin Panel

- Full CRUD over all events and user accounts
- Dashboard with platform statistics (total users, events, RSVPs)
- Ability to ban users

---

## 🔥 Notification System

NexEvent implements a **batching and personalization architecture** to maximize value while minimizing spam.

- **Tag-based preferences:** Users subscribe to tags and only receive digests for events matching their interests
- **Digest emails:** A scheduled background job (cron) batches new events into a single digest email — daily or weekly based on user preference — instead of sending one email per event
- **In-app notifications:** Real-time alerts for RSVPs, invite responses, event updates, and cancellations with smart deduplication to prevent notification spam
- **RSVP reminders:** Digest emails include upcoming events the user has RSVP'd to

---

## 💻 Tech Stack

| Category       | Technologies                          |
| -------------- | ------------------------------------- |
| **Frontend**   | React, TypeScript, Bootstrap, Vite    |
| **Backend**    | Node.js, Express, TypeScript          |
| **Database**   | PostgreSQL (Supabase)                 |
| **Auth**       | JWT, Google OAuth 2.0                 |
| **Email**      | Brevo (transactional + digest emails) |
| **Maps**       | Google Maps API                       |
| **Deployment** | Railway (backend), Vercel (frontend)  |

---

## 📝 Notes

- Fully responsive and mobile-friendly
- All private event data is enforced at the API level — visibility rules apply across home feed, search, user profiles, and RSVP tabs
- Clean modular code structure across controllers, middlewares, and services
