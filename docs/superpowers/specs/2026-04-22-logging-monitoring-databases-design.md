# Design: Logging, Monitoring & Databases
**Datum:** 2026-04-22
**Branch:** SA-09-micro-services
**Anforderungen:** Punkte 6 (Logging/Monitoring) + 7 (Datenbanken)

---

## Entscheidungsübersicht

| Frage | Entscheidung | Begründung |
|-------|-------------|------------|
| Zentraler Log-Dienst | **Grafana + Loki + Prometheus** | Lokal, kein Cloud-Account, alles in Docker Compose |
| Log-Transport | **Promtail** (liest Log-Files) | Standard-Stack, trennt Infra von App-Code |
| 3 KPIs | **Request Rate, Error Rate, Response Time p95** | HTTP-basiert, einfach messbar mit prom-client |
| DB-Nachweis Services | **user-service + video-service** | Beide haben PUT/POST/DELETE bereits implementiert |
| Grafana Port | **3030** (Host) → 3000 (Container) | Vermeidet Konflikt mit legacy backend/:3000 |

---

## Architektur

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ auth-service│  │user-service │  │video-service│      │
│  │  :3002      │  │  :3001      │  │  :3003      │      │
│  │  JSON logs  │  │  JSON logs  │  │  JSON logs  │      │
│  │  /metrics   │  │  /metrics   │  │  /metrics   │      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
│         │    log volumes (Docker)          │             │
│         └──────────────┬──────────────────┘             │
│                        ▼                                 │
│                  ┌──────────┐                            │
│                  │ Promtail │                            │
│                  └────┬─────┘                            │
│                       │                                  │
│          ┌────────────┴─────────────┐                   │
│          ▼                          ▼                   │
│     ┌─────────┐              ┌────────────┐             │
│     │  Loki   │ :3100        │ Prometheus │ :9090       │
│     └────┬────┘              └─────┬──────┘             │
│          │                         │ scrape /metrics    │
│          └────────────┬────────────┘                    │
│                       ▼                                  │
│                 ┌──────────┐                             │
│                 │ Grafana  │ :3030                       │
│                 │Dashboard │                             │
│                 │ Alerting │                             │
│                 └──────────┘                             │
└─────────────────────────────────────────────────────────┘
```

---

## Port-Übersicht

| Service | Host-Port | Container-Port | Datenbank |
|---------|-----------|----------------|-----------|
| user-service | 3001 | 3001 | mongo-users:27018 |
| auth-service | 3002 | 3002 | mongo-auth:27019 |
| video-service | 3003 | 3003 | mongo-videos:27020 |
| Grafana | **3030** | 3000 | — |
| Prometheus | 9090 | 9090 | — |
| Loki | 3100 | 3100 | — |
| Promtail | — | — | — |
| backend (legacy, lokal) | 3000 | — | localhost:27017 |

---

## Punkt 6: Logging & Monitoring

### 6.1 Strukturierte Logs (JSON-Format)

**Betroffene Datei:** `src/utils/logger.js` in allen 3 Services

Vorher (plain text):
```
[2024-01-01 12:00:00] INFO: User 123 fetched profile
```

Nachher (JSON für Loki):
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "service": "user-service",
  "traceId": "abc123-def456",
  "message": "User 123 fetched profile"
}
```

Log-Dateien werden weiterhin in Docker Volumes geschrieben (Promtail liest diese).

### 6.2 Tracing via Correlation-ID

**Neue Datei:** `src/middleware/tracing.js` in allen 3 Services

- Generiert UUID pro Request (`crypto.randomUUID()`)
- Setzt `req.traceId` + Response-Header `X-Trace-Id`
- Logger-Instanz erhält `traceId` als Kontext
- Ermöglicht in Grafana/Loki: `{service="user-service"} | json | traceId="abc123"` → alle Logs eines Requests

### 6.3 Prometheus Metriken (`/metrics`)

**Neues Package:** `prom-client` (npm)
**Neue Dateien:**
- `src/utils/metrics.js` — Prometheus Registry + Counter/Histogram Definitionen
- `src/middleware/metricsMiddleware.js` — misst jeden Request (Status, Dauer, Service)

**Endpunkt:** `GET /metrics` (kein JWT, nur intern via Prometheus erreichbar)

### 6.4 Die 3 KPIs + Alerting

