# Köln Branchen Portal - Buchungsverwaltungssystem

Ein professionelles Webanwendungssystem für die Verwaltung von Buchungen und Reservierungen für das Portal https://www.koeln.de/branchen.

## 🚀 Überblick

Das Köln Branchen Portal ist eine vollständige Full-Stack-Webanwendung, die speziell für die Verwaltung von Buchungen und Platzierungen entwickelt wurde. Das System bietet eine intuitive Benutzeroberfläche für die Erstellung, Verwaltung und Überwachung von Buchungen mit automatischer Verfügbarkeitsprüfung und Konfliktverhinderung.

### ✨ Hauptfunktionen

- **📅 Buchungsverwaltung**: Vollständige CRUD-Operationen für Buchungen
- **🔍 Verfügbarkeitsprüfung**: Echtzeit-Prüfung der Verfügbarkeit mit Konfliktverhinderung
- **📊 Übersichtsdashboard**: Tabellarische und statistische Ansicht aller Buchungen
- **🎯 Platzierungssystem**: Verwaltung von 6 verschiedenen Platzierungen
- **⏰ Automatische Bereinigung**: Automatisches Löschen abgelaufener Reservierungen
- **📱 Responsive Design**: Optimiert für Desktop und mobile Geräte
- **🔒 Sicherheit**: Rate Limiting, Input-Validierung und CORS-Schutz

## 🏗️ Technologie-Stack

### Frontend
- **React 18** mit Vite als Build-Tool
- **Tailwind CSS** für modernes Styling
- **shadcn/ui** Komponenten-Bibliothek
- **Lucide Icons** für konsistente Iconographie
- **React Router** für Navigation

### Backend
- **Node.js** mit Express.js Framework
- **PostgreSQL** als Hauptdatenbank
- **Joi** für Datenvalidierung
- **CORS** für Cross-Origin-Requests
- **Helmet** für Sicherheits-Headers
- **Morgan** für Request-Logging

### Deployment
- **Render.com** für Cloud-Hosting
- **Automatische CI/CD** über GitHub Integration
- **PostgreSQL** als verwalteter Service
- **Static Site Hosting** für Frontend

## 📁 Projektstruktur

```
koeln-branchen-portal/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # React Komponenten
│   │   │   ├── BookingForm.jsx
│   │   │   ├── BookingOverview.jsx
│   │   │   └── AvailabilityChecker.jsx
│   │   ├── App.jsx         # Haupt-App-Komponente
│   │   └── main.jsx        # Entry Point
│   ├── public/             # Statische Assets
│   ├── package.json
│   └── vite.config.js
├── server/                 # Express.js Backend
│   ├── config/
│   │   └── database.js     # Datenbank-Konfiguration
│   ├── models/
│   │   └── Booking.js      # Buchungsmodell
│   ├── routes/
│   │   ├── bookings.js     # Buchungs-API-Routen
│   │   └── availability.js # Verfügbarkeits-API-Routen
│   ├── scripts/
│   │   ├── migrate.js      # Datenbank-Migration
│   │   └── seed.js         # Testdaten-Seeding
│   ├── index.js            # Server Entry Point
│   └── package.json
├── render.yaml             # Render.com Deployment-Konfiguration
├── DEPLOYMENT.md           # Deployment-Anleitung
└── README.md               # Diese Datei
```

## 🗄️ Datenstruktur

### Buchungsfelder

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | Integer | Eindeutige Buchungs-ID (Auto-Increment) |
| `kundenname` | String(100) | Name des Kunden |
| `kundennummer` | String(50) | Eindeutige Kundennummer |
| `belegung` | String(100) | Branche/Kategorie der Buchung |
| `zeitraum_von` | Timestamp | Startdatum und -zeit |
| `zeitraum_bis` | Timestamp | Enddatum und -zeit |
| `platzierung` | Integer(1-6) | Platzierungsnummer |
| `status` | Enum | Status: 'frei', 'reserviert', 'gebucht' |
| `berater` | String(100) | Zuständiger Berater |
| `created_at` | Timestamp | Erstellungsdatum |
| `updated_at` | Timestamp | Letzte Änderung |

### Constraints und Validierung

- **Zeitraum-Validierung**: `zeitraum_bis` muss nach `zeitraum_von` liegen
- **Platzierung**: Muss zwischen 1 und 6 liegen
- **Eindeutigkeit**: Kombination aus `belegung`, `platzierung`, `zeitraum_von` und `zeitraum_bis` muss eindeutig sein
- **Status-Validierung**: Nur erlaubte Werte ('frei', 'reserviert', 'gebucht')

## 🚀 Installation und Setup

### Voraussetzungen

- Node.js 18+ 
- PostgreSQL 12+
- npm oder pnpm

### Lokale Entwicklung

1. **Repository klonen**
   ```bash
   git clone https://github.com/yourusername/koeln-branchen-portal.git
   cd koeln-branchen-portal
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # .env Datei mit Ihren Datenbank-Credentials bearbeiten
   ```

3. **Datenbank Setup**
   ```bash
   # Datenbank-Tabellen erstellen
   npm run migrate:up
   
   # (Optional) Testdaten einfügen
   npm run seed:run
   ```

4. **Frontend Setup**
   ```bash
   cd ../client
   npm install
   cp .env.example .env
   # .env Datei mit Backend-URL bearbeiten
   ```

5. **Anwendung starten**
   ```bash
   # Backend (Terminal 1)
   cd server
   npm run dev
   
   # Frontend (Terminal 2)
   cd client
   npm run dev
   ```

