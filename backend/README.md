# SportAnalytics Backend

## Setup

1. Stelle sicher, dass MongoDB lokal läuft (Standard: mongodb://localhost:27017/sportanalytics)
2. Installiere die Abhängigkeiten:
   ```
   npm install
   ```
3. Starte das Backend:
   ```
   npm start
   ```

## API-Endpunkte

- `POST /api/upload` – Video-Upload (Form-Data: video)
- `GET /api/videos` – Liste aller Videos (Metadaten)
- `GET /api/video/:id` – Stream eines Videos 