| # | KPI | Metrik | Grafana Alert |
|---|-----|--------|---------------|
| 1 | Request Rate | `rate(http_requests_total{service="..."}[5m])` | — (Trend) |
| 2 | Error Rate % | `rate(http_errors_total[5m]) / rate(http_requests_total[5m]) * 100` | **>10% → ALERT** |
| 3 | Response Time p95 | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` | **>0.5s → ALERT** |

Alerting-Kanal: Grafana In-App Alert (kein externer Webhook nötig für Demo).

### 6.5 Monitoring-Stack (neue Docker-Services)

```
monitoring/
├── prometheus.yml           # scrape_configs für alle 3 Services
├── loki-config.yml          # filesystem storage, retention 7d
├── promtail-config.yml      # liest log volumes, setzt Labels: service, job, level
└── grafana/
    ├── datasources/
    │   ├── loki.yml         # auto-provisioned Datasource
    │   └── prometheus.yml   # auto-provisioned Datasource
    └── dashboards/
        ├── dashboard.yml    # Provider-Config
        └── sport-analytics.json  # 3 KPI-Panels + Alert-Rules
```

---

## Punkt 7: Datenbanken

### Separate Datenbanken — bereits implementiert ✓

| Service | MongoDB Container | Collection |
|---------|------------------|------------|
| user-service | mongo-users (:27018) | `users` |
| auth-service | mongo-auth (:27019) | `users` (auth-eigene) |
| video-service | mongo-videos (:27020) | `videos.files`, `videos.chunks` (GridFS) |

### DB-Änderungen nach PUT/POST/DELETE

**Service 1: user-service**
| Methode | Endpunkt | DB-Änderung |
|---------|----------|-------------|
| POST | `/api/users/register` (via auth-service Kafka) | Insert in `users` |
| PUT | `/api/users/:id` | Update `username`/`email` |
| PUT | `/api/users/:id/role` | Update `role` |
| PUT | `/api/users/:id/status` | Update `isActive` |
| DELETE | `/api/users/:id` | Delete aus `users` |

**Service 2: video-service**
| Methode | Endpunkt | DB-Änderung |
|---------|----------|-------------|
| POST | `/api/videos` | Insert in `videos.files` + `videos.chunks` (GridFS) |
| DELETE | `/api/videos/:id` | Delete aus `videos.files` + `videos.chunks` |

---

## Implementierungs-Scope

### Zu ändernde Dateien (pro Service, 3x)
1. `src/utils/logger.js` — JSON-Format + service-Label
2. `src/middleware/tracing.js` — **neu**, Correlation-ID
3. `src/utils/metrics.js` — **neu**, Prometheus Registry
4. `src/middleware/metricsMiddleware.js` — **neu**, Request-Messung
5. `src/server.js` — Middleware einbinden, `/metrics` Route
6. `package.json` — `prom-client` hinzufügen

### Neue Infrastruktur-Dateien
7. `docker-compose.yml` — Loki, Promtail, Prometheus, Grafana ergänzen
8. `monitoring/prometheus.yml`
9. `monitoring/loki-config.yml`
10. `monitoring/promtail-config.yml`
11. `monitoring/grafana/datasources/loki.yml`
12. `monitoring/grafana/datasources/prometheus.yml`
13. `monitoring/grafana/dashboards/dashboard.yml`
14. `monitoring/grafana/dashboards/sport-analytics.json`

### Nicht geändert
- Routen-Logik (PUT/POST/DELETE bereits korrekt)
- Datenbank-Konfiguration (bereits getrennt)
- Auth/JWT-Logik
- Kafka-Messaging
- Tests (bestehende Tests bleiben gültig)

---

## Erfüllte Kriterien nach Implementierung

| Kriterium | Status |
|-----------|--------|
| Standard-Logs in Textfile | ✓ (Log-Files in Volumes) |
| Logs inkl. Tracing | ✓ (traceId in jedem Log-Eintrag) |
| Logs für Grafana interpretierbar | ✓ (JSON-Format, Loki-Labels) |
| Zentraler Dienst konfiguriert | ✓ (Grafana + Loki + Prometheus in docker-compose) |
| 3 KPIs mit Alarmierung | ✓ (Error Rate + Response Time p95 mit Alert-Rules) |
| Service1 DB-Änderung PUT/POST/DELETE | ✓ (user-service) |
| Service2 DB-Änderung PUT/POST/DELETE | ✓ (video-service) |
