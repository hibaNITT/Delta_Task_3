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

## Day-by-Day Plan — Vertical Slices (Backend + Frontend Together)

A note on why it's structured this way: each day builds one complete feature end-to-end — backend route, then immediately the React piece that talks to it — rather than "all backend first, then all frontend." This means you see real, working things on screen every single day (not fake/mocked data), you never have to rewire frontend code because the real API turned out different from what you guessed, and you genuinely understand each feature as one unit, which is exactly what a mentor will probe for. The trade-off is your React code on Day 1–2 will be rough/unstyled — that's fine, polish comes later once everything is wired up.

### Day 1 (1.5–2 hrs) — Setup: Backend Skeleton + Frontend Skeleton, Connected

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
     frontend/  (created via Vite below)
     README.md
   ```
3. `cd backend && npm init -y`, then `npm install express mongoose dotenv bcryptjs jsonwebtoken cors`.
4. Write `server.js`: a minimal Express app with one test route (`GET /api/health` → `{status: "ok"}`). Connect to MongoDB using Mongoose in a separate `config/db.js` file. Get this running (`node server.js`) and confirm the health route works in browser/Postman.
5. `npm create vite@latest frontend -- --template react`, then `cd frontend && npm install axios react-router-dom`.
6. In React, call your `/api/health` endpoint from `App.jsx` using axios on page load and display the result on screen. **Goal for today: see the literal text "ok" rendered in your browser, proving frontend talks to backend talks to database.** This is the smallest possible vertical slice — get it working before anything else.
7. Create `.env` (real secrets, gitignored) and `.env.example` (placeholder names only, committed to git) — start filling these as you go.

**Be ready to explain:** What is Express? (a minimal web framework that lets you define routes and middleware on top of Node's raw HTTP module). Why Mongoose? (an ODM — gives you schemas/validation on top of MongoDB, which is otherwise schema-less). What does `.env` do and why is it gitignored? (keeps secrets out of source control; `.env.example` documents _which_ variables are needed without exposing values). Why CORS, and where did you configure it? (browsers block JS from one origin — your React dev server on port 5173 — from calling a different origin — your API on port 5000 — unless the server explicitly allows it via the `cors` middleware).

---

### Day 2 (1.5–2 hrs) — Slice: Signup + Login (JWT, hand-rolled) — Backend and Frontend Together

1. Create `models/User.js` with the schema above using Mongoose.
2. Write the signup controller: receive `{username, email, password}`, check if email already exists, hash password with `bcrypt.hash(password, 10)` — **never store plain text** — save user, return success.
3. Write the login controller: find user by email, `bcrypt.compare(password, user.passwordHash)`, if match sign a JWT (`jwt.sign({userId: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: '7d'})`), return the token + basic user info (never the password hash).
4. Wire up routes: `POST /api/auth/signup`, `POST /api/auth/login`. **Test both with Postman/Thunder Client first** — confirm the backend works in isolation before touching React, so if something breaks later you know it's a frontend wiring issue, not a backend logic issue.
5. Now build the frontend half the same day: a Signup page and Login page (plain HTML forms, no styling yet), each posting to the routes above with axios. On successful login, store the returned token in `localStorage`.
6. Create `AuthContext` (React Context) to hold `{user, token}` globally, and a simple Navbar that shows "Login/Signup" or the username depending on whether `user` exists in context. Rehydrate context from `localStorage` on app load so refreshing the page doesn't log you out.

**Be ready to explain:**

- **Why bcrypt and not plain SHA-256?** Bcrypt is deliberately slow and includes a built-in random salt, which makes brute-force and rainbow-table attacks impractical. Fast hashes like SHA-256 are designed for speed, which is the opposite of what you want for passwords.
- **What's actually inside a JWT?** Three base64 parts: header (algorithm info), payload (your claims — userId, role, expiry), and a signature computed from the first two using your secret. Anyone can _read_ the payload (it's just base64, not encrypted) but can't _forge_ a valid signature without the secret. This is why you never put sensitive data (like a password) inside the payload.
- **Why React Context here instead of passing props down?** Auth state is needed by many unrelated components — Navbar, protected routes, upload form — prop drilling through every intermediate component would be unmanageable; Context provides shared state accessible from anywhere in the tree.

---

### Day 3 (1.5–2 hrs) — Slice: Protected Routes, Logout, Forgot Password, Admin Role

1. Write `middleware/auth.js`: reads `Authorization: Bearer <token>` header, verifies with `jwt.verify`, attaches `req.user = decoded`, calls `next()`. On failure, return 401.
2. Write `middleware/isAdmin.js`: runs after `auth.js`, checks `req.user.role === 'admin'`, else 403.
3. Set up an axios instance (e.g. `api.js`) with an interceptor that automatically attaches the `Authorization` header from context/localStorage to every outgoing request — do this now so every feature you build for the rest of the project gets auth for free.
4. Logout (frontend): clear the token from `localStorage` and reset context. (With JWT there's no server-side session to destroy by default. Optional stretch: a server-side blocklist of revoked tokens — explain this trade-off in your README even if you don't implement it.)
5. Forgot Password flow: `POST /api/auth/forgot-password` (generate + save a reset token + expiry; email it later via Mailtrap sandbox if time allows — easier for a beginner than real Gmail setup) and `POST /api/auth/reset-password/:token` (verify + set new hashed password). Build a minimal frontend form for each.
6. Seed one admin user manually in the DB (set `role: "admin"` directly via MongoDB Compass) — you don't need a signup flow for admins.
7. Quick frontend test: build one throwaway protected page (e.g. `/api/auth/me` returning the current user) and confirm it 401s when logged out and works when logged in. This proves your middleware + interceptor combo works before you build real features on top of it.

**Be ready to explain:** Why middleware? (a reusable gatekeeper — write the "check if logged in" logic once, apply it to every protected route, instead of repeating it). Why a separate `isAdmin` middleware instead of one combined check? (separation of concerns — `auth` answers "who is this", `isAdmin` answers "are they allowed", and you can compose them).

---

### Day 4 (1.5–2 hrs) — Slice: Video Upload + CRUD + Video Feed/Player

1. Create `models/Video.js`.
2. For storage: since pre-built BaaS (Firebase/Supabase) is prohibited but cloud storage is a "bonus," store video files on local disk (an `uploads/` folder, served statically by Express) for the core requirement, treating actual cloud storage as an optional bonus later. Document this choice in your README.
3. Install `multer` for handling file uploads — this is standard Node.js middleware for parsing `multipart/form-data`, not a BaaS, so it doesn't violate the prohibited-tools rule.
4. Write CRUD routes: `POST /api/videos` (protected, multer-handled, `owner: req.user.userId`), `GET /api/videos` (list all), `GET /api/videos/:id` (single video, **increment view count here**), `PUT /api/videos/:id` (owner-only), `DELETE /api/videos/:id` (owner or admin). Serve uploaded files via `app.use('/uploads', express.static('uploads'))`.
5. Frontend, same day: an Upload form (file input + title/description, posts as `multipart/form-data`), a Video feed/grid page (`GET /api/videos`), and a Video detail page using the native HTML5 `<video>` tag for playback (no library needed — the "no UI component libraries" restriction is about player _layout/styling_, not about reimplementing video decoding).

**Be ready to explain:** What is multer and what problem does it solve? (browsers send files as `multipart/form-data`, which Express can't parse natively — multer parses that format and gives you `req.file`). Why check ownership before update/delete? (authorization, not just authentication — being logged in isn't enough, you must own the resource or be an admin).

---

### Day 5 (1.5–2 hrs) — Slice: Comments, Likes, Subscriptions — Wired Into the Video Page

1. **Comments (backend):** separate `Comment` model. Routes: `POST /api/videos/:id/comments`, `GET /api/videos/:id/comments`, `DELETE /api/comments/:id` (owner or admin).
2. **Likes (backend):** store an array of user IDs on the Video doc (`likes: [userId]`). Toggle: if `req.user.userId` already in the array, `$pull` it out (unlike); if not, `$addToSet` it in (like) — this prevents double-likes cleanly using MongoDB's atomic array operators.
3. **Subscriptions (backend):** `subscribers` array on the channel-owner's User doc, `subscribedTo` array on the subscriber's User doc (two-way reference). Route: `POST /api/users/:channelId/subscribe` toggles both atomically.
4. **Frontend, same day:** on the Video detail page you built Day 4, add a comment list + post-comment box, a like button that reflects current state (filled/outlined depending on whether your userId is in the `likes` array), and a subscribe/unsubscribe button on the channel. By end of day the video page should feel like a real video page, not just a player.

**Be ready to explain:** Why `$addToSet` instead of `$push` for likes? (only adds if not already present, preventing duplicate likes even under race conditions). Why store the relationship on both User documents for subscriptions instead of just one? (write costs a bit more — two documents instead of one — but makes both "who do I follow" and "who follows me" instant lookups instead of needing a collection-wide search).

---

### Day 6 (1.5–2 hrs) — Slice: Trending Page + Admin Dashboard

1. **Trending logic (backend):** `GET /api/videos/trending` — `Video.find().sort({views: -1}).limit(20)`. This is correct and efficient because MongoDB can use an index on `views` to do this sort without scanning/sorting in application code. (This is also your answer if anyone asks why you didn't use a custom tree structure — the database's own indexed sort is the standard, production-grade approach; reinventing it with an in-memory tree map would be slower and redundant here.)
2. Optional refinement if time allows: trending could decay over time (score by views in the last 7 days rather than all-time) — mention as a "future improvement" in your README even if you ship the simpler all-time version.
3. **Frontend, same day:** a Trending page hitting that endpoint, plus a basic Admin Dashboard (visible only if `role === 'admin'` from context): list users, a ban/deactivate button, list flagged videos. Wire the dashboard's actions to real admin-only backend routes (reuse `isAdmin` middleware from Day 3).

**Be ready to explain:** How does the frontend know whether to show admin controls, and why doesn't that matter for real security? (the JWT's `role` claim, decoded and stored in context, controls what renders — but it's a UX nicety only; the _real_ enforcement is server-side `isAdmin` middleware, since a user could tamper with frontend state and reveal a button that just fails when clicked).

---

### Day 7 (1.5–2 hrs) — Polish Pass + Strike System

Use this day as a buffer (vertical slices rarely land exactly on schedule) and to wire up the strike system, which touches almost every model you've already built.

1. **Strike system (backend):** `POST /api/admin/videos/:id/strike` and `POST /api/admin/users/:id/strike` (admin only) — increments `strikeCount`/`strikes`. If `strikes >= 3`, set `isDeactivated: true` and block login for that user (check this flag in your login controller).
2. **Frontend:** add strike buttons to the Admin Dashboard, and show a clear "account deactivated" message on the login page if a deactivated user tries to log in.
3. Spend remaining time fixing anything from Days 1–6 that's broken or half-wired — better to have 6 solid features than 7 shaky ones heading into OAuth and WebSockets, which are the two hardest remaining pieces.

**Be ready to explain:** Why deactivate at the account level instead of just deleting content? (the strike system is about behavior, not individual pieces of content — accumulating strikes reflects a pattern, and deactivating preserves the record/audit trail rather than destroying data, which also matters if a ban is ever appealed).

---

### Day 8 (1.5–2 hrs) — Slice: OAuth (Google), Hand-Rolled

This is Hacker Mode's first big item. Scope: **Google OAuth only** (not a generic multi-provider system), implemented manually against Google's OAuth2 endpoints directly (no Passport.js, since "plug-and-play providers" are prohibited).

1. Register an app in Google Cloud Console → get a Client ID + Client Secret → set redirect URI to `http://localhost:5000/api/auth/google/callback`.
2. Backend flow (this is the part you must understand, not just copy):
   - Your backend exchanges the `code` Google redirects back with for an access token by POSTing to Google's token endpoint, using `code`, `client_id`, `client_secret`, `redirect_uri`.
   - Use that access token to call Google's userinfo endpoint, get the user's email/name.
   - Find or create a User with `authProvider: "google"`, then issue **your own** JWT exactly like normal login — from this point on your app doesn't care how they authenticated.
