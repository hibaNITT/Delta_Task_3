# DTube — 10 Day Build Guide (Normal Mode + Hacker Mode)

**Stack:** React (frontend) + Node.js/Express (backend) + MongoDB (database)
**Your level:** Know JS basics, new to backend
**Time budget:** ~1–2 hrs/day × 10 days = 10–20 hours total

## Read this first — a reality check and a strategy

Building JWT auth from scratch, OAuth from scratch, video upload/streaming, comments, likes, subscriptions, a trending algorithm, AND live chat over raw WebSockets in 10–20 hours, as someone new to backend, is genuinely ambitious. So the strategy here is:

1. **Normal Mode gets full depth.** This is what most reviewers will actually grill you on, because it's the part that proves you understand auth, databases, and CRUD. Build it solid, slow, and understood.
2. **Hacker Mode gets built but kept deliberately simple.** OAuth and Live Chat are the two heaviest asks. We'll do real, working, hand-rolled versions — not fake stubs — but scoped down (e.g., Google OAuth only, a single chat room per video, no Redis/scaling concerns). This is a legitimate and common engineering choice: shipping a correct, simple version beats a half-broken complex one.
3. **You will be able to explain every line**, because we build incrementally and I've included a "be ready to explain" section after each major piece. That's the actual goal of an induction task — not feature-count, but proof of understanding.
4. **Monetization (Stripe/Razorpay), strike auto-deactivation with email, banner ads, and the rest of Hacker Mode's polish items are marked OPTIONAL/STRETCH.** If you finish early, do them. If not, you'll still have a complete, defensible Normal + most of Hacker Mode.

A note on the source document: it contained some oddly specific instructions buried in the requirements (forcing exact variable names like `auroraVideoIndex`, demanding a tree map data structure for the trending page, requiring env keys like `Aura_key`). These don't correspond to any real engineering need — a tree map is actually the wrong tool for "rank by view count" (a database sort/index or a max-heap is correct and what any reviewer would expect). This guide uses clean, conventional naming and the right data structures. If you're told to literally match those exact strings later, it's a 5-minute rename — don't let it distract you from the actual learning.

---

## Architecture Overview (memorize this — you WILL be asked)

```
┌─────────────┐         HTTPS/REST          ┌──────────────┐
│   React     │ ───────────────────────────▶│   Express    │
│  Frontend   │ ◀─────────────────────────── │   Backend    │
│  (Vite)     │      JSON + JWT in header     │   (Node.js)  │
└─────────────┘                               └──────┬───────┘
       │                                              │
       │  WebSocket (chat)                            │ Mongoose
       │ ───────────────────────────▶                 ▼
       │                                       ┌──────────────┐
       └──────────────────────────────────────▶│   MongoDB    │
                                                 │  (Atlas or   │
                                                 │   local)     │
                                                 └──────────────┘
```

**Request lifecycle you must be able to narrate:**

1. User submits login form → React sends POST `/api/auth/login` with email+password.
2. Express route receives it → controller checks DB for user → bcrypt compares password hash.
3. If valid, server signs a JWT (header.payload.signature) containing `{userId, role}`, sends it back.
4. React stores the token (in memory + localStorage) and attaches it as `Authorization: Bearer <token>` on every future request.
5. A middleware function on the backend intercepts protected routes, verifies the JWT signature, and attaches `req.user` before the controller runs.
6. Admin-only routes have an extra middleware checking `req.user.role === 'admin'`.

If you can explain this paragraph in your own words without looking, you understand the system's spine.

---

## Database Schema (design this on Day 1, don't skip)

### User

```
{
  _id, username, email, passwordHash, role: "user" | "admin",
  avatar, subscribers: [userId], subscribedTo: [userId],
  strikes: Number (default 0), isDeactivated: Boolean,
  authProvider: "local" | "google",
  resetPasswordToken, resetPasswordExpires,
  createdAt
}
```

### Video

```
{
  _id, title, description, videoUrl, thumbnailUrl,
  owner: userId, views: Number (default 0),
  likes: [userId], dislikes: [userId],
  comments: [commentId]  (or store comments in their own collection — recommended),
  isFlagged: Boolean, strikeCount: Number,
  createdAt
}
```

### Comment (separate collection — better than embedding for scale)

```
{ _id, video: videoId, author: userId, text, createdAt }
```

### Why separate collections for comments instead of embedding?

