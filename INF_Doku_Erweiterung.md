# INF_Doku_Erweiterung - Implementierte Kompetenzen

Diese Dokumentation beschreibt die bereits im Projekt implementierten Aspekte zu den verschiedenen Kompetenzen.

## 1.3 Realisierungskonzept - Architektur beschreiben und zeichnen

### Status: ✅ Teilweise implementiert

**Architektur-Übersicht:**

Die SportAnalytics-Anwendung folgt einer **3-Tier-Architektur**:

1. **Frontend (Angular)**
   - Technologie: Angular 19.2.0
   - Standort: `/frontend`
   - Port: 4200 (Development)
   - Build-Output: `dist/sport-analytics`

2. **Backend (Node.js/Express)**
   - Technologie: Node.js 20, Express 4.18.2
   - Standort: `/backend`
   - Port: 3000
   - Containerisierung: Docker (Dockerfile vorhanden)

3. **Datenbank (MongoDB)**
   - Technologie: MongoDB Community Edition
   - Standard-URI: `mongodb://localhost:27017/sport-analytics`
   - Models: User, Video

**Komponenten-Verbindungen:**
- Frontend kommuniziert mit Backend über HTTP/REST API
- Backend verbindet sich mit MongoDB über Mongoose
- Authentifizierung via JWT-Token (Header: `x-auth-token`)
- CORS konfiguriert für Cross-Origin Requests

**Architektur-Diagramm (Textbeschreibung):**
```
[Browser] 
    ↓ HTTP/REST
[Angular Frontend (Port 4200)]
    ↓ API Calls (x-auth-token)
[Express Backend (Port 3000)]
    ↓ Mongoose
[MongoDB (Port 27017)]
```

**Quellen:**
- `README.md` - Projektstruktur
- `backend/server.js` - Server-Konfiguration
- `frontend/src/app/app.config.ts` - Angular-Konfiguration
- `backend/Dockerfile` - Container-Konfiguration

---

## 1.3 Realisierungskonzept - Build Anleitung (lokal und CI)

### Status: ✅ Vollständig implementiert

### Lokale Build-Anleitung

**Preconditions:**
- Node.js v16 oder höher
- MongoDB Community Edition
- Angular CLI v19
- npm installiert

**Backend Build:**
```bash
cd backend
npm install
npm run dev  # Development mit nodemon
# oder
npm start    # Production
```

**Frontend Build:**
```bash
cd frontend
npm install
npm start    # Development Server (Port 4200)
# oder
npm run build  # Production Build
```

**Outputs:**
- Backend: Server läuft auf `http://localhost:3000`
- Frontend: Development Server auf `http://localhost:4200`
- Frontend Production Build: `frontend/dist/sport-analytics/`

### CI/CD Build (GitHub Actions)

**Workflow-Datei:** `.github/workflows/ci-cd-main.yml`

**Build-Prozess:**
1. **Versioning:** Automatische Versionsverwaltung (Semantic Versioning)
2. **Lint:** ESLint für Backend und Frontend
3. **Tests:** Jest (Backend) und Karma/Jasmine (Frontend)
4. **Build Frontend:** Angular Production Build → Artifact Upload
5. **Docker Build Backend:** Container-Image → GitHub Container Registry (GHCR)

**CI-Befehle:**
```yaml
# Backend
npm ci
npm run lint
npm test

# Frontend
npm ci
npm run lint
npm test
npm run build

# Docker
docker build -t ghcr.io/USERNAME/sport-analytics-backend:VERSION
docker push ...
```

**Outputs:**
- Frontend Artifact: `frontend-$VERSION` (dist-Ordner)
- Docker Image: `ghcr.io/USERNAME/sport-analytics-backend:VERSION` und `:latest`

**Quellen:**
- `README.md` - Installationsanleitung
- `.github/workflows/ci-cd-main.yml` - CI/CD Pipeline
- `backend/package.json` - Backend Scripts
- `frontend/package.json` - Frontend Scripts

---

## 1.3 Realisierungskonzept - Skizzen oder Prototypen des Interface

### Status: ✅ Implementiert (5 Hauptkomponenten)

**Hauptkomponenten (Screens):**

1. **Landing Page** (`/landing`)
   - Hero-Section mit Call-to-Action
   - Features-Grid
   - Community-Section
   - Datei: `frontend/src/app/components/landing/`

2. **Login** (`/login`)
   - Login-Formular
   - Fehlerbehandlung
   - Link zur Registrierung
   - Datei: `frontend/src/app/components/login/`

