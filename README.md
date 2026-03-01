# BOE Portal

A web application for managing the Board of Examiners (BOE) process at the University of Waikato. It handles student grade data uploads, course review form collection, grade distribution analysis with historical comparisons, and a presentation interface for BOE meetings.

## Tech Stack

**Frontend:** React, Vite, Recharts
**Backend:** Node.js, Express, PostgreSQL, Multer, PapaParse, Cheerio
**Deployment:** Docker / Docker Compose

## Project Structure

```
BOE Portal/
├── frontend/
│   └── src/
│       ├── components/      # Dashboard, Forms, Charts, Presentation, etc.
│       ├── services/        # API client (api.js)
│       ├── App.jsx          # Routes
│       └── main.jsx         # Entry point
├── backend/
│   ├── routes/              # grades, papers, forms, scraper, graphs, review
│   ├── db/
│   │   ├── connection.js    # PostgreSQL connection pool
│   │   ├── schema.sql       # Database schema
│   │   └── migrations/
│   ├── uploads/             # Temporary CSV storage
│   └── server.js            # Express entry point
├── test/
│   └── test-scraper.js
└── docker-compose.yml
```

## Features

- **CSV Upload** — Import student grade data from CSV files; parses paper codes in the format `CODE###-YYTL (LOCATION)`
- **Grade Management** — View and edit grade distributions across all grade categories (A+–E, RP, IC, Other)
- **Course Review Forms** — Staff submit forms capturing lecturers, tutors, RP counts, assessment items, delivery mode, and notes
- **Historical Comparisons** — Compare grade distributions across previous years with interactive charts
- **Course Outline Scraping** — Automatically fetch course outlines from the University of Waikato curriculum system
- **Presentation Mode** — Full-screen keyboard-navigable interface for BOE meetings with staging, filtering, and compare functionality

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=3001
DATABASE_URL=postgresql://username:password@host:5432/boe_portal
NODE_ENV=development
```

Initialize the database:

```bash
psql -U <username> -d boe_portal -f backend/db/schema.sql
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

## Running

**Backend** (terminal 1):

```bash
cd backend
npm run dev   # http://localhost:3001
```

**Frontend** (terminal 2):

```bash
cd frontend
npm run dev   # http://localhost:5173
```

### Docker (alternative)

```bash
docker-compose up
```

## API Endpoints

| Route             | Description              |
| ----------------- | ------------------------ |
| `GET /api/health` | Health check             |
| `/api/grades`     | Grade data operations    |
| `/api/papers`     | Paper/course information |
| `/api/forms`      | Course review forms      |
| `/api/graphs`     | Analytics and chart data |
| `/api/scraper`    | Course outline scraping  |
| `/api/review`     | Review data retrieval    |

## Presentation Keyboard Shortcuts

| Key                  | Action                  |
| -------------------- | ----------------------- |
| `←` / `→` or `Space` | Navigate between papers |
| `F`                  | Toggle fullscreen       |
| `C`                  | Toggle compare mode     |
| `Escape`             | Exit presentation       |
