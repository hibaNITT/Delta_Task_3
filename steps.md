DAY 1 -
We built the Brain (The Backend): You set up an Express server that sits on your computer listening for commands.

We connected the Memory (The Database): Your server successfully hooked up to MongoDB, meaning our app now has a permanent place to save user accounts, videos, and comments.

We built the Face (The Frontend): You used Vite to spin up a React application, which creates the visual website interface that users actually interact with.

(The Connection): We got the Frontend to shoot a message through space to the Backend, ask "Are you healthy?", and the backend answered "Yes, ok!".

day 2 -
When a user visits a website, HTTP requests are stateless. This means the server treats every single request (like loading a video, liking a comment, or updating a profile) as if it's coming from a complete stranger. It doesn't remember who you are from one second to the next.

To solve this, we use JSON Web Tokens (JWT). Here is exactly what just happened behind the scenes:

The Secret Handshake (Login): You sent your credentials via Postman. The backend verified them against the database and said, "Yep, this is definitely testuser."

Issuing the Passport (The Token): The server then generated that long, scrambled token string. Think of this token as a digital passport. Inside that scrambled string, your server encoded your userId, your role (user), and an expiration date. It signed it using your unique DTUBE_CONSTELLATION_Conspiracy_SECRET so nobody can forge it.

The Payoff: Because we verified this with Postman first, we now know with 100% certainty that your database connection, security logic, and token generation work flawlessly.
The Frontend Courier (api.js): Automatically fetches and stamps your hand-rolled JWT onto every single outgoing request.

The Identity Gatekeeper (auth.js): Unpacks that token on the backend, checks its validity against your mandatory secret (DTUBE_CONSTELLATION_Conspiracy_SECRET), and safely binds the user profile to req.user.

The Permission Lock (isAdmin.js): Leverages that verified profile to isolate elite actions from standard accounts using proper HTTP status segregation (401 vs. 403).

The Backend Core
User Database Model (models/User.js): Built our Mongoose blueprint containing username, email, passwordHash, role, isPro, memberships, and community guideline strikes.

Hand-Rolled Registration: Configured the /api/auth/signup route to prevent duplicate accounts and securely hash passwords with bcryptjs.

Token Issuance: Built the /api/auth/login route to verify hashed credentials and hand back a custom signed JWT token keyed with your mandatory environment variable name: DTUBE_CONSTELLATION_Conspiracy_SECRET.

2. The Frontend Backbone
   Raw Auth UI Components: Created minimal, unstyled Signup and Login HTML form pages in React that capture inputs and dispatch them to your backend using axios.

State Preservation (AuthContext): Configured a global React Context provider (AuthContext) to store the active user's info and token.

Session Persistence: Wrote local storage rehydration logic so that when a user logs in, their token safely stores in localStorage, keeping them logged in even if they refresh the page.

Day3 - 1. Developed the Security Gatekeepers (auth & isAdmin)We created a dedicated middleware/ architecture to inspect incoming requests.authMiddleware.js: Inspects the Authorization header, extracts the token string, and verifies it using your mandatory secret key (DTUBE_CONSTELLATION_Conspiracy_SECRET). If valid, it attaches the payload data directly to req.user.isAdmin.js: Sits right behind the auth gate to verify if req.user.role === 'admin', dividing your application into public users and administrative moderators.🔄 2. Engineered Account Recovery (Forgot/Reset Password)We updated your User.js database schema to support automated security lifecycles with resetPasswordToken and resetPasswordExpires.Built an advanced backend workflow that uses Node's native crypto module to issue secure, single-use, 1-hour expiration hex tokens for users who lose their credentials, completely bypassing the need for unsafe plaintext password storage.🚪 3. Designed Frontend Session TerminationWe built a reactive, global React layout component (Navbar.js) connected to your centralized AuthContext.Since JWTs are stateless, you implemented a clean frontend logout mechanic that updates your global application state and immediately purges all traces of the active passport from the browser's localStorage.🎛️ 4. Connected MongoDB Compass & Ran live Integration TestsYou configured your local backend environment parameters (MONGO_URI=mongodb://localhost:27017/dtube).You booted up your database, seeded a superadmin profile, and used MongoDB Compass to directly elevate their clearance level.Finally, you tested a protected route (DELETE /api/videos/moderate/:id) inside Thunder Client, successfully demonstrating a $403$ lockout for normal accounts and a perfect green $200\text{ OK}$ clearance for your administrator token!
