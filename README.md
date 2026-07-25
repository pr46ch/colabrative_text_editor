# SyncPad

SyncPad is a real-time collaborative text editor. Authenticated users can create
meetings, invite collaborators, edit the same document concurrently, and see
who is online.

The core goal is **convergence**: regardless of edit timing or which backend
instance a user reaches, every participant should eventually see the same text
in the same operation order.

## Highlights

- Next.js frontend with a responsive meeting dashboard and editor
- Express REST API and WebSocket (`ws`) server for real-time collaboration
- JWT authentication with persisted browser sessions
- Prisma data access layer backed by PostgreSQL
- Redis-backed operation log, pub/sub notifications, and presence tracking
- Operational Transform (OT) for concurrent insert and delete operations
- Dockerized backend and a GitHub Actions image-publishing workflow

## Architecture

Each meeting can have users connected to different backend instances. Redis is
the shared coordination layer: it holds the current operation log, distributes
operation and presence events with pub/sub, and stores connected-user presence.
PostgreSQL stores the durable document snapshot and meeting metadata.

```text
Meeting 1

  User 1, User 2 -- WebSocket --> [Server 1] --\
                                                   >-- [Redis]
  User 3, User 4 -- WebSocket --> [Server 2] --/      - operations list
                                                        - operation/presence pub-sub
                                                        - meeting presence hash
                                                             |
                                                             v
                                            [PostgreSQL document snapshot]
                                            (text, version, meeting metadata)

  Late joiner ------------> Server 1 or Server 2
                               loads PostgreSQL snapshot and replays Redis operations
```

### Edit flow

1. A client sends an operation (`insert` or `delete`) with its document
   `baseVersion` and a client ID.
2. The server validates the operation and transforms it against operations the
   client has not seen.
3. The transformed operation is appended atomically to the meeting's Redis list
   and announced on that meeting's Redis pub/sub channel.
4. Every subscribed backend instance replays the new operations into its local
   document session and broadcasts them to its connected users.
5. When the last participant leaves, the current document text and version are
   persisted to PostgreSQL, then the Redis operation list is cleared.

### Late joiners

When someone joins after editing has begun, their server loads the latest
durable text and version from PostgreSQL, then replays any operations still in
the Redis list. Only after that synchronization does it send the `document`
message to the new client. The new participant therefore begins from the same
document version as everyone else.

## Operational Transform

Concurrent edits are normally expressed relative to a document version that
may already be outdated. For example, two users can both insert at character
position `5`, or one can delete text while another inserts into that range.

Operational Transform changes an incoming operation's position and delete
length to account for each operation that has already been accepted. This gives
the system two important properties:

- **Convergence:** applying the accepted operations leads every user to the
  same final document state.
- **Intent preservation:** an operation stays as close as possible to the
  location the author meant, even when nearby text changes concurrently.

For simultaneous inserts at exactly the same position, SyncPad uses the client
ID as a deterministic tie-breaker. That means every server makes the same
ordering decision rather than arbitrarily placing the inserted text.

The implementation handles all four pairings: insert/insert, insert/delete,
delete/insert, and overlapping delete/delete. See
[`backend/helper.js`](backend/helper.js).

## Horizontal scalability

Two users in the same meeting may be connected to different backend servers:

1. Server 1 accepts User 1's operation and publishes it to Redis.
2. Server 2 receives the Redis event, applies that operation to its local
   meeting session, and broadcasts it to User 3.
3. The same happens in reverse for operations first received by Server 2.

This avoids requiring sticky sessions for a meeting. Any server can restore a
meeting session from PostgreSQL plus Redis and then receive subsequent updates
through Redis pub/sub.

For production scale-out, run multiple backend containers with the same
`DATABASE_URL`, `REDIS_URL`, and `JWT_SECRET`; ensure each instance can keep
WebSocket connections open and subscribe to meeting channels. Load-test this
path with concurrent writes, reconnects, and multiple instances before relying
on it for high-volume workloads.

## Technology

| Area | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript |
| HTTP API | Express |
| Real time | WebSocket via `ws` |
| Authentication | JWT and bcrypt |
| Database abstraction | Prisma |
| Durable database | PostgreSQL |
| Shared coordination | Redis lists, hashes, and pub/sub |
| Containers | Docker and Docker Compose |

## Local development

### Prerequisites

- Node.js 22
- Docker Desktop (recommended for PostgreSQL and Redis)

### 1. Start PostgreSQL and Redis

```bash
cd backend
copy .env.example .env
npm install
npm run db:up
```

Update `backend/.env` with a strong `JWT_SECRET` before using the application
outside local development.

### 2. Prepare the database and start the backend

```bash
cd backend
npm run db:push
npm run dev
```

The API and WebSocket server listen on `http://localhost:8000` by default.
Use `GET /health` for a process health check and `GET /ready` to check both
PostgreSQL and Redis connectivity.

### 3. Start the frontend

```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

Set the following values in `frontend/.env.local` for a local backend:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000
```

Open `http://localhost:3000`.

> On macOS or Linux, replace `copy` with `cp` in the setup commands.


## Deployment

The backend is packaged as a Docker image. The repository already contains a
GitHub Actions workflow that builds and pushes that image whenever `master` is
updated:

```text
GitHub push
    → GitHub Actions
    → Docker Hub image
    → Railway service / container deployment
    → PostgreSQL + Redis services
```

### GitHub Actions → Docker Hub

The workflow at
[`/.github/workflows/publish-backend-image.yml`](.github/workflows/publish-backend-image.yml)
builds `backend/Dockerfile` and publishes the `latest` tag. Configure these
repository secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `DOCKERHUB_REPOSITORY`

### Railway (or another container host)

1. Create a backend service from the published Docker Hub image.
2. Provision PostgreSQL and Redis services.
3. Set `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `CORS_ORIGIN`, and `PORT` on
   the backend service.
4. Run Prisma migrations as part of the release process (`npm run db:deploy`).
5. Deploy the Next.js frontend separately and set
   `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_WS_BASE_URL` to the backend's
   public HTTPS/WSS address.
6. Add the frontend's public URL to `CORS_ORIGIN`.

For production, use a long randomly generated `JWT_SECRET`, HTTPS/WSS URLs,
managed PostgreSQL/Redis backups, and container health checks.

## Repository layout

```text
frontend/                 Next.js application
backend/
  routes/                 Authentication and meeting HTTP routes
  realtime/               WebSocket, presence, operation queue, session store
  redis_stuff/            Redis operation, presence, and pub/sub adapter
  prisma/                 Prisma schema and migrations
  helper.js               Operational Transform implementation
  docker-compose.yml      Local PostgreSQL, Redis, and backend services
.github/workflows/        Docker image publishing workflow
```

## Security notes

JWTs are currently persisted in browser local storage so the user session can
survive a page refresh. Protect the frontend from cross-site scripting (XSS),
because an injected script can access local storage. For a higher-security
production setup, consider an `HttpOnly`, `Secure`, `SameSite` cookie-based
session design.
