# SportAnalytics — CLAUDE.md

## Architecture

Hybrid: legacy monolith (`backend/`) + 3 microservices (`services/`) + Angular frontend (`frontend/`).
All microservices share the same JWT secret and communicate via **Kafka**.

```
SportAnalytics/
├── backend/              # Legacy monolith (Express, MongoDB, no Kafka) — port 3000
├── frontend/             # Angular 19 — port 4200
├── services/
│   ├── auth-service/     # JWT auth — port 3002
│   ├── user-service/     # User CRUD — port 3001
│   └── video-service/    # Video upload (Multer) — port 3003
└── docker-compose.yml    # Spins up all services + MongoDB instances + Kafka + Zookeeper
```

### Service → Infrastructure Mapping

| Service          | Port | MongoDB container | MongoDB port |
|------------------|------|-------------------|--------------|
| user-service     | 3001 | mongo-users       | 27018        |
| auth-service     | 3002 | mongo-auth        | 27019        |
| video-service    | 3003 | mongo-videos      | 27020        |
| backend (legacy) | 3000 | (local mongod)    | 27017        |
| Kafka            | —    | —                 | 9092         |

### Microservice Internal Structure (all services follow this pattern)

```
src/
├── server.js       # Entry point, Express app, MongoDB connect
├── routes/         # Express routers
├── models/         # Mongoose schemas
├── middleware/     # Auth, error handling
├── messaging/      # Kafka producer/consumer (kafkajs)
└── utils/          # Winston logger
```

## Commands

### Start all services (primary dev workflow)
```bash
docker compose up --build
```

### Run tests
```bash
cd services/auth-service  && npm test   # jest --forceExit --detectOpenHandles
cd services/user-service  && npm test
cd services/video-service && npm test
cd backend                && npm test   # jest --runInBand
cd frontend               && npm test
```

### Dev mode (single service, no Docker)
```bash
cd services/<service> && npm run dev    # nodemon src/server.js
cd backend            && npm run dev    # nodemon src/index.js
```

### Lint
```bash
cd backend  && npm run lint
cd frontend && npm run lint
```

## CI/CD Pipeline (GitHub Actions)

**Feature branches** → `.github/workflows/ci-feature.yml`
**Main branch** → `.github/workflows/ci-cd-main.yml`

Main pipeline order:
1. **versioning** — auto-increments patch tag (e.g. `v1.0.4`)
2. **lint** — backend + frontend
3. **test** — backend, frontend, user-service, auth-service, video-service
4. **build-frontend** — uploads artifact `frontend-<version>`
5. **docker-backend** — builds & pushes to GHCR (`ghcr.io/<user>/sport-analytics-backend`)

Secrets required: `GHCR_TOKEN`, `GHCR_USERNAME`

## Key Gotchas

- **backend/ is legacy** — it has no Kafka integration and uses a local MongoDB on 27017. The microservices in `services/` are the active development target.
- **Each microservice has its own MongoDB** — do not share connection strings between services.
- **JWT_SECRET is hardcoded** in `docker-compose.yml` for local dev — in production this must come from a secret manager.
- **Tests use `--forceExit --detectOpenHandles`** — needed because Kafka/MongoDB connections don't close cleanly in test env.
- **Kafka requires Zookeeper** — both are started via docker-compose; don't run services standalone without Kafka if messaging is needed.
- **video-service uses Multer** for file uploads — the `uploads/` directory lives in `backend/uploads/` (legacy); video-service may use its own storage path.
- **Frontend dir is `frontend/`** — README references `sport-analytics/` which is outdated.

## Environment Variables (per microservice)

| Variable          | Example                          |
|-------------------|----------------------------------|
| `PORT`            | 3001 / 3002 / 3003               |
| `MONGODB_URI`     | `mongodb://mongo-users:27017/users` |
| `JWT_SECRET`      | (set in docker-compose)          |
| `KAFKA_BROKER`    | `kafka:9092`                     |
| `ALLOWED_ORIGINS` | `http://localhost:4200`          |
| `LOG_LEVEL`       | `info`                           |

## Testing Notes

- All services use **Jest + Supertest**
- `jest.testTimeout = 10000` (10s) — accounts for async Kafka/Mongo startup
- `user-service` also supports `npm run test:ci` (outputs JUnit XML via jest-junit)