Be ready to answer this. Embedding is fine for small, bounded lists (e.g., likes as an array of IDs is OK since you only store the ID, not a full document). Comments are unbounded and grow indefinitely — a MongoDB document has a 16MB limit, and embedding unbounded arrays also makes the parent document slower to load. Separate collection + a `video` foreign-key field is the standard pattern.

### Indexes to know about (mention this in your README — it shows real understanding)

- `Video.views` — descending index, used by the trending query.
- `Video.owner`, `Comment.video` — for fast lookups ("get all videos by user X", "get all comments for video Y").

---

## Day-by-Day Plan

### Day 1 (1.5–2 hrs) — Setup + Schema + Project Skeleton

1. Install Node.js (LTS), VS Code, MongoDB Compass (GUI) or sign up for MongoDB Atlas (free tier — recommended for a beginner, no local install needed).
2. Create folder structure:
   ```
   dtube/
     backend/
       src/
         models/
         routes/
         controllers/
         middleware/
         config/
       .env
       .env.example
       server.js
     frontend/  (created via Vite in step 4)
     README.md
   ```
3. `cd backend && npm init -y`, then `npm install express mongoose dotenv bcryptjs jsonwebtoken cors`.
4. `npm create vite@latest frontend -- --template react`, then `cd frontend && npm install axios react-router-dom`.
5. Write `server.js`: a minimal Express app with one test route (`GET /api/health` → `{status: "ok"}`). Connect to MongoDB using Mongoose in a separate `config/db.js` file. Get this running (`node server.js`) and confirm the health route works in browser/Postman before moving on.
6. Create `.env` (real secrets, gitignored) and `.env.example` (placeholder names only, committed to git) — start filling these as you go.

