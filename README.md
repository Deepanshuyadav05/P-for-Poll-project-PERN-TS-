# P for Poll

A full stack poll app built with the PERN stack (PostgreSQL, Express, React, Node) in TypeScript, using Drizzle ORM and Socket.IO. Signed-in users create polls and share a link; anyone with the link can vote, and the results page updates live as votes come in.

## Features

- Signup, login and logout with a JWT stored in an `httpOnly` cookie
- Create a poll with a title, optional description, one question and 2 to 10 options
- Single-choice or multiple-choice questions
- Optional expiry date, after which the poll stops accepting votes
- Shareable poll links based on a unique slug
- Voting without an account: each browser gets a `voterId` cookie and can vote once per poll
- Live results over WebSockets, with no page refresh
- A dashboard listing your polls, with links to vote, view results or delete
- Request validation with Zod on both the client and the server

## Tech stack

| Layer    | Tools                                                                                   |
| -------- | --------------------------------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, React Hook Form, Zod, Axios |
| Backend  | Node.js, Express 5, TypeScript, Socket.IO, Zod, JWT, bcrypt                             |
| Database | PostgreSQL 17, Drizzle ORM, Drizzle Kit                                                 |
| Tooling  | Docker Compose (local Postgres), ESLint                                                 |

## Project structure

```
.
├── backend
│   ├── drizzle/              # generated SQL migrations
│   ├── docker-compose.yml    # local PostgreSQL
│   ├── drizzle.config.js
│   └── src
│       ├── db/               # Drizzle client and schema
│       ├── middlewares/      # body validation, global error handler
│       ├── modules
│       │   ├── auth/         # routes, controllers, services, validation
│       │   └── polls/
│       ├── utils/            # ApiError, ApiResponse, JWT helpers
│       ├── app.ts            # Express app
│       ├── socket.ts         # Socket.IO setup
│       └── server.ts         # entry point
└── frontend
    └── src
        ├── api/              # Axios client and Socket.IO client
        ├── pages/            # Login, Signup, Home, CreatePoll, PollVote, PollResult
        ├── routes/           # router, protected and guest route guards
        └── utils/            # Zod schemas, toast helpers
```

## Getting started

### Prerequisites

- Node.js and npm
- Docker (or your own PostgreSQL instance)

### 1. Install dependencies

```bash
npm install                 # root: Drizzle Kit
cd backend && npm install
cd ../frontend && npm install
```

### 2. Start the database

```bash
cd backend
docker compose up -d
```

This starts PostgreSQL 17 on port `5432` with user `postgres`, password `postgres` and database `poll_app_DB`.

### 3. Configure environment variables

Create `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/poll_app_DB
CLIENT_URL=http://localhost:5173
NODE_ENV=development

JWT_ACCESS_SECRET=replace-with-a-long-random-string
JWT_ACCESS_EXPIRES_IN=7d
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Run the migrations

```bash
cd backend
npx drizzle-kit migrate
```

`DATABASE_URL` must be available to this command.

### 5. Run the app

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

The API runs on `http://localhost:5000` and the frontend on `http://localhost:5173`.

## Scripts

| Location   | Command           | What it does                                  |
| ---------- | ----------------- | --------------------------------------------- |
| `backend`  | `npm run dev`     | Compile in watch mode and restart the server  |
| `backend`  | `npm run build`   | Compile TypeScript to `dist/`                 |
| `backend`  | `npm start`       | Run the compiled server                       |
| `frontend` | `npm run dev`     | Start the Vite dev server                     |
| `frontend` | `npm run build`   | Type-check and build for production           |
| `frontend` | `npm run preview` | Serve the production build locally            |
| `frontend` | `npm run lint`    | Run ESLint                                    |

## API

All routes are prefixed with `/api`.

### Auth

| Method | Route          | Auth | Description                |
| ------ | -------------- | ---- | -------------------------- |
| POST   | `/auth/signup` | No   | Create an account          |
| POST   | `/auth/login`  | No   | Log in and set the cookie  |
| GET    | `/auth/get-me` | Yes  | Get the current user       |
| POST   | `/auth/logout` | Yes  | Clear the cookie           |

### Polls

| Method | Route                     | Auth | Description                        |
| ------ | ------------------------- | ---- | ---------------------------------- |
| POST   | `/polls/createPoll`       | Yes  | Create a poll                      |
| GET    | `/polls/getMyPolls`       | Yes  | List the current user's polls      |
| DELETE | `/polls/deletePoll/:slug` | Yes  | Delete a poll you own              |
| GET    | `/polls/:slug`            | No   | Get a poll, its question and options |
| POST   | `/polls/:slug/vote`       | No   | Submit a vote                      |
| GET    | `/polls/:slug/results`    | No   | Get the current results            |

Example body for `POST /polls/createPoll`:

```json
{
  "title": "Team lunch",
  "description": "Pick the place for Friday",
  "question": {
    "questionText": "Where should we go?",
    "allowMultiple": false,
    "options": ["Pizza", "Sushi", "Tacos"]
  },
  "isPublic": true,
  "expiresAt": "2026-12-31T18:00:00.000Z"
}
```

Example body for `POST /polls/:slug/vote`:

```json
{
  "optionIds": ["<option-uuid>"]
}
```

## Real-time events

The results page opens a Socket.IO connection and joins a room for the poll it is showing.

| Event          | Direction        | Payload | Description                               |
| -------------- | ---------------- | ------- | ----------------------------------------- |
| `poll:join`    | client to server | `slug`  | Join the room for a poll                  |
| `poll:leave`   | client to server | `slug`  | Leave the room                            |
| `poll:results` | server to client | results | Sent to the room after every new vote     |

## Database schema

| Table       | Purpose                                                              |
| ----------- | -------------------------------------------------------------------- |
| `users`     | Accounts, with a bcrypt password hash                                |
| `polls`     | Title, description, slug, visibility, expiry, owner                  |
| `questions` | The question for a poll and whether it allows multiple choices       |
| `options`   | Answer options with a display order                                  |
| `responses` | One row per voter per poll, unique on `(poll_id, voter_id)`          |
| `votes`     | The options chosen in a response, unique on `(option_id, response_id)` |

Deleting a user or a poll cascades to everything that belongs to it.

## Frontend routes

| Path                     | Access      | Page          |
| ------------------------ | ----------- | ------------- |
| `/login`                 | Guests only | Login         |
| `/signup`                | Guests only | Signup        |
| `/home`                  | Signed in   | Your polls    |
| `/poll/createPoll`       | Signed in   | Create a poll |
| `/poll/:slug/pollVote`   | Anyone      | Vote          |
| `/poll/:slug/pollResult` | Anyone      | Live results  |

## Deployment notes

- Set `CLIENT_URL` on the backend to the deployed frontend origin; it is used for both CORS and Socket.IO.
- Set `NODE_ENV=production` on the backend when the frontend and backend are on different domains, so the cookies are sent cross-site.
- Set `VITE_API_URL` (including the `/api` suffix) and `VITE_SOCKET_URL` on the frontend to the deployed backend.