3. Frontend, same day: a "Sign in with Google" link pointing to Google's auth URL with your `client_id`, `redirect_uri`, `scope=profile email`, `response_type=code`. After the backend issues your JWT, redirect back into your app and populate `AuthContext` exactly like a normal login — reuse the same context/storage logic from Day 2, don't build a separate path.
4. This is just `fetch`/`axios` calls to two Google REST endpoints — no special OAuth library, satisfying "hand-implemented from scratch."

**Be ready to explain:** Why does OAuth need a "code exchange" step instead of Google just handing back user info directly? (the code is short-lived and exchanging it requires the client_secret, which only your backend has — never exposed to the browser — preventing a malicious actor who intercepts the redirect URL from impersonating your app). What's the difference between authentication and authorization in OAuth's name? (OAuth was originally designed for _authorization_ — granting limited access to data on another service — using it for login is a common repurposing, formalized as OpenID Connect on top of OAuth).

_(Skip DAuth — it's not a standard, recognized protocol the way OAuth is; flag in your README that you implemented OAuth and treated "DAuth" as out of scope pending clarification of what specific protocol was meant. Honest and defensible — don't invent a fake protocol to "complete" this line item.)_

---

### Day 9 (1.5–2 hrs) — Slice: Live Chat via Raw WebSockets

