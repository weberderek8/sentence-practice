# sentence-practice

A personal web app for practicing sentences. Save an English sentence, add its
translation, and attach one audio recording in the target language — either by
**uploading an mp3** or **recording in the browser**. Audio is stored as-is in
**MongoDB GridFS**.

Built as a small **TypeScript MERN microservices** monorepo, orchestrated with
**Docker Compose**.

## Architecture

```
                         ┌──────────────────────────────────────────┐
  Browser  ── /  ───────▶│  web (nginx in prod / Vite in dev)        │
           ── /api ─────▶│   static React app  +  /api reverse-proxy │
                         └───────────────┬──────────────────────────┘
                                         │ /api/*
                                         ▼
                              ┌────────────────────┐
                              │  gateway (Express)  │
                              │  http-proxy rules   │
                              └─────┬─────────┬─────┘
                     /api/sentences │         │ /api/audio
                                    ▼         ▼
                        ┌───────────────┐  ┌────────────────────┐
                        │  sentences    │  │  audio             │
                        │  Express +    │  │  Express + multer  │
                        │  Mongoose     │  │  + GridFSBucket    │
                        └───────┬───────┘  └─────────┬──────────┘
                                │                    │
                                ▼                    ▼
                        ┌────────────────────────────────────┐
                        │  mongo (sentences_db, audio_db)     │
                        │  data persisted in a named volume   │
                        └────────────────────────────────────┘
```

The browser only ever talks to **one origin** (the `web` container). In dev the
Vite dev server proxies `/api`; in prod nginx serves the built assets and
reverse-proxies `/api` to the gateway. Only the `web` port is exposed in prod.

### Data model

One English sentence → one translation → one audio file.

The `sentences` service stores the sentence + translation and a plain `audioId`
string referencing a GridFS file owned by the `audio` service. Services do not
share collections.

Audio linking flow:
`POST /api/audio` → `{ fileId }` → `PATCH /api/sentences/:id { audioId }`.
Playback streams from `GET /api/audio/:fileId` (HTTP range supported for
scrubbing).

## Repository layout

```
sentence-practice/
├── docker-compose.yml          # base: all services + mongo
├── docker-compose.dev.yml      # dev: hot reload, exposed debug ports
├── docker-compose.prod.yml     # prod: restart policy, single exposed port
├── package.json                # npm workspaces + scripts
├── tsconfig.base.json          # shared TS config
├── .env.example                # copy to .env and fill in
├── packages/shared/            # shared TS types (Sentence, etc.)
├── services/
│   ├── gateway/                # API gateway (Express + http-proxy-middleware)
│   ├── sentences/              # sentences + translation (Mongoose)
│   └── audio/                  # audio upload/stream (GridFS)
└── web/                        # React + Vite frontend (+ nginx.conf)
```

## Ports

| Service   | Internal | Dev host (debug)     | Prod host        |
|-----------|----------|----------------------|------------------|
| web       | 80 / 5173| `VITE_DEV_PORT` 5173 | `WEB_PORT` 8000  |
| gateway   | 8080     | `GATEWAY_DEBUG_PORT` | not exposed      |
| sentences | 4001     | `SENTENCES_DEBUG_PORT`| not exposed     |
| audio     | 4002     | `AUDIO_DEBUG_PORT`   | not exposed      |
| mongo     | 27017    | `MONGO_DEBUG_PORT`   | not exposed      |

## API

Through the gateway (and therefore the browser at same-origin `/api`):

| Method | Path                    | Description                          |
|--------|-------------------------|--------------------------------------|
| GET    | `/api/sentences`        | List sentences (newest first)        |
| POST   | `/api/sentences`        | Create `{ english, translation? }` |
| GET    | `/api/sentences/:id`    | Get one                              |
| PATCH  | `/api/sentences/:id`    | Update translation / link `audioId`  |
| DELETE | `/api/sentences/:id`    | Delete                               |
| POST   | `/api/audio`            | Upload audio (multipart `audio`) → `{ fileId }` |
| GET    | `/api/audio/:id`        | Stream audio (range supported)       |
| DELETE | `/api/audio/:id`        | Delete audio                         |

Each service also exposes `/health`.

## Local development (this machine)

Requires Docker Desktop. Node/npm are **not** required on the host — everything
runs in containers.

```sh
cp .env.example .env          # adjust if you like; defaults work for dev
npm run dev                   # docker compose dev up --build
```

Then open <http://localhost:5173>. The dev stack bind-mounts the source and runs
each service with hot reload (`tsx watch` for services, Vite for the frontend).
Individual service ports are exposed for debugging (see the table above).

Stop with:

```sh
npm run dev:down
```

> Without Docker you can also run pieces directly: `npm install` at the root,
> then `npm run dev -w @sentence-practice/<service>` (point the `*_MONGO_URI` /
> `*_URL` env vars at a local MongoDB and the other services).

## Home-server deployment (production)

On the server (requires Docker + Docker Compose):

```sh
git pull
cp .env.example .env          # then EDIT: set strong Mongo creds + WEB_PORT
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
# or: npm run prod
```

The app is then reachable on the home LAN at `http://<server-ip>:${WEB_PORT}`
(default 8000). Only the `web` port is published; the gateway, services, and
MongoDB stay on the internal Docker network.

Logs / teardown:

```sh
npm run prod:logs
npm run prod:down
```

### Persistence & uptime

- MongoDB data lives in the named `mongo_data` volume and survives restarts.
- `restart: unless-stopped` brings every container back after a reboot or a
  Docker restart.

### Secrets

`.env` is gitignored and must never be committed. Only `.env.example`
(placeholder values) is in version control. Set real Mongo credentials in the
server's `.env`, and keep `SENTENCES_MONGO_URI` / `AUDIO_MONGO_URI` in sync with
`MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD`.

## Tech stack

TypeScript everywhere · React + Vite · Express · Mongoose · MongoDB GridFS ·
`http-proxy-middleware` · `multer` · nginx · Docker Compose · npm workspaces.
