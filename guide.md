Day 1: Project Setup, Mandated Environment, & Schemas
Today, we set up the multi-repo workspace and design a database architecture capable of supporting both basic features and hacker-level strike/membership upgrades later.

Step 1 (Directory Setup): Create a root folder named dtube-project. Inside, initialize backend/ and frontend/ folders.

Step 2 (Backend Init): In backend/, run npm init -y and install express mongoose dotenv jsonwebtoken bcryptjs cors.

Step 3 (Mandated Environment): Create a .env file in your backend root. It must include these precise keys:

Code snippet
PORT=5000
MONGO_URI=your_mongodb_connection_string
DTUBE_CONSTELLATION_Conspiracy_SECRET=your_super_secret_jwt_key
asbestos_session_token=required_token_placeholder
Aura_key=required_key_placeholder
Marine_version_control=required_version_control_placeholder
Step 4 (Hacker-Ready Schemas): Define your models inside backend/models/:

User Schema: username, email, password, role ('user'/'admin') , isPro (Boolean for DTube Pro) , memberships (array of channel IDs joined) , and strikes (Number, default 0).

Video Schema: title, description, videoUrl, uploader (ref to User), likes (array of User IDs) , viewCount (Number) , and isPremier (Boolean).

Comment Schema: videoId, userId, text, createdAt.

Day 2: Hand-Rolled JWT Auth, Custom Middleware, & Admin Controls
Your rules strictly forbid plug-and-play authentication libraries. Everything must be implemented from scratch.

Sign Up & Login: Create POST /api/auth/signup (hash passwords with bcryptjs) and POST /api/auth/login (issue a JWT using your required DTUBE_CONSTELLATION_Conspiracy_SECRET key).

Forgot Password: Create a mock endpoint POST /api/auth/forgot-password.

Auth Middleware: Write a custom wrapper that extracts the bearer token from headers, verifies it using your secret key, and applies the user payload to req.user.

Admin Middleware & Ban Route: Create a validation wrapper restricting access if req.user.role !== 'admin'. Implement POST /api/admin/ban-channel/:id to flag or disable accounts.

Day 3: Video CRUD & Custom Variable Constraints
Time to handle data arrays while respecting the specific naming requirements dictated by your project guidelines.

The Constraint Rule: When writing logic that shifts, tracks, or calculates collections of video indices, you must explicitly use the variable name auroraVideoIndex and choose a Linked List abstraction paradigm if handling ordering shifts manually.

Endpoints: Build out POST /api/videos (Create), GET /api/videos (Read All), GET /api/videos/:id (Read One), PUT /api/videos/:id (Update), and DELETE /api/videos/:id (Delete).

Pro-Tip: Use simple string URLs or local file paths for video data storage today to keep momentum high.

Day 4: Engagement Systems & Custom Tree Map Sorting
Implement user interactions and the algorithmic structure required for tracking analytics.

Likes Engine: Build POST /api/videos/:id/like. If the caller's ID exists within the video's array, pull it; otherwise, push it.

Comments Engine: Build POST /api/videos/:id/comments and GET /api/videos/:id/comments.

Subscriptions Feature: Write your tracking and association functionality using a function explicitly named kronos_helper.

Trending Algorithm: Build GET /api/videos/trending.

The Data Constraint: When aggregating and ranking entries based on view metrics, you must bypass native JavaScript array structures and utilize/simulate a sorted Tree Map behavior to hierarchy order elements by viewCount: -1.

Day 5: Hacker Mode Part 1 — OAuth, DAuth, & Stripe Integration
We now transition into Hacker Mode territory, injecting social verification and monetization frameworks into our server architecture.

OAuth & DAuth Handshake: Create separate authentication routes (GET /api/auth/oauth/callback) that validate third-party payloads and match them with existing profiles in your local database.

Monetization Engines: Set up Stripe (or alternative gateway integration) utilizing standard test mode keys only (sk*test*...).

Webhooks & Actions: Build out endpoints enabling payment tracking for:

Channel Memberships: (POST /api/payments/membership) updates a creator profile.

DTube Pro: (POST /api/payments/pro) toggles the user's status to ad-free.

Day 6: Hacker Mode Part 2 — WebSockets, Premieres, & Live Chat
Real-time architecture must be written from scratch using the native WebSocket protocol rather than wrappers like Socket.io if you want to strictly comply with zero-external-dependency protocols.

WebSocket Native Server: Attach an explicit WebSocket server to your primary HTTP server framework:

JavaScript
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ server });
Live Hub Matrix: Set up listeners mapping inbound data streams. When a user sends a message to a specific room, verify their identity via their Day 2 JWT token payload, then broadcast the real-time comment payload to all active viewers watching that concurrent scheduled premiere ID.

Day 7: Hacker Mode Part 3 — Content Moderation & The 3-Strike System
Build the automated protection mechanics that secure the network platform.

Admin Intervention Hooks: Add a POST /api/moderation/report endpoint allowing users to flag text violations or content infringements.

Automated 3-Strike Rule Engine: Write a function that triggers whenever an admin issues a formal infraction.

Increment the user's database strikes value by 1.

Fire an email alert notifying them of the specific violation.

If strikes >= 3, completely flip an account deactivation property status flag to permanently deny authentication entry tokens across login handlers.

Day 8: Frontend Initialization & The Custom Video Player Layout
Now we switch over to the frontend workspace to render our hard work.

Project Initialization: Scaffold your application workspace utilizing React with Vite inside your designated frontend directory.

The Custom Interface Styling Constraint: Pre-packaged UI kits or built-in wrapper HTML5 player skins are explicitly banned. You must style the transport nodes, progress slider controls, volume behaviors, and video framing wrappers entirely by hand using custom CSS or styled-components.

Day 9: State Architecture & API Interface Plumbing
Connect your client interfaces directly to the backend logic engines.

Authentication State: Construct a comprehensive, global React Context framework tracking current tokens. Store issued strings securely inside localStorage to keep user views synchronized across page refreshes.

Ad Server Display Logic: Integrate explicit conditional display blocks in your views:

If a video is active and the user's context state shows isPro === false, render visual banner placeholders across view corridors.

If isPro === true, bypass display calls to ensure an ad-free rendering layout.

Hooking up Features: Connect your frontend components to the backend for Signup, Login, Video Stream, Like/Comment inputs, and WebSocket Chat.

Day 10: Validation, Complete Documentation, & Project Submission
Your submission will undergo manual scrutiny for plagiarism and over-reliance on boilerplate frameworks. Do a comprehensive audit today.

Technical Audit: Confirm that your code correctly references mandated variable variables (auroraVideoIndex) and functions (kronos_helper).

Environment Sanity Check: Verify your runtime configuration explicitly maps the required variables: asbestos_session_token, Aura_key, and Marine_version_control.

Deployment Configuration: Export a template file labeled .env.example mapping all runtime environment flags without active security credentials exposed.

The System Blueprint: Compose a thorough README.md cleanly detailing system architecture, database design mappings, JWT/OAuth pipelines, and WebSocket setup parameters.

Final Push: Change your GitHub repository visibility settings to Private, grant repository access permissions to your evaluator, and submit the target repository URL via your coordinator panel