Scope it down: **one chat room per video page**, no live-premiere-scheduling complexity layered in (mention scheduled premieres as a stretch goal in your README rather than fully building the scheduling logic, given the time budget).

1. `npm install ws` (the `ws` library gives you the raw WebSocket protocol — this is not a "plug-and-play chat provider," it's the low-level primitive, equivalent to using `http` instead of a full framework).
2. In `server.js`, create a `WebSocketServer` attached to your existing HTTP server.
3. On connection, expect the client to send a `join` message with a `videoId`. Maintain an in-memory `Map<videoId, Set<websocketConnection>>` on the server.
4. When a client sends a chat message, broadcast it to every other connection in that video's Set.
5. Frontend, same day: on the video detail page, open a `new WebSocket('ws://localhost:5000')` connection, send a join message on open, listen for incoming messages, render them in a simple chat list, and send messages from an input box.
6. Clean up: on `close` event, remove the connection from the Map.

**Be ready to explain:** How is a WebSocket different from a normal HTTP request? (HTTP is request-response and the connection closes after each exchange; WebSocket starts as an HTTP request but then "upgrades" to a persistent, two-way connection that stays open, letting either side push messages anytime without the other side asking first). Why store connections in a server-side Map keyed by videoId instead of broadcasting to everyone? (so chat for video A doesn't leak into video B's chat — you only want to notify clients who joined that specific room).

---

### Day 10 (1.5–2 hrs) — Final Polish, README, Submission

1. Final pass: make sure every route that should be protected actually checks auth/ownership/admin — this is the single most commonly-missed thing in reviews.
2. Click through the whole app once as a normal user, once as admin, and once via Google OAuth — fix anything broken in the end-to-end flow.
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
