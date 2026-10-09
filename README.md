# Mini Social App

A full-stack social media app built to learn modern web development end to end: authentication, a graph database, file uploads, real-time updates, and a clean project structure on both the frontend and the backend.

> **Status:** in active development. Google sign-in is being finalized (see [Google sign-in](#google-sign-in-work-in-progress)).

<!-- Add screenshots to docs/screenshots/ and reference them here, e.g. ![Feed](docs/screenshots/feed.png) -->

## Features

- **Authentication:** register and login with email + password (hashed with bcrypt), JWT access tokens, input validation with zod
- **Posts:** create, edit and delete your own posts, optional image upload (Cloudinary), emoji picker, "Load more" pagination
- **Comments:** comment on posts and reply to comments, like comments
- **Likes:** like / unlike posts with live counters
- **Profiles:** view any user's profile and posts, change your avatar
- **Follow system:** follow / unfollow users, followers and following lists
- **Search:** find users and posts (debounced input)
- **Real-time:** new posts and like counts appear instantly for everyone connected (Socket.IO)
- **Live notifications:** get notified when someone likes your post, comments on it, or follows you (private Socket.IO rooms, unread badge, mark as read)
- **Security basics:** ownership checks on edit/delete, password hashes never returned by the API, uniform login error message

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React, TanStack Query (server state), Zustand (client state), Tailwind CSS, Axios, Socket.IO client |
| Backend | Node.js, Express, Neo4j (graph database), JWT, bcryptjs, zod, multer, Cloudinary, Socket.IO |
| Testing | Jest |

## Architecture

### Backend

```
Request -> Route -> Middlewares (auth, validation, upload) -> Controller -> Neo4j
```

```
backend/
├── server.js                 # entry point (HTTP server + Socket.IO)
├── src/
│   ├── app.js                # Express setup
│   ├── config/               # database and Cloudinary clients
│   ├── routes/               # URL -> controller mapping only
│   ├── controllers/          # business logic and Cypher queries
│   ├── middlewares/          # auth, optional auth, validation, file upload
│   ├── validation/           # zod schemas
│   ├── utils/                # token, notifications, date and user helpers
│   └── socket/               # Socket.IO manager
└── tests/                    # Jest unit tests
```

### Frontend

Feature-based structure. Each feature owns its API calls, hooks and components:

```
frontend/src/
├── features/
│   ├── auth/  posts/  comments/  users/  search/  notifications/
│   │   ├── api/              # Axios calls only
│   │   ├── hooks/            # TanStack Query hooks
│   │   └── components/       # UI
├── store/                    # Zustand: navigation
├── socket/                   # Socket.IO client instance
├── hooks/                    # shared hooks (useDebounce)
└── api/                      # Axios client with auth interceptor
```

### Design decisions

- **Neo4j instead of SQL:** the domain is relationships. `(User)-[:CREATED]->(Post)`, `(User)-[:LIKED]->(Post)`, `(User)-[:FOLLOWS]->(User)` and `(Comment)-[:REPLY_TO]->(Comment)` are first-class in the data model, so queries like "who follows whom" need no junction tables or JOINs.
- **Authentication vs authorization:** a `requireAuth` middleware verifies the JWT, and controllers check ownership (you can only edit or delete your own posts, comments and account). The user id always comes from the token, never from the request body.
- **Server state vs client state:** TanStack Query owns data that comes from the API; Zustand only holds app-level client state (who is logged in, which page is open).
- **Targeted real-time events:** feed updates are broadcast to everyone, while notifications go only to the recipient through a Socket.IO room named after their user id.

## Getting started

### Prerequisites

- Node.js 18+
- A Neo4j database (for example a free Neo4j AuraDB instance)
- A free Cloudinary account (for image uploads)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env     # on Windows: copy .env.example .env
# fill in your real values in .env
npm run dev
```

Environment variables (`backend/.env`):

| Variable | Description |
|---|---|
| `PORT` | Server port (default `3000`) |
| `COGNODB_URI` | Neo4j connection URI |
| `COGNODB_USERNAME` | Neo4j username |
| `COGNODB_PASSWORD` | Neo4j password |
| `JWT_SECRET` | Long random string used to sign tokens |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Tests

```bash
cd backend
npm test
```

### Configuration notes

- The frontend expects the API at `http://localhost:3000/api` (set in `src/api/axiosClient.js`) and the Socket.IO server at `http://localhost:3000` (set in `src/socket/socket.js`).
- The backend allows Socket.IO connections from `http://localhost:5173` (set in `backend/src/socket/socketManager.js`). Change it if your frontend runs on another port.

## API overview

All routes are prefixed with `/api`. Routes marked with a lock require `Authorization: Bearer <token>`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/oauth` |
| Users | `GET /users/:id`, `GET /users/:id/posts`, `GET /users/:id/followers`, `GET /users/:id/following`, 🔒 `POST /users/:id/follow`, 🔒 `PUT /users/:id/avatar`, 🔒 `PUT /users/:id`, 🔒 `DELETE /users/:id` |
| Posts | `GET /posts?page=&limit=`, `GET /posts/:id`, 🔒 `POST /posts`, 🔒 `PUT /posts/:id`, 🔒 `DELETE /posts/:id`, 🔒 `POST /posts/:id/like` |
| Comments | `GET /posts/:id/comments`, 🔒 `POST /posts/:id/comments`, 🔒 `POST /comments/:id/replies`, 🔒 `PUT /comments/:id`, 🔒 `DELETE /comments/:id`, 🔒 `POST /comments/:id/like` |
| Search | `GET /search?q=` |
| Notifications | 🔒 `GET /notifications`, 🔒 `GET /notifications/unread-count`, 🔒 `PUT /notifications/read-all`, 🔒 `PUT /notifications/:id/read` |

## Google sign-in (work in progress)

Google sign-in is not part of the working feature set yet. It needs a Google Cloud OAuth client whose allowed URLs match the places the app runs from.

**Setup:** Google Cloud Console, then APIs & Services, Credentials, Create OAuth client ID, Application type "Web application".

| Setting | Value |
|---|---|
| Authorized JavaScript origins | `http://localhost:5173` for development, plus the deployed frontend URL for production, e.g. `https://your-app.vercel.app` |
| Authorized redirect URIs | Only needed for a server-side redirect flow: the backend callback URL, e.g. `https://your-api.onrender.com/api/auth/google/callback` |

Notes:

- Origins must match exactly: scheme + domain (+ port), with no path and no trailing slash. Several can be registered at once, so local and production can coexist.
- While the OAuth consent screen is in "Testing" mode, only the test users you add can sign in. Publish the app to let anyone in.
- The backend must verify the Google ID token with Google instead of trusting an email sent by the client. This is the planned implementation.

## Known issues

- **Google sign-in** (`/auth/oauth`) is being finalized: it needs the OAuth client configured with the app URLs (see [Google sign-in](#google-sign-in-work-in-progress)).

## Roadmap

- Short-lived access tokens + refresh tokens stored in httpOnly cookies
- Real Google OAuth (verify the Google ID token on the server)
- Rate limiting
- Cursor-based pagination and full-text search
- Single-post page (so notifications can link straight to a post)