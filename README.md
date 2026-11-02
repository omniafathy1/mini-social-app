# Mini Social App

A full-stack social media app built to learn modern web development end to end: authentication (email/password and Google), a graph database, file uploads, real-time updates, and a clean project structure on both the frontend and the backend.

> **Status:** in active development.

<!-- Add screenshots to docs/screenshots/ and reference them here, e.g. ![Feed](docs/screenshots/feed.png) -->

## Features

- **Authentication:** email + password (hashed with bcrypt), Google sign-in (the Google ID token is verified on the server), JWT access tokens with rotating refresh tokens, request validation with zod
- **Posts:** create, edit and delete your own posts, optional image upload (Cloudinary), emoji picker, "Load more" pagination
- **Comments:** comment on posts and reply to comments, like comments
- **Likes:** like / unlike posts with optimistic updates and live counters
- **Profiles:** view any user's profile and posts, change your avatar
- **Follow system:** follow / unfollow users, followers and following lists
- **Search:** find users and posts (debounced input)
- **Real-time:** new posts and like counts appear instantly for everyone connected (Socket.IO)
- **Live notifications:** get notified when someone likes your post, comments on it, or follows you (private Socket.IO rooms, unread badge, mark as read)
- **Security basics:** ownership checks on edit/delete, password hashes never returned by the API, uniform login error message, refresh tokens stored only as hashes

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React, TanStack Query (server state), Zustand (client state), Tailwind CSS, Axios, Socket.IO client |
| Backend | Node.js, Express, Neo4j (graph database), JWT, bcryptjs, google-auth-library, zod, multer, Cloudinary, Socket.IO |
| Testing | Jest, Supertest |

## Architecture

### Backend

```
Request -> Route -> Middlewares (auth, validation, upload) -> Controller -> Neo4j
```

```
backend/
├── server.js                 # entry point (HTTP server + Socket.IO)
└── src/
    ├── app.js                # Express setup
    ├── config/               # database and Cloudinary clients
    ├── routes/               # URL -> controller mapping only
    ├── controllers/          # business logic and Cypher queries
    ├── middlewares/          # auth, optional auth, validation, file upload
    ├── validators/           # zod schemas
    ├── utils/                # tokens, Google auth, notifications, date and user helpers
    ├── socket/               # Socket.IO manager
    └── __tests__/            # Jest + Supertest tests
```

### Frontend

Feature-based structure. Each feature owns its API calls, hooks and components:

```
frontend/client/src/
├── features/
│   ├── auth/  posts/  comments/  users/  search/  notification/
│   │   ├── api/              # Axios calls only
│   │   ├── hooks/            # TanStack Query hooks
│   │   └── components/       # UI
├── shared/components/        # shared UI (Navbar)
├── store/                    # Zustand: navigation
├── socket/                   # Socket.IO client instance
├── hooks/                    # shared hooks (useDebounce)
└── api/                      # Axios client with auth interceptor
```

### Design decisions

- **Neo4j instead of SQL:** the domain is relationships. `(User)-[:CREATED]->(Post)`, `(User)-[:LIKED]->(Post)`, `(User)-[:FOLLOWS]->(User)` and `(Comment)-[:REPLY_TO]->(Comment)` are first-class in the data model, so queries like "who follows whom" need no junction tables or JOINs.
- **Authentication vs authorization:** a `requireAuth` middleware verifies the access token, and controllers check ownership (you can only edit or delete your own posts, comments and account). The user id always comes from the token, never from the request body.
- **Sessions with refresh tokens:** a short-lived access token is sent as a Bearer token, and a refresh token is set in an httpOnly cookie. The database stores only a hash of the refresh token. Every refresh issues a new refresh token and invalidates the previous one (rotation), and presenting an old token revokes the session.
- **Server state vs client state:** TanStack Query owns data that comes from the API; Zustand only holds app-level client state (who is logged in, which page is open).
- **Targeted real-time events:** feed updates are broadcast to everyone, while notifications go only to the recipient through a Socket.IO room named after their user id.

## Getting started

### Prerequisites

- Node.js 18+
- A Neo4j database (for example a free Neo4j AuraDB instance)
- A free Cloudinary account (for image uploads)
- A Google Cloud OAuth client ID (only needed for Google sign-in, see [Google sign-in](#google-sign-in))

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env     # on Windows: copy .env.example .env
# fill in your real values in .env
npm run dev
```

Main environment variables (`backend/.env`). The complete list is in `backend/.env.example`.

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
| `GOOGLE_CLIENT_ID` | Google OAuth client ID. Without it, Google sign-in responds with 503 |

### 2. Frontend

```bash
cd frontend/client
npm install
cp .env.example .env     # on Windows: copy .env.example .env
npm run dev
```

### 3. Tests

```bash
cd backend
npm test
```

### Configuration notes

- Frontend settings live in `frontend/client/.env` (see `.env.example`).
- The backend's allowed origin must match your frontend URL. It matters for CORS, cookies and Socket.IO.

## API overview

All routes are prefixed with `/api`. Routes marked with a lock require `Authorization: Bearer <access token>`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/google` (also `POST /auth/oauth`), `POST /auth/refresh`, `POST /auth/logout`, 🔒 `GET /auth/me` |
| Users | `GET /users/:id`, `GET /users/:id/posts`, `GET /users/:id/followers`, `GET /users/:id/following`, 🔒 `POST /users/:id/follow`, 🔒 `PUT /users/:id/avatar`, 🔒 `PUT /users/:id`, 🔒 `DELETE /users/:id` |
| Posts | `GET /posts?page=&limit=`, `GET /posts/:id`, 🔒 `POST /posts`, 🔒 `PUT /posts/:id`, 🔒 `DELETE /posts/:id`, 🔒 `POST /posts/:id/like` |
| Comments | `GET /posts/:id/comments`, 🔒 `POST /posts/:id/comments`, 🔒 `POST /comments/:id/replies`, 🔒 `PUT /comments/:id`, 🔒 `DELETE /comments/:id`, 🔒 `POST /comments/:id/like` |
| Search | `GET /search?q=` |
| Notifications | 🔒 `GET /notifications`, 🔒 `GET /notifications/unread-count`, 🔒 `PUT /notifications/read-all`, 🔒 `PUT /notifications/:id/read` |

## Google sign-in

The login page uses Google Identity Services. The browser gets a Google ID token, and the backend verifies it with Google (`google-auth-library`) before it creates or signs in the user.

**Setup:** Google Cloud Console, then APIs & Services, Credentials, Create OAuth client ID, Application type "Web application". Put the client ID in `GOOGLE_CLIENT_ID` (backend) and in the frontend `.env`.

| Setting | Value |
|---|---|
| Authorized JavaScript origins | `http://localhost:5173` and `http://localhost` for development, plus the deployed frontend URL for production, e.g. `https://your-app.vercel.app` |

Notes:

- Origins must match exactly: scheme + domain (+ port), with no path and no trailing slash. Several can be registered at once, so local and production can coexist.
- If the browser console shows "The given origin is not allowed for the given client ID", the page's origin is missing from that list.
- While the OAuth consent screen is in "Testing" mode, only the test users you add can sign in. Publish the app to let anyone in.

## Roadmap

- One refresh-token session per device (today there is one per user)
- Rate limiting
- Cursor-based pagination and full-text search
- Single-post page (so notifications can link straight to a post)
- Public deployment (Vercel + Render)