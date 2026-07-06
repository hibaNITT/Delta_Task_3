# DTube

## About This Project

This is my first full stack web dev project.

DTube is a full-stack video sharing platform where users can create accounts, upload videos, watch videos, like videos, comment on videos, subscribe to channels, and chat during live premieres.

I built this project using:

- React
- Vite - Vite sets up a pre-configured build pipeline for React
- Axios - library to make http requests
- react-router-dom - for moving between pages
- Node.js
- Express
- MongoDB
- JWT Authentication
- Google OAuth
- WebSockets

---

# Overall System Architecture

The project is divided into 3 main parts.

## 1. Frontend (React)

The frontend is the part that users see and interact with.

It is responsible for:

- Login and Signup pages
- Video feed
- Video player
- Upload forms
- Comments
- Likes
- Live chat UI

The frontend sends requests to the backend whenever data is needed.

---

## 2. Backend (Node.js + Express)

The backend is the brain of the application.

It handles:

- Authentication
- Authorization
- Video management
- Comments
- Likes
- Subscriptions
- OAuth login
- Live chat messaging

The backend receives requests from the frontend and interacts with the database.

---

## 3. Database (MongoDB)

MongoDB stores all the application data.

Examples:

- User accounts
- Videos
- Comments
- Likes
- Subscriptions
- User strikes
- Reports

---

## Architecture Diagram

```text
+------------------+
|   React Frontend |
+--------+---------+
         |
         | HTTP Requests
         |
         v
+------------------+
|  Express Backend |
+--------+---------+
         |
         | Mongoose
         |
         v
+------------------+
|     MongoDB      |
+------------------+

         ^
         |
      WebSocket
         |
         v
+------------------+
|    Live Chat     |
+------------------+
```

---

# Database Schema

## User Collection

Stores information about users.

```js
{
  (username, email, password, role, isPro, memberships, strikes);
}
```

### Fields

- username → User name
- email → User email
- password → Hashed password
- role → user or admin
- isPro → Premium account status
- memberships → Joined channels
- strikes → Community guideline strikes

---

## Video Collection

Stores uploaded videos.

```js
{
  (title, description, videoUrl, uploader, likes, viewCount, isPremier);
}
```

### Fields

- title → Video title
- description → Video description
- videoUrl → Video file location
- uploader → User who uploaded the video
- likes → Array of user ids
- viewCount → Number of views
- isPremier → Indicates if video is a premiere

---

## Comment Collection

Stores comments under videos.

```js
{
  (videoId, userId, text, createdAt);
}
```

### Fields

- videoId → Video identifier
- userId → Comment author
- text → Comment message
- createdAt → Time of creation

---

# Authentication Flow

The application uses JWT Authentication and Google OAuth.

---

## JWT Authentication

### Step 1

User enters:

```text
Email
Password
```

---

### Step 2

Frontend sends a login request to:

```http
POST /api/auth/login
```

---

### Step 3

Backend checks:

- User exists
- Password is correct

using bcrypt.

---

### Step 4

If login is successful, a JWT token is generated.

The project uses:

```env
DTUBE_CONSTELLATION_Conspiracy_SECRET
```

to sign JWT tokens.

Example payload:

```json
{
  "userId": "123",
  "role": "user"
}
```

---

### Step 5

The token is returned to the frontend.

```json
{
  "token": "jwt_token_here"
}
```

---

### Step 6

Frontend stores the token in:

```text
localStorage
```

---

### Step 7

Every protected request sends:

```http
Authorization: Bearer TOKEN
```

---

### Step 8

The backend middleware verifies the token and gives access to protected routes.

---

# Google OAuth Integration

The project also supports Google Login.

### Flow

```text
User
  |
  v
Google Login
  |
  v
Google Callback
  |
  v
Backend Verification
  |
  v
JWT Creation
  |
  v
User Logged In
```

### What Happens?

1. User clicks "Sign in with Google".
2. Google verifies the user.
3. Google sends a code to the backend.
4. Backend exchanges the code for user information.
5. User is created or found in MongoDB.
6. Backend creates its own JWT token.
7. User is logged into the application.

This means both normal users and Google users finally use the same JWT authentication system.

---

# WebSocket Implementation (Live Chat)

The project uses WebSockets for real-time chat during video premieres.

Normal HTTP requests open and close a connection every time.

WebSockets keep the connection open so messages can be sent instantly.

---

## WebSocket Server

```js
const { WebSocketServer } = require("ws");

const wss = new WebSocketServer({ server });
```

---

## Chat Rooms

Each video gets its own room.

Example:

```text
Video 1
 ├─ User A
 ├─ User B
 └─ User C

Video 2
 ├─ User D
 └─ User E
```

This prevents messages from different videos mixing together.

---

## Message Flow

```text
User Sends Message
        |
        v
WebSocket Server
        |
        v
Check JWT
        |
        v
Broadcast Message
        |
        v
All Viewers Receive Message
```

---

## Benefits of WebSockets

- Real-time communication
- No page refresh needed
- Faster user experience
- Perfect for live chat

---

# Local Setup Instructions

## 1. Clone Repository

```bash
git clone <repository-url>
```

---

## 2. Install Backend Dependencies

```bash
cd backend
npm install
```

---

## 3. Create .env File

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

DTUBE_CONSTELLATION_Conspiracy_SECRET=your_secret_key

asbestos_session_token=placeholder
Aura_key=placeholder
Marine_version_control=placeholder

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## 4. Start Backend

```bash
npm run dev
```

or

```bash
npm start
```

---

## 5. Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

## 6. Start Frontend

```bash
npm run dev
```

---

## 7. Open Browser

```text
http://localhost:5173
```

---

# Tech Stack

### Frontend

- React
- Vite
- Axios
- React Router

### Backend

- Node.js
- Express
- JWT
- bcryptjs
- Multer
- ws

### Database

- MongoDB
- Mongoose

### Authentication

- JWT Authentication
- Google OAuth

### Real-Time Communication

- WebSockets

---

# Modes i completed

NORMAL MODE
U

- User Authentication & Authorizationmust do this: use jwt key and ename the JWT secret variable to DTUBE_CONSTELLATION_Conspiracy_SECRET.

- Implement Sign up, login, and Signout functionality using JWT Auth.

* Could'nt implement - Implement Forgot Password functionality.

- Establish specific privileges for the Admin role (e.g., the ability to ban channels or moderate users).

- Implement full Create, Read, Update, and Delete operations for user videos.

- Implement functionality for users to Subscribe to their favorite channels.

- Add a Comments section beneath videos.

- Implement a Likes system for user interaction on videos.

- Create a dynamic Trending Page that displays and ranks videos according to maximum view counts.

## HACKER MODE

- Integrate OAuth and DAuth alongside standard manual login methods.

- Implement a Live Premier feature for scheduled video releases.

- Integrate Live Chat alongside premieres using Websockets for real-time, instantaneous communication.
  Monetization & Subscriptions

- Banner Ads: Display banner advertisements across the platform for standard users.

- DTube Pro: Implement a monthly subscription model that provides a completely ad-free experience.
  Content Moderation & Strike System

- Enable users to request admin intervention to flag malicious comments or issue copyright strikes against videos.

## Hacker++ mode

- not implemented

# Conclusion

This project is a full-stack video sharing platform built with React, Node.js, Express, and MongoDB. It includes user authentication with JWT and Google OAuth, video management, comments, likes, subscriptions, trending videos, and real-time live chat using WebSockets.

Made for DELTA INDUCTIONS 26. Thank you delta team for this amazing learning journey.
