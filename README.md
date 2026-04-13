# Real-Time Polling System Backend

A scalable, production-ready backend system for real-time polling built using **Node.js**, **Express**, **MongoDB**, and **WebSockets (Socket.IO)**.
The system supports **concurrent voting**, **live result updates**, and **secure access control** using JWT and role-based authorization.

---

## Key Highlights

* Real-time voting using WebSockets (Socket.IO)
* JWT-based authentication & role-based access control (RBAC)
* Concurrency-safe voting (prevents duplicate votes)
* Redis Pub/Sub integration for horizontal scalability
* REST APIs for poll management and analytics
* Modular architecture (Controller → Service → Repository)
* Unit & integration testing using Jest
* Dockerized setup with Nginx for deployment
* API documentation with Swagger
* Rate limiting and structured logging

---

## Architecture Overview

```
Client (Frontend / Postman)
        ↓
   Express Server
        ↓
Controllers → Services → Repositories → MongoDB
        ↓
   WebSocket Layer (Socket.IO)
        ↓
   Redis Pub/Sub (for scaling)
```

---

## Folder Structure

```
src/
├── config/           # DB, Redis, environment configs
├── controllers/      # Request/response handlers
├── services/         # Business logic
├── repositories/     # Database interaction layer
├── models/           # Mongoose schemas
├── routes/           # API routes
├── sockets/          # WebSocket logic
├── middleware/       # Auth, RBAC, error handling, rate limiting
├── validators/       # Request validation (express-validator)
├── constants/        # Roles, enums
├── errors/           # Custom error classes
├── utils/            # Logger, helpers
└── server.js         # Entry point
```

---

## Authentication & Authorization

* Users can register and login
* JWT tokens are issued upon login
* Role-based access control:

  * **Admin** → Create/Delete polls
  * **User** → Vote and view polls

---

## Core Features

### 1. Poll Management

* Create polls with multiple options
* Fetch all polls or specific poll details
* Delete polls (admin only)
* Set poll expiration

### 2. Real-Time Voting

* Users join poll rooms via WebSockets
* Vote events are processed instantly
* Updated results broadcast to all connected clients

### 3. Concurrency-Safe Voting

* One user can vote only once per poll
* Enforced via:

  * Database-level unique index (`userId + pollId`)
  * Service-level validation

### 4. Analytics

* Total votes per option
* Percentage distribution
* Real-time result updates

---

## WebSocket Events

| Event Name    | Description                  |
| ------------- | ---------------------------- |
| `join_poll`   | Join a specific poll room    |
| `vote`        | Submit a vote                |
| `poll_update` | Receive updated poll results |

---

## REST API Endpoints

### Auth

* `POST /auth/register` → Register user
* `POST /auth/login` → Login user

### Polls

* `POST /polls` → Create poll (Admin only)
* `GET /polls` → Get all polls
* `GET /polls/:id` → Get poll details
* `DELETE /polls/:id` → Delete poll (Admin only)

### Voting

* Handled via WebSockets for real-time updates

---

## Validation & Error Handling

* Request validation using **express-validator**
* Centralized error handling middleware
* Handles:

  * Invalid inputs
  * JWT errors
  * MongoDB errors
  * Duplicate vote attempts

---

## Rate Limiting

* Prevents abuse and spam voting
* Configurable limits per IP/user

---

## Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB (Mongoose)
* **Real-Time:** Socket.IO
* **Caching/Scaling:** Redis Pub/Sub
* **Authentication:** JWT
* **Validation:** express-validator
* **Testing:** Jest
* **DevOps:** Docker, Nginx
* **Docs:** Swagger

---

## Docker Setup

```bash
docker-compose up --build
```

---

## Local Setup

```bash
# Clone repo
git clone https://github.com/YOUR_USERNAME/realtime-polling-system-backend.git

# Install dependencies
npm install

# Add environment variables
cp .env.example .env

# Run server
npm run dev
```

---

## Running Tests

```bash
npm test
```

---

## API Documentation

Swagger docs available at:

```
http://localhost:PORT/api-docs
```

## Future Improvements

* Add frontend dashboard
* Poll scheduling system
* Advanced analytics (trends, graphs)
* WebSocket authentication improvements

---

## Author

Sneha Jaiswal

---

## License

MIT License