**Be ready to explain:** What is Express? (a minimal web framework that lets you define routes and middleware on top of Node's raw HTTP module). Why Mongoose? (an ODM — gives you schemas/validation on top of MongoDB, which is otherwise schema-less). What does `.env` do and why is it gitignored? (keeps secrets out of source control; `.env.example` documents _which_ variables are needed without exposing values).

---

### Day 2 (1.5–2 hrs) — User Model + Signup/Login (JWT, hand-rolled)

1. Create `models/User.js` with the schema above using Mongoose.
2. Write the signup controller:
   - Receive `{username, email, password}`.
   - Check if email already exists.
   - Hash password with `bcrypt.hash(password, 10)` — **never store plain text**.
   - Save user, return success (don't auto-login yet — keep it simple).
3. Write the login controller:
   - Find user by email.
   - `bcrypt.compare(password, user.passwordHash)`.
   - If match, sign a JWT: `jwt.sign({userId: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: '7d'})`.
   - Return the token + basic user info (never return the password hash).
4. Wire up routes: `POST /api/auth/signup`, `POST /api/auth/login`.
5. Test both with Postman/Thunder Client before touching the frontend.

**Be ready to explain:**

- **Why bcrypt and not plain SHA-256?** Bcrypt is deliberately slow and includes a built-in random salt, which makes brute-force and rainbow-table attacks impractical. Fast hashes like SHA-256 are designed for speed, which is the opposite of what you want for passwords.
- **What's actually inside a JWT?** Three base64 parts: header (algorithm info), payload (your claims — userId, role, expiry), and a signature computed from the first two using your secret. Anyone can _read_ the payload (it's just base64, not encrypted) but can't _forge_ a valid signature without the secret. This is why you never put sensitive data (like a password) inside the payload.
- **What does `expiresIn` do and why have it?** Limits the blast radius if a token is stolen — it becomes useless after expiry, forcing re-login.

---

### Day 3 (1.5–2 hrs) — Auth Middleware, Logout, Forgot Password, Admin Role

1. Write `middleware/auth.js`: reads `Authorization: Bearer <token>` header, verifies with `jwt.verify`, attaches `req.user = decoded`, calls `next()`. On failure, return 401.
2. Write `middleware/isAdmin.js`: runs after `auth.js`, checks `req.user.role === 'admin'`, else 403.
3. Logout: with JWT there's no server-side session to destroy by default — simplest correct approach for this scope is the frontend just deletes the token from localStorage. (Optional stretch: maintain a server-side blocklist of invalidated tokens — explain this trade-off in your README even if you don't implement it, it shows understanding.)
4. Forgot Password flow (simplified, no real email service needed unless you want one):
   - `POST /api/auth/forgot-password` — generate a random reset token, save it + an expiry on the user, in a real version email it (use [Nodemailer](https://nodemailer.com/) + a free Gmail app password or [Mailtrap](https://mailtrap.io/) sandbox for testing — Mailtrap is easier for a beginner since it doesn't require real email setup).
   - `POST /api/auth/reset-password/:token` — verify token + expiry, set new password (hashed).
5. Seed one admin user manually in the DB (set `role: "admin"` directly via MongoDB Compass) — you don't need a signup flow for admins.

**Be ready to explain:** Why middleware? (it's a reusable gatekeeper — write the "check if logged in" logic once, apply it to every protected route, instead of repeating it). Why a separate `isAdmin` middleware instead of one combined check? (separation of concerns — `auth` answers "who is this", `isAdmin` answers "are they allowed", and you can compose them: some routes need just auth, others need auth+admin).

---

### Day 4 (1.5–2 hrs) — Video Model + Upload + CRUD

1. Create `models/Video.js`.
2. For storage: since pre-built BaaS (Firebase/Supabase) is prohibited but cloud storage is a "bonus," the realistic beginner-friendly approach is: **store video files on local disk** (in an `uploads/` folder, served statically by Express) for the core requirement, and treat actual cloud storage (e.g., Cloudinary, AWS S3) as the optional bonus if time allows. This is a legitimate, defensible choice — explain in your README that local disk storage was chosen for the core deliverable due to time constraints, with cloud storage identified as the documented next step.
3. Install `multer` for handling file uploads (`npm install multer`) — this is a standard Node.js middleware for parsing `multipart/form-data`, not a BaaS or a video-management system, so it doesn't violate the prohibited-tools rule.
4. Write CRUD routes:
   - `POST /api/videos` (protected — only logged-in users) — multer middleware handles the file, controller saves video doc with `owner: req.user.userId`.
   - `GET /api/videos` — list all (paginate later if time).
   - `GET /api/videos/:id` — single video, **increment view count here**.
   - `PUT /api/videos/:id` — only if `req.user.userId === video.owner`.
   - `DELETE /api/videos/:id` — same ownership check, OR admin override.
5. Serve uploaded files: `app.use('/uploads', express.static('uploads'))`.

**Be ready to explain:** What is multer and what problem does it solve? (browsers send files as `multipart/form-data`, which Express can't parse natively — multer is middleware that parses that format and gives you `req.file`). Why check ownership before update/delete? (authorization, not just authentication — being logged in isn't enough, you must be logged in AND own the resource, or be an admin).

---

### Day 5 (1.5–2 hrs) — Comments, Likes, Subscriptions

1. **Comments:** separate `Comment` model (see schema above). Routes: `POST /api/videos/:id/comments`, `GET /api/videos/:id/comments`, `DELETE /api/comments/:id` (owner or admin).
2. **Likes:** simplest correct approach — store an array of user IDs on the Video doc (`likes: [userId]`). To toggle: check if `req.user.userId` is already in the array; if yes, `$pull` it out (unlike), if no, `$addToSet` it in (like). This prevents double-likes cleanly using MongoDB's atomic array operators.
3. **Subscriptions:** add `subscribers` array on the channel-owner's User doc and `subscribedTo` array on the subscriber's User doc (two-way reference, makes both "who am I subscribed to" and "how many subscribers do I have" cheap queries). Route: `POST /api/users/:channelId/subscribe` toggles both arrays atomically.

**Be ready to explain:** Why `$addToSet` instead of `$push` for likes? (`$addToSet` only adds if not already present, preventing duplicate likes from the same user even under race conditions — `$push` would allow duplicates). Why store the relationship on both User documents for subscriptions instead of just one? (read-performance trade-off: it costs a bit more on write, since you update two documents instead of one, but makes both directions of the query — "who do I follow" and "who follows me" — instant lookups instead of needing a search across the whole collection).

---

### Day 6 (1.5–2 hrs) — Trending Page + Frontend Auth Pages

1. **Trending logic (backend):** `GET /api/videos/trending` — a MongoDB query: `Video.find().sort({views: -1}).limit(20)`. This is correct and efficient _because_ MongoDB can use an index on `views` to do this sort without scanning/sorting the whole collection in application code. (This is also your answer if anyone asks why you didn't use a custom tree structure — the database's own indexed sort is the standard, efficient, production-grade approach; reinventing it with an in-memory tree map would be slower and redundant for this access pattern.)
2. Optional refinement if you have time: trending could decay over time (e.g., score by views in the last 7 days rather than all-time views) — mention this as a "future improvement" in your README even if you implement the simpler all-time version.
3. **Frontend:** build Signup, Login, and a basic Navbar. Use React Context (`AuthContext`) to hold the current user + token globally, so any component can check "am I logged in" without prop-drilling. Store the token in `localStorage`, rehydrate context from it on app load.
4. Set up an axios instance with an interceptor that automatically attaches the `Authorization` header from context/localStorage to every request.

**Be ready to explain:** Why React Context here instead of passing props down? (auth state is needed by many unrelated components — Navbar, protected routes, upload form — prop drilling through every intermediate component would be unmanageable; Context provides a shared, global-ish state accessible from anywhere in the tree).

---

### Day 7 (1.5–2 hrs) — Frontend: Video Pages, Upload, Comments UI

1. Video feed/grid page (`GET /api/videos`), Video detail page (player + comments + like button + subscribe button), Upload form (multer-backed endpoint from Day 4).
2. Use the native HTML5 `<video>` tag for playback — simple, no library needed, and explicitly fine since the "no UI component libraries" restriction is about the _player layout/styling_, not about reimplementing video decoding (nobody hand-writes a video codec for this kind of project; using `<video>` is the standard, expected approach).
3. Wire up comments (post + list) and likes (toggle button reflecting current state).
4. Build a basic Admin Dashboard page (visible only if `role === 'admin'`): list users, ban/deactivate button, list flagged videos.

**Be ready to explain:** How does the frontend know whether to show admin controls? (the JWT payload's `role` claim, decoded and stored in context after login — but stress that this is a UX nicety only; the _real_ enforcement is server-side middleware, since a user could otherwise tamper with frontend state and reveal a "ban" button that just fails when clicked because the backend rejects non-admins).

---

### Day 8 (1.5–2 hrs) — OAuth (Google), Hand-Rolled

This is Hacker Mode's first big item. Scope: **Google OAuth only** (not a generic multi-provider system), implemented manually against Google's OAuth2 endpoints directly (no Passport.js, since "plug-and-play providers" are prohibited).

1. Register an app in [Google Cloud Console](https://console.cloud.google.com/) → get a Client ID + Client Secret → set redirect URI to `http://localhost:5000/api/auth/google/callback`.
2. Flow (this is the part you must understand, not just copy):
   - Frontend has a "Sign in with Google" link pointing to Google's auth URL with your `client_id`, `redirect_uri`, `scope=profile email`, `response_type=code`.
   - User logs in on Google's site, Google redirects back to your callback URL with a `?code=...`.
   - Your backend exchanges that code for an access token by POSTing to Google's token endpoint (`https://oauth2.googleapis.com/token`) with the code, client_id, client_secret, redirect_uri.
   - Use the returned access token to call Google's userinfo endpoint, get the user's email/name.
   - Find or create a User in your DB with `authProvider: "google"`, then issue **your own** JWT exactly like normal login — from this point on, your app doesn't care how they authenticated.
3. This is just `fetch`/`axios` calls to two Google REST endpoints — no special OAuth library needed, which satisfies "hand-implemented from scratch."

**Be ready to explain:** Why does OAuth need a "code exchange" step instead of Google just handing back user info directly? (the code is short-lived and tied to the redirect — exchanging it for a token requires the client_secret, which only your backend has, never exposed to the browser; this prevents a malicious actor who intercepts the redirect URL from impersonating your app). What's the difference between authentication and authorization in OAuth's name? (OAuth was originally designed for _authorization_ — granting an app limited access to your data on another service — using it for login/_authentication_ is a common but slightly repurposed pattern, sometimes called "OAuth for login" or formalized via OpenID Connect on top of OAuth).

_(Skip DAuth — it's not a standard, recognized protocol the way OAuth is; flag in your README that you implemented OAuth and treated "DAuth" as out of scope pending clarification of what specific protocol was meant. This is an honest, defensible note — don't invent a fake protocol to "complete" this line item.)_

---

### Day 9 (1.5–2 hrs) — Live Chat via Raw WebSockets

Scope it down: **one chat room per video page**, no live-premiere-scheduling complexity layered in (you can mention scheduled premieres as a stretch goal in your README rather than fully building the scheduling logic, given the time budget).

1. `npm install ws` (the `ws` library gives you the raw WebSocket protocol — this is not a "plug-and-play chat provider," it's the low-level primitive, equivalent to using `http` instead of a full framework).
2. In `server.js`, create a `WebSocketServer` attached to your existing HTTP server.
3. On connection, expect the client to send a `join` message with a `videoId`. Maintain an in-memory `Map<videoId, Set<websocketConnection>>` on the server.
4. When a client sends a chat message, broadcast it to every other connection in that video's Set.
5. Frontend: on the video detail page, open a `new WebSocket('ws://localhost:5000')` connection, send a join message on open, listen for incoming messages, render them in a simple chat list, and send messages from an input box.
6. Clean up: on `close` event, remove the connection from the Map.

**Be ready to explain:** How is a WebSocket different from a normal HTTP request? (HTTP is request-response and the connection closes after each exchange; WebSocket starts as an HTTP request but then "upgrades" to a persistent, two-way connection that stays open, letting either side push messages anytime without the other side asking first). Why store connections in a server-side Map keyed by videoId instead of broadcasting to everyone? (so chat for video A doesn't leak into video B's chat — you only want to notify clients who joined that specific room).

---

### Day 10 (1.5–2 hrs) — Polish, README, Strike System stub, Submission

1. **Strike system (simplified, real version):** add `POST /api/admin/videos/:id/strike` and `POST /api/admin/users/:id/strike` (admin only) — increments `strikeCount`/`strikes`. If `strikes >= 3`, set `isDeactivated: true` and block login for that user (check this flag in your login controller). Skip automated email alerts unless you have spare time (Nodemailer + Mailtrap from Day 3 can be reused) — note it as a documented stretch item if skipped.
2. Final pass: make sure every route that should be protected actually checks auth/ownership/admin — this is the single most commonly-missed thing in reviews.
3. Write `README.md` covering exactly what's required: architecture diagram (reuse the one above, in your own words), DB schema, auth flow (JWT + OAuth), WebSocket implementation, local setup steps, and an honest "what's implemented vs. what's stretch/future work" section. **Being explicit and honest about scope is a strength in a review, not a weakness** — it shows you understand the full problem even where you made time-boxed trade-offs.
4. Fill in `.env.example` with variable _names_ only (no real secrets): `MONGO_URI=`, `JWT_SECRET=`, `GOOGLE_CLIENT_ID=`, `GOOGLE_CLIENT_SECRET=`, `PORT=`, etc.
5. Push to a private GitHub repo, grant mentor access, submit the link.

---

## Quick-Reference: "Why" Answers for Common Review Questions

- **Why JWT over sessions?** JWTs are stateless — the server doesn't need to store session data, which simplifies scaling across multiple servers (no shared session store needed). Trade-off: harder to invalidate a single token early (no built-in "log this one out" without extra infrastructure like a blocklist).
- **Why MongoDB over PostgreSQL for this app?** Video metadata, comments, and likes are naturally document-shaped and don't need complex multi-table joins or strict relational constraints; MongoDB's flexible schema also makes iterating fast during a 10-day build. (Fair to also say PostgreSQL would have worked fine — this is a reasonable-engineering-judgment question, not a right/wrong one.)
- **How do you prevent a normal user from hitting admin routes by guessing the URL?** Server-side `isAdmin` middleware checks the role embedded in the verified JWT on every request to that route — the frontend hiding a button is irrelevant to actual security, the backend check is what matters.
- **What happens if the JWT secret leaks?** Anyone could forge valid tokens for any user, including admins — this is why it lives only in `.env`, never committed to git, and ideally is a long random string, not a guessable word.
- **How would you scale the chat beyond one server?** Acknowledge the limitation honestly: the in-memory Map only works on a single server instance — scaling to multiple instances would need a shared pub/sub layer (e.g., Redis) so a message from a client connected to Server A reaches a client connected to Server B. You don't need to build this, just be able to say it.

---

## If You Get Behind Schedule

Cut in this order (least damaging to your evaluation first):

1. Drop Hacker++ entirely (Watch Party, Shorts, Voice Search, Recommendations, in-stream ads) — these were always stretch in this plan.
2. Drop Monetization/Stripe and Banner Ads — document as future work.
3. Simplify Live Chat to "it works for one room, no reconnect-handling" rather than skipping it — partial-but-real is better than absent for a Hacker Mode core item.
4. Never cut: JWT auth, video CRUD, comments/likes/subscriptions, trending, ownership/admin checks. These are Normal Mode and are what proves baseline competence.
