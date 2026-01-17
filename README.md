# NexEvent - Event Management Platform

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (v18+)

### Setup Instructions

#### 1. Clone and Install

```bash
gh repo clone vfreis09/NexEvent
cd NexEvent
cd server && npm install
cd ../client && npm install
```

#### 2. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=event-management
DB_HOST=localhost
# Note: Docker maps internal 5432 to external 5434
DB_PORT=5434
JWT_SECRET=your_secret
```

#### 3. Start the Application

```bash
# Restart Docker services (if already running)
docker-compose down

# Start Docker with build - this will create tables and run the application
docker-compose up --build -d
```

**Note:** Docker will automatically create all necessary tables, initialize the database, and run both the server and client.

#### 4. Seed Data (Optional)

Run this command from the root folder to populate the database with test data:

```bash
# Seed realistic testing data (50 users, 100 events, tags, and RSVPs)
DB_PORT=5434 npx ts-node server/seed.ts
```

#### 5. Access the Application

- **Client:** http://localhost:5173
- **Server:** http://localhost:3000

---

## 📋 Description

This project is a comprehensive **Event Management Web Application** designed for high engagement and user retention. It provides a robust platform for companies and users to effortlessly create, manage, and discover events, while employing **sophisticated, scalable notification architecture** to prevent user burnout and spam.

---

## ✨ Key Features & Architectural Highlights

### 🛡️ User Authentication

- **Secure Access:** Standard sign-up, login, and logout functionality with email and password
- **Recovery:** Robust password reset mechanism

### 🗓️ Event Management

- **Full CRUD Operations:** Users can create, edit, and delete their events
- **Discovery:** Efficient listing of all events with **pagination** for optimal performance
- **Engagement:** Option to **RSVP** for events, tracking the total number of attendees

### 🗺️ Event Details

- Detailed fields: Title, description, date, and time
- **Geolocation Integration:** Seamless display of the event location using the **Google Maps API**

### 🧑‍💻 User Dashboard

- Personalized view displaying all events created by the user
- Option to easily edit user profile information

### 👑 Admin Panel

- **Comprehensive Management:** Full CRUD capabilities for all events and user accounts
- **Business Intelligence:** Dedicated dashboard featuring key statistics (e.g., total users, events, and RSVPs) for operational oversight

---

## 🔥 Advanced Notification System (Batching & Personalization)

I moved beyond simple, spammy email alerts to implement a **high-value, scalable communication architecture** that boosts user engagement while respecting the user's inbox.

- **Granular Preference Control:** Users can select specific preferences (e.g., only events matching certain tags or categories) to ensure notifications are highly relevant

- **Digest/Batching Emails:** Instead of sending an email for every single event update, the system utilizes a **scheduled background job (Cron/Worker)** to batch updates into a single, comprehensive digest

  - **Anti-Spam Focus:** Drastically reduces email volume, improving user experience and deliverability
  - **Personalized Ranking:** Events within the digest are **filtered and prioritized** based on the user's saved interests, ensuring the most relevant content is always presented first

- **In-App Alerts:** Real-time, non-intrusive notifications for new RSVPs and immediate event cancellations

- **User Utility Reminders:** The digest email also includes a section reminding the user of **upcoming events they have RSVP'd to**, turning the notification into a vital organizational tool

---

## 💻 Tech Stack

| Category         | Technologies Used                                                            |
| ---------------- | ---------------------------------------------------------------------------- |
| **Frontend**     | **React**, **TypeScript**, Bootstrap (or chosen CSS framework)               |
| **Backend**      | **Node.js**, **Express**, **TypeScript**                                     |
| **Database**     | **PostgreSQL** (Chosen for its stability and advanced features)              |
| **Integrations** | **Google Maps API** (Geolocation), **SendGrid** (High-volume email delivery) |

---

## 📝 Notes

- **Responsiveness:** Fully responsive and mobile-friendly design
- **Code Quality:** Clean, modular code structure with extensive comments for high maintainability
- **Documentation:** Clear instructions provided for setting up and running the project locally
