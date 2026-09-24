# RanQuickCalls - Developer Documentation & Deployment Guide

RanQuickCalls is a MERN stack (MongoDB, Express, React, Node.js) web application designed for free, anonymous, and premium audio calling. It utilizes native WebRTC and Socket.io for real-time signaling, matching, and streaming.

---

## 1. System Architecture Overview

```text
  ┌─────────────────────────────────────────────────────┐
  │                   CLIENT LAYER                      │
  │  ┌───────────────────────────────────────────────┐  │
  │  │   React Frontend (Tailwind UI, Audio Wave)    │  │
  │  │   WebRTC Audio Stream & Peer Connections      │  │
  │  │   Socket.io Signaling Handlers                │  │
  │  └───────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────┘
                             ↕ (WS / REST API)
  ┌─────────────────────────────────────────────────────┐
  │                   SERVER LAYER                      │
  │  ┌───────────────────────────────────────────────┐  │
  │  │   Express.js REST APIs (Auth, Stats, Admin)   │  │
  │  │   Socket.io Signaling Server (WebRTC)         │  │
  │  │   Intelligent Matching Queue Service          │  │
  │  └───────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────┘
                             ↕
  ┌─────────────────────────────────────────────────────┐
  │                    DATA LAYER                       │
  │  ┌───────────────────────────────────────────────┐  │
  │  │   MongoDB: Users, Call History, Feedbacks     │  │
  │  │   Redis / Memory Fallback: Blacklists, Cache  │  │
  │  └───────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────┘
```

---

## 2. API Endpoints

### Authentication
- `POST /api/auth/register` - Creates a new user.
- `POST /api/auth/login` - Logs in and returns a JWT token.
- `POST /api/auth/guest` - Creates a random guest account for instant calling.
- `POST /api/auth/logout` - Log out and invalidate token.

### Call History & Statistics
- `GET /api/calls/active` - Retrieve active matched call details.
- `POST /api/calls/end` - Gracefully close active call.
- `GET /api/calls/history` - Get paginated historical call logs.
- `GET /api/calls/statistics` - Retrieve call counts, streaks, and speaking times.

### User profiles
- `GET /api/users/profile` - Fetch authenticated user settings.
- `PUT /api/users/profile` - Update preferences and matching interests.
- `POST /api/users/profile/picture` - Save custom avatar image.
- `POST /api/users/block` - Block a specific user.
- `POST /api/users/unblock` - Unblock a user.
- `GET /api/users/blocked` - Retrieve list of blocked users.

### Feedback & Moderator Reviews
- `POST /api/feedback/call` - Submit rating, audio quality, and connection issues.
- `POST /api/feedback/report` - Flag toxic callers for abuse.
- `GET /api/feedback/user-rating/:userId` - Retrieve rating distributions.

### Administrative Control Panel
- `GET /api/admin/statistics` - Overall active users, system uptime, and average call duration.
- `GET /api/admin/reports` - Query pending abuse tickets.
- `POST /api/admin/users/suspend` - Suspend a user for a custom lock period.

---

## 3. Real-Time Socket.io Events

### Client-to-Server
- `user:join-queue` - Registers the socket in the matchmaking pool.
- `user:accept-match` - Sent during the 10-second acceptance window to accept a matched partner.
- `user:reject-match` - Rejects the candidate partner match.
- `call:webrtc-offer` - Transfers local browser SDP description to peer.
- `call:webrtc-answer` - Transfers response SDP description to peer.
- `call:ice-candidate` - Relays ICE network routing candidate to peer.
- `user:end-call` - Informs server that the caller clicked hangup.

### Server-to-Client
- `match:waiting` - Confirms queue status.
- `match:found` - Relays matching candidate info and countdown values.
- `match:accepted` - Triggers WebRTC connection handshakes when both accept.
- `match:rejected` - Fired if a user rejects the matched pairing.
- `match:timeout` - Fired if the 10-second accept timer elapses.
- `call:webrtc-offer` - Routes incoming SDP offer.
- `call:webrtc-answer` - Routes incoming SDP answer.
- `call:ice-candidate` - Routes incoming network candidates.
- `call:ended` - Signals that partner ended or disconnected.

---

## 4. Database Schema Details

### Users Collection
- `username`: Alphanumeric, unique.
- `email`: Unique, sparse.
- `passwordHash`: Bcrypt hash (not present for guests).
- `ageRange`: String enum.
- `languageLevel`: Beginner / Intermediate / Advanced / Native.
- `interests`: Array of string badges.
- `isOnline`: Boolean status flag.
- `isSuspended`: Suspend lockout flag.
- `averageRating`: Rounded 1-decimal call average.

### Call Records Collection
- `user1Id` & `user2Id`: MongoDB ObjectIds referencing users.
- `startTime` & `endTime`: Date timestamps.
- `duration`: Calculated calling seconds.
- `status`: completed / abandoned / failed.
- `endedBy`: user1 / user2 / system.
- *Includes a TTL index on `createdAt` to purge logs older than 90 days.*

### Abuse Reports Collection
- `reportedUserId`: Flagged user ID.
- `reportedByUserId`: Accuser user ID.
- `reason`: harassment, inappropriate_language, nudity, etc.
- `status`: pending, under_review, resolved, dismissed.

---

## 5. Local Setup & Installation

### Prerequisities
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas connection string.
- Redis (optional; if not running, backend defaults to local cache memory model).

### Running Backend API
1. Navigate to `/server`:
   ```bash
   cd server
   ```
2. Configure `.env` file (see template inside `server/.env`).
3. Start development server with hot-reload:
   ```bash
   npm run dev
   ```

### Running React Frontend Client
1. Navigate to `/client`:
   ```bash
   cd client
   ```
2. Start Vite development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 6. Docker Container Deployment

You can containerize and launch the entire stack in one command:

```bash
docker-compose up --build -d
```

This starts:
- MongoDB at `localhost:27017`
- Redis at `localhost:6379`
- Backend API & WebSockets server at `localhost:5000`
- React Vite Application at `localhost:3000`