3. **Registrierung** (`/register`)
   - Registrierungsformular
   - Datei: `frontend/src/app/components/register/`

4. **Video-Analyse** (`/video-analysis`)
   - Video-Upload (Modal)
   - Video-Grid mit eigenen Videos
   - Video-Verwaltung (Löschen)
   - Sichtbarkeits-Toggle (Public/Private)
   - Datei: `frontend/src/app/components/video-analysis/`

5. **Community** (`/community`)
   - Öffentliche Videos aller Benutzer
   - Video-Grid-Layout
   - Datei: `frontend/src/app/components/community/`

6. **Admin** (`/admin`)
   - User-Verwaltung (Tabs)
   - Video-Verwaltung
   - Passwort-Reset-Funktion
   - Suchfunktion
   - Datei: `frontend/src/app/components/admin/`

**Hauptflows:**
- **Anonym → Registrierung → Login → Video-Upload**
- **Anonym → Community (öffentliche Videos)**
- **Admin → Admin-Panel → User/Video-Verwaltung**

**Routing:** `frontend/src/app/app.routes.ts`

**Quellen:**
- `frontend/src/app/app.routes.ts` - Routing-Konfiguration
- `frontend/src/app/components/` - Alle Komponenten

---

## 1.3 Realisierungskonzept - Gestaltung von Layout

### Status: ✅ Implementiert

**Layout-Regeln:**

**Container-Breite:**
- Max-Width: `1200px` (zentriert)
- Margin: `0 auto`
- Padding: `2rem` (Standard)

**Grid-System:**
- **Features/Steps:** `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`
- **Video-Grid:** `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`
- Gap: `1.5rem` bis `2rem`

**Abstände:**
- Section-Padding: `2rem` bis `4rem`
- Card-Padding: `1rem` bis `2rem`
- Gap zwischen Elementen: `1rem` bis `2rem`

**Breakpoints:**
- Responsive Grid: `auto-fit` / `auto-fill` passt automatisch an
- Media Query für Admin-Tabelle: `@media (max-width: 1024px)` - horizontales Scrollen

**Beispiel-Layout (Landing Component):**
```scss
.landing-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}
```

**Quellen:**
- `frontend/src/app/components/landing/landing.component.scss`
- `frontend/src/app/components/video-analysis/video-analysis.component.scss`
- `frontend/src/app/components/community/community.component.scss`
- `frontend/src/app/components/header/header.component.scss`

---

## 1.3 Realisierungskonzept - Farben und Typografie

### Status: ✅ Implementiert (Mini Styleguide)

### Farben

**Primärfarben:**
- Primary Blue: `#007bff` (Buttons, Links, Logo)
- Primary Blue Hover: `#0056b3`
- Primary Blue Light: `#f0f7ff` (Community-Section Background)

**Sekundärfarben:**
- Success Green: `#28a745` (Success Messages, Community Button)
- Success Green Hover: `#218838`
- Danger Red: `#dc3545` (Delete Buttons, Error Messages)
- Danger Red Hover: `#c82333`
- Warning Yellow: `#ffc107` (Status Buttons)
- Info Blue: `#17a2b8` (Role Buttons)

**Neutrale Farben:**
- Background: `#f8f9fa` (Body Background)
- White: `#ffffff` (Cards, Modals)
- Text Dark: `#333` (Headings)
- Text Medium: `#666` (Body Text)
- Text Light: `#555` (Labels)
- Border: `#ddd` (Inputs, Borders)
- Shadow: `rgba(0, 0, 0, 0.1)` (Box Shadows)

**Button States:**
- Primary: `#007bff` → Hover: `#0056b3`
- Secondary: Transparent mit Border
- Danger: `#dc3545` → Hover: `#c82333`
- Disabled: `#ccc` / `#cccccc`

### Typografie