Die Anwendung ist dann verfügbar unter:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- API Health Check: http://localhost:3001/health

## 🌐 Deployment

### Render.com Deployment

Detaillierte Anweisungen finden Sie in [DEPLOYMENT.md](./DEPLOYMENT.md).

**Schnellstart:**

1. Repository zu GitHub pushen
2. Render.com Dashboard öffnen
3. "New" → "Blueprint" wählen
4. Repository verbinden
5. `render.yaml` wird automatisch erkannt
6. "Apply" klicken für automatisches Deployment

### Umgebungsvariablen

**Backend (.env):**
```bash
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
PORT=10000
CORS_ORIGIN=*
```

**Frontend (.env):**
```bash
VITE_API_BASE_URL=https://your-backend-service.onrender.com
```

## 📚 API-Dokumentation

### Basis-URL
```
https://your-api-service.onrender.com/api
```

### Authentifizierung
Aktuell keine Authentifizierung erforderlich. Rate Limiting: 100 Requests pro 15 Minuten.

### Endpoints

#### Buchungen

**GET /api/bookings**
- Beschreibung: Alle Buchungen abrufen (mit optionalen Filtern)
- Query Parameter:
  - `belegung` (string): Filter nach Branche
  - `berater` (string): Filter nach Berater
  - `status` (string): Filter nach Status
  - `platzierung` (integer): Filter nach Platzierung
  - `zeitraum_von` (datetime): Filter nach Startdatum
  - `zeitraum_bis` (datetime): Filter nach Enddatum

**POST /api/bookings**
- Beschreibung: Neue Buchung erstellen
- Body: JSON mit allen Buchungsfeldern
- Validierung: Automatische Konfliktprüfung

**PUT /api/bookings/:id**
- Beschreibung: Buchung aktualisieren
- Parameter: `id` (integer) - Buchungs-ID
- Body: JSON mit zu aktualisierenden Feldern

**DELETE /api/bookings/:id**
- Beschreibung: Buchung löschen
- Parameter: `id` (integer) - Buchungs-ID

#### Verfügbarkeit

**GET /api/availability/check**
- Beschreibung: Verfügbarkeit für spezifische Kriterien prüfen
- Query Parameter:
  - `belegung` (string, required): Branche
  - `platzierung` (integer, required): Platzierung (1-6)
  - `zeitraum_von` (datetime, required): Startdatum
  - `zeitraum_bis` (datetime, required): Enddatum

**GET /api/availability/overview**
- Beschreibung: Verfügbarkeitsübersicht für Zeitraum
- Query Parameter:
  - `zeitraum_von` (datetime, required): Startdatum
  - `zeitraum_bis` (datetime, required): Enddatum
  - `belegung` (string, optional): Spezifische Branche
  - `platzierung_min` (integer, optional): Min. Platzierung
  - `platzierung_max` (integer, optional): Max. Platzierung

### Antwortformat

**Erfolgreiche Antwort:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Fehlerantwort:**
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message",
  "details": [ ... ]
}
```

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test
```

### Frontend Tests
```bash
cd client
npm test
```

### API-Struktur Test
```bash
node test-api.js
```

## 🔧 Wartung

### Datenbank-Operationen

```bash
# Migration Status prüfen
npm run migrate:status

# Datenbank zurücksetzen
npm run migrate:reset

# Testdaten anzeigen
npm run seed:show

# Abgelaufene Reservierungen bereinigen
npm run cleanup
```

### Monitoring

- **Health Check**: `/health` Endpoint für Service-Monitoring
- **Logs**: Render Dashboard → Service → Logs Tab
- **Metriken**: Render Dashboard → Service → Metrics Tab

## 🔒 Sicherheit

### Implementierte Sicherheitsmaßnahmen

- **Rate Limiting**: 100 Requests pro 15 Minuten pro IP
- **CORS**: Konfigurierbare Cross-Origin-Richtlinien
- **Input-Validierung**: Joi-Schema-Validierung für alle Eingaben
- **SQL-Injection-Schutz**: Parametrisierte Queries
- **Helmet**: Sicherheits-Headers für Express
- **Environment Variables**: Sensible Daten in Umgebungsvariablen

### Empfohlene Produktions-Einstellungen

```bash
# Restriktive CORS für Produktion
CORS_ORIGIN=https://your-frontend-domain.com

# Stärkere Rate Limits
RATE_LIMIT_MAX_REQUESTS=50
RATE_LIMIT_WINDOW_MS=900000
```

## 🤝 Beitragen

1. Fork des Repositories erstellen
2. Feature-Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe [LICENSE](LICENSE) Datei für Details.

## 👥 Autoren

- **Manus AI** - Entwicklung und Design

## 🙏 Danksagungen

- **Render.com** für das exzellente Hosting-Platform
- **shadcn/ui** für die wunderschönen UI-Komponenten
- **Tailwind CSS** für das moderne Styling-Framework
- **React Team** für das großartige Frontend-Framework

## 📞 Support

Bei Fragen oder Problemen:

1. **GitHub Issues**: Für Bug-Reports und Feature-Requests
2. **Dokumentation**: Siehe [DEPLOYMENT.md](./DEPLOYMENT.md) für Deployment-Hilfe
3. **API-Dokumentation**: Siehe Abschnitt "API-Dokumentation" oben

---

**Entwickelt mit ❤️ für die Köln.de Community**

