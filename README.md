# SnapTalk

A full‑stack social media app with real‑time messaging.

## Tech Stack

- Backend: Node.js, Express, MongoDB (Mongoose), JWT, Socket.io, Cloudinary, Multer
- Frontend: React (CRA), React Router, React Query, Axios, Socket.io Client, React Hook Form, React Hot Toast

## Structure

- `backend/` Express API + Socket.io server
- `frontend/` React app (Create React App)

## Prerequisites

- Node.js 18+
- MongoDB (Atlas or local URI)
- Cloudinary account (for media uploads)

## Environment Variables

Create `.env` files (do NOT commit them).

Backend: `backend/.env`

```
PORT=5001            # or 5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx
```

Frontend: `frontend/.env`

```
REACT_APP_SERVER_URL=http://localhost:5001
```

Tip: If you choose backend port 5000, update both the frontend proxy (see below) and `REACT_APP_SERVER_URL` accordingly.

## Install Dependencies

From the project root:

```
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Running the App (Development)

In two terminals:

- Terminal 1 (backend):

```
cd backend
npm run dev
```

- Terminal 2 (frontend):

```
cd frontend
npm start
```

Frontend dev server runs on http://localhost:3000

## Ports and Proxy

- Backend default in code: `process.env.PORT || 5000` (`backend/server.js`)
- Frontend proxy: `frontend/package.json` currently points to `http://localhost:5001`
- Socket client default: `REACT_APP_SERVER_URL || 'http://localhost:5001'` (`frontend/src/contexts/SocketContext.js`)

Choose ONE plan to avoid CORS/proxy issues:

- Option A: Backend on 5000
  - Set `PORT=5000` in `backend/.env`
  - Update `frontend/package.json` "proxy" to `http://localhost:5000`
  - Set `REACT_APP_SERVER_URL=http://localhost:5000` in `frontend/.env`

- Option B: Backend on 5001 (as the repo currently leans towards)
  - Set `PORT=5001` in `backend/.env`
  - Keep `frontend/package.json` "proxy" at `http://localhost:5001`
  - Ensure `REACT_APP_SERVER_URL=http://localhost:5001`

After changing frontend env, restart `npm start` for changes to take effect.

### Env examples in repo

This repo includes templates you can commit safely:

- `backend/env.example`
- `frontend/env.example`

Copy them when setting up locally:

```bash
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env
```

Ensure `.gitignore` excludes real secrets:

```
backend/.env
frontend/.env
```

## Available Scripts

Backend (`backend/package.json`):
- `npm run dev` — start with nodemon
- `npm start` — start with node

Frontend (`frontend/package.json`):
- `npm start` — CRA dev server
- `npm run build` — production build
- `npm test` — tests

## API Overview (prefix: `/api`)

- Auth (`/auth`):
  - POST `/register` — create account
  - POST `/login` — get JWT + user
  - GET `/me` — current user (auth)
  - POST `/logout` — logout (auth)

- Users (`/users`):
  - GET `/profile/:id` — profile details (auth)
  - PUT `/profile` — update profile (auth)
  - POST `/upload-avatar` — upload avatar (auth, multipart)
  - GET `/search?q=...` — search users (auth)
  - GET `/suggestions` — friend suggestions (auth)

- Friends (`/friends`):
  - POST `/request/:id` — send request (auth)
  - POST `/accept/:id` — accept (auth)
  - POST `/decline/:id` — decline (auth)
  - DELETE `/:id` — remove friend (auth)
  - GET `/` — list friends (auth)
  - GET `/requests` — pending requests (auth)

- Posts (`/posts`):
  - POST `/` — create post (auth, multipart `media[]`)
  - GET `/feed` — friends + own posts (auth)
  - GET `/user/:userId` — posts by user (auth)
  - POST `/:id/like` — like/unlike (auth)
  - POST `/:id/comment` — add comment (auth)
  - DELETE `/:id` — delete post (auth)

- Messages (`/messages`):
  - POST `/` — send message (auth)
  - GET `/conversations` — list conversations (auth)
  - GET `/:userId` — conversation with user (auth, paginated)
  - PUT `/:messageId/read` — mark as read (auth)
  - DELETE `/:messageId` — delete (auth)
  - GET `/unread/count` — unread count (auth)

## Real‑time (Socket.io)

- Server: namespace root, events handled in `backend/server.js`
- Client connects to `REACT_APP_SERVER_URL`
- Join: client emits `join` with `user.id`
- Send message: client emits `sendMessage` with `{ receiverId, content, messageType?, fileUrl? }`
- Server emits:
  - `receiveMessage` — to receiver when they are online
  - `messageSent` — back to sender as confirmation

Note: Frontend helper `sendMessage()` should send `{ receiverId, content }` to match server contract.

## Media Uploads

- Uses Cloudinary via `backend/utils/cloudinary.js`
- Avatars: `POST /api/users/upload-avatar` (max 5MB, image only)
- Posts: `POST /api/posts` with `media` files (images/videos; each up to 100MB)

## Troubleshooting

- Server exits immediately: ensure `JWT_SECRET` and `MONGODB_URI` are set in `backend/.env`
- CORS / proxy errors or socket not connecting: confirm both ports and `REACT_APP_SERVER_URL`
- Media upload fails: verify Cloudinary credentials; check file type and size limits

## License

This project is for educational/demo purposes. Add a license if you intend to distribute.