**Font-Family:**
- Primary: `'Source Sans Pro'` (via @fontsource/source-sans-pro)
- Fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`
- Font-Size Base: `16px`
- Line-Height: `1.5`

**Headings:**
- H1: `3rem` (Hero), `1.5rem` (Standard)
- H2: `1.4rem` (Modal), `1.1rem` (Cards)
- H3: `1.1rem` (Feature Cards)

**Buttons:**
- Font-Size: `1rem` bis `1.1rem`
- Padding: `0.75rem 1.5rem` (Standard)
- Border-Radius: `4px`
- Font-Weight: Normal (Standard), `500` (Admin Badge)

**Quellen:**
- `frontend/src/styles.scss` - Globale Styles
- `frontend/package.json` - Font-Dependency (@fontsource/source-sans-pro)
- Alle Component-SCSS-Dateien für spezifische Styles

---

## 1.3 Realisierungskonzept - Projektorganisation und Ressourcen

### Status: ⚠️ Teilweise dokumentiert

**Projektstruktur:**
```
SportAnalytics/
├── backend/          # Node.js/Express Backend
│   ├── models/       # Mongoose Models (User, Video)
│   ├── routes/       # API Routes (auth, users, videos)
│   ├── middleware/   # Auth & Admin Middleware
│   ├── tests/        # Jest Tests
│   └── uploads/      # Video-Uploads
├── frontend/         # Angular Frontend
│   └── src/app/
│       ├── components/  # Angular Components
│       ├── services/    # Angular Services
│       ├── interfaces/  # TypeScript Interfaces
│       └── tests/       # Karma/Jasmine Tests
└── .github/workflows/  # CI/CD Pipelines
```

**Tools:**
- **Version Control:** Git
- **Package Manager:** npm
- **Backend Framework:** Express.js
- **Frontend Framework:** Angular 19
- **Database:** MongoDB mit Mongoose
- **Testing:** Jest (Backend), Karma/Jasmine (Frontend)
- **Linting:** ESLint
- **Containerization:** Docker
- **CI/CD:** GitHub Actions

**Autoren (aus Code-Kommentaren):**
- Janis Häubi (Backend Server, Routes, Models, Admin)
- Manuel Affolter (User Model, Auth Middleware)

**Kommunikationsregeln:**
- Code-Kommentare mit JSDoc-Format
- Versionsnummern in Kommentaren (z.B. `@version 1.0.0`)
- Datum und Kalenderwoche in Kommentaren

**Definition of Done:**
- Nicht explizit dokumentiert, aber implizit durch CI/CD:
  - Linting erfolgreich
  - Tests erfolgreich
  - Build erfolgreich

**Quellen:**
- Projektstruktur aus `list_dir`
- Code-Kommentare in `backend/server.js`, `backend/models/User.js`, etc.
- `.github/workflows/ci-cd-main.yml` - CI/CD Prozess

---

## 1.3 Realisierungskonzept - Zeitplan mit Meilensteinen

### Status: ❌ Nicht dokumentiert

**Hinweis:** Keine explizite Zeitplanung oder Meilensteine in der Codebasis gefunden.

**Empfehlung:** Zeitplan sollte separat dokumentiert werden.

---

## 1.3 Realisierungskonzept - Potenzielle Risiken identifizieren

### Status: ⚠️ Teilweise erkennbar (aus Code)

**Identifizierte Risiken (aus Implementierung):**

1. **MongoDB-Verbindungsfehler**
   - **Wahrscheinlichkeit:** Mittel
   - **Impact:** Hoch
   - **Massnahme:** Graceful Degradation implementiert (Server läuft weiter, DB-Features deaktiviert)
   - **Code:** `backend/server.js` Zeilen 50-60

2. **Video-Upload-Grösse**
   - **Wahrscheinlichkeit:** Mittel
   - **Impact:** Mittel
   - **Massnahme:** 100MB Limit in Multer-Konfiguration
   - **Code:** `backend/routes/videos.js` Zeile 54

3. **Authentifizierung**
   - **Wahrscheinlichkeit:** Niedrig
   - **Impact:** Hoch
   - **Massnahme:** JWT-Token mit Secret, Auth-Middleware
   - **Code:** `backend/middleware/auth.js`

4. **CORS-Konfiguration**
   - **Wahrscheinlichkeit:** Niedrig
   - **Impact:** Mittel
   - **Massnahme:** CORS auf `*` (alle Origins) - Sicherheitsrisiko für Production
   - **Code:** `backend/server.js` Zeilen 26-30

**Quellen:**
- `backend/server.js` - Error Handling
- `backend/routes/videos.js` - Upload-Limits
- `backend/middleware/auth.js` - Auth-Sicherheit

---

## 1.3 Realisierungskonzept - Wartungsplan nach Go Live

### Status: ❌ Nicht dokumentiert

**Hinweis:** Keine explizite Wartungsplanung in der Codebasis gefunden.

**Empfehlung:** Wartungsplan sollte separat dokumentiert werden.

**Basis für Wartungsplan:**
- Docker-Containerisierung vorhanden (einfaches Deployment)
- CI/CD Pipeline vorhanden (automatisierte Updates möglich)
- Test-Suite vorhanden (Qualitätssicherung)

---

## 1.3 Realisierungskonzept - Supportstruktur für Betrieb

### Status: ❌ Nicht dokumentiert

**Hinweis:** Keine explizite Supportstruktur in der Codebasis gefunden.

**Empfehlung:** Supportstruktur sollte separat dokumentiert werden.

---

## 1.3 Realisierungskonzept - Release Planung

### Status: ✅ Teilweise implementiert

**Release-Rhythmus:**
- Automatische Versionierung bei Push auf `main` Branch
- Semantic Versioning (Major.Minor.Patch)

**Versionierung:**
- Implementiert in CI/CD Pipeline (`.github/workflows/ci-cd-main.yml`)
- Automatische Tag-Erstellung: `v1.0.0`, `v1.0.1`, etc.
- Git-Tags werden automatisch erstellt und gepusht

**Versionierungs-Logik:**
```bash
# Erste Version: 1.0.0
# Weitere Versionen: Patch wird automatisch erhöht
# Beispiel: v1.0.0 → v1.0.1 → v1.0.2
```

**Release-Kriterien (implizit):**
- Linting erfolgreich
- Tests erfolgreich
- Build erfolgreich
- Docker-Image erfolgreich gebaut und gepusht

**Rollback-Plan:**
- Nicht explizit dokumentiert
- Docker-Images mit Version-Tags vorhanden (Rollback durch Image-Version möglich)

**Quellen:**
- `.github/workflows/ci-cd-main.yml` - Versioning Job (Zeilen 21-45)

---

## 3.3 Artefaktverwaltung definieren

### Status: ✅ Implementiert

**Artefakt-Typen:**

1. **Frontend Build Artifacts**
   - **Build-Befehl:** `npm run build`
   - **Output:** `frontend/dist/sport-analytics/`
   - **Versionierung:** Via CI/CD (Version-Tag)
   - **Speicherung:** GitHub Actions Artifacts (`frontend-$VERSION`)
   - **Konsum:** Deployment aus Artifact

2. **Backend Docker Images**
   - **Build-Befehl:** `docker build`
   - **Output:** Docker Image
   - **Versionierung:** Semantic Versioning + `latest` Tag
   - **Speicherung:** GitHub Container Registry (GHCR)
   - **Konsum:** `docker pull ghcr.io/USERNAME/sport-analytics-backend:VERSION`

3. **Test-Results**
   - **Backend:** Jest JUnit Reports → `test-results/jest/`
   - **Frontend:** Karma JUnit Reports → `test-results/frontend/results.xml`

**Artefakt-Checkliste:**

✅ **Build:**
- Frontend: `npm run build` (Production)
- Backend: `docker build` (Container)

✅ **Versionierung:**
- Automatisch via Git Tags (CI/CD)
- Format: `vMAJOR.MINOR.PATCH`

✅ **Speicherung:**
- Frontend: GitHub Actions Artifacts
- Backend: GHCR (GitHub Container Registry)

✅ **Konsum:**
- Frontend: Download Artifact für Deployment
- Backend: `docker pull` für Container-Deployment

**Quellen:**
- `.github/workflows/ci-cd-main.yml` - Artifact Upload (Zeilen 122-125)
- `.github/workflows/ci-cd-main.yml` - Docker Build & Push (Zeilen 143-154)
- `backend/jest.config.js` - Test-Results Konfiguration
- `frontend/karma.conf.js` - Test-Results Konfiguration

---

## 5.1 Deployment Praktik - Deployment Prozess dokumentieren

### Status: ✅ Teilweise implementiert

**Deployment-Prozess (aus CI/CD):**

**Schrittfolge:**

1. **Versioning**
   - Automatische Versionsbestimmung
   - Git Tag erstellen und pushen

2. **Linting**
   - Backend: `npm run lint`
   - Frontend: `npm run lint`

3. **Testing**
   - Backend: `npm test` (Jest)
   - Frontend: `npm test` (Karma/Jasmine)

4. **Build**
   - Frontend: `npm run build` → Artifact Upload
   - Backend: `docker build` → Image Push zu GHCR

5. **Deployment (implizit)**
   - Docker Image verfügbar in GHCR
   - Frontend Artifact verfügbar zum Download

**Checks:**
- ✅ Linting erfolgreich
- ✅ Tests erfolgreich
- ✅ Build erfolgreich

**Freigaben:**
- Automatisch bei Push auf `main` Branch
- Keine manuelle Freigabe dokumentiert

**Rollback:**
- Nicht explizit dokumentiert
- Möglich durch Docker Image Version-Tags

**Quellen:**
- `.github/workflows/ci-cd-main.yml` - Vollständiger CI/CD Prozess

---

## 5.4 Paketieren, Auslieferungsprozess

### Status: ✅ Implementiert

**Paketierung:**

**Backend:**
- **Format:** Docker Container
- **Base Image:** `node:20-alpine`
- **Dockerfile:** `backend/Dockerfile`
- **Registry:** GitHub Container Registry (GHCR)
- **Tags:** Version + `latest`

**Frontend:**
- **Format:** Statische Dateien (Angular Build)
- **Output:** `dist/sport-analytics/`
- **Artifact:** GitHub Actions Artifacts

**Auslieferungsprozess:**

1. **Backend Container:**
   ```bash
   # Build
   docker build -t ghcr.io/USERNAME/sport-analytics-backend:VERSION .
   
   # Push
   docker push ghcr.io/USERNAME/sport-analytics-backend:VERSION
   docker push ghcr.io/USERNAME/sport-analytics-backend:latest
   
   # Deployment
   docker pull ghcr.io/USERNAME/sport-analytics-backend:VERSION
   docker run -p 3000:3000 ghcr.io/USERNAME/sport-analytics-backend:VERSION
   ```

2. **Frontend:**
   - Download Artifact aus GitHub Actions
   - Deployment auf Web-Server (z.B. Nginx, Apache)

**Quellen:**
- `backend/Dockerfile` - Container-Definition
- `.github/workflows/ci-cd-main.yml` - Build & Push Prozess

---

## 5.2 Services für Auslieferung - Servicekonfiguration dokumentieren

### Status: ✅ Teilweise dokumentiert

**Services:**

1. **Backend Service (Express)**
   - **Port:** 3000 (konfigurierbar via `PORT` Environment Variable)
   - **Konfiguration:** `backend/server.js`
   - **Environment Variables:**
     - `MONGODB_URI` (Standard: `mongodb://localhost:27017/sport-analytics`)
     - `JWT_SECRET` (Standard: `your-secret-key`)
     - `PORT` (Standard: `3000`)

2. **Frontend Service (Angular Dev Server)**
   - **Port:** 4200 (Development)
   - **Konfiguration:** `frontend/angular.json`
   - **Production Build:** Statische Dateien

3. **MongoDB Service**
   - **Port:** 27017 (Standard)
   - **Database:** `sport-analytics`

**Service-Konfiguration:**

**Backend (.env Beispiel):**
```
MONGODB_URI=mongodb://localhost:27017/sport-analytics
JWT_SECRET=your-secret-key
PORT=3000
```

**Docker Container:**
- Exposed Port: `3000`
- Start Command: `node server.js`
- Working Directory: `/app`

**Überprüfung:**
- Backend: `http://localhost:3000` (Health Check nicht explizit, aber API-Endpunkte verfügbar)
- Frontend: `http://localhost:4200` (Development)

**Quellen:**
- `backend/server.js` - Server-Konfiguration
- `backend/Dockerfile` - Container-Konfiguration
- `README.md` - Environment Variables
- `frontend/angular.json` - Angular-Konfiguration

---

## Zusammenfassung

| Kompetenz | Status | Dokumentationsgrad |
|-----------|--------|-------------------|
| Architektur | ✅ | Teilweise (Textbeschreibung vorhanden) |
| Build Anleitung | ✅ | Vollständig |
| Interface Prototypen | ✅ | Vollständig (5+ Komponenten) |
| Layout Gestaltung | ✅ | Vollständig |
| Farben & Typografie | ✅ | Vollständig (Mini Styleguide) |
| Projektorganisation | ⚠️ | Teilweise (Struktur vorhanden, Rollen/DoD fehlen) |
| Zeitplan | ❌ | Nicht vorhanden |
| Risiken | ⚠️ | Teilweise (aus Code erkennbar) |
| Wartungsplan | ❌ | Nicht vorhanden |
| Supportstruktur | ❌ | Nicht vorhanden |
| Release Planung | ✅ | Teilweise (Versionierung vorhanden) |
| Artefaktverwaltung | ✅ | Vollständig |
| Deployment Prozess | ✅ | Teilweise (CI/CD vorhanden) |
| Paketieren/Auslieferung | ✅ | Vollständig |
| Servicekonfiguration | ✅ | Teilweise |

**Legende:**
- ✅ Vollständig implementiert
- ⚠️ Teilweise implementiert
- ❌ Nicht implementiert
