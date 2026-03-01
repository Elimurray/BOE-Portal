# BOE Portal

A web application for managing the Board of Examiners (BOE) process at the University of Waikato. It handles student grade data uploads, course review form collection, grade distribution analysis with historical comparisons, and a presentation interface for BOE meetings.

## Tech Stack

| Layer        | Technology             |
| ------------ | ---------------------- |
| Frontend     | React, Vite            |
| Charts       | Recharts               |
| HTTP Client  | Axios                  |
| Backend      | Node.js, Express       |
| Database     | PostgreSQL             |
| File Uploads | Multer                 |
| CSV Parsing  | PapaParse              |
| Web Scraping | Cheerio                |
| Deployment   | Docker, Docker Compose |

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

## API Reference

### Grades — `/api/grades`

| Method | Path                    | Description                                                                       |
| ------ | ----------------------- | --------------------------------------------------------------------------------- |
| `POST` | `/upload`               | Upload CSV file; parses grade rows and upserts grade distributions per occurrence |
| `PUT`  | `/update/:occurrenceId` | Manually update letter grade counts for an occurrence                             |

### Papers — `/api/papers`

| Method | Path                       | Description                                                   |
| ------ | -------------------------- | ------------------------------------------------------------- |
| `GET`  | `/`                        | All papers with occurrence counts and latest year/trimester   |
| `GET`  | `/occurrences`             | All occurrences with grade distribution and form status       |
| `GET`  | `/occurrences/incomplete`  | Occurrences where the course form has not been submitted      |
| `GET`  | `/occurrences/:id`         | Single occurrence with paper details, grade data, and outline |
| `POST` | `/occurrences/:id/outline` | Save scraped course outline data to an occurrence             |

### Forms — `/api/forms`

| Method | Path | Description                                                                         |
| ------ | ---- | ----------------------------------------------------------------------------------- |
| `POST` | `/`  | Submit a course review form; creates staff entries and links them to the occurrence |
| `GET`  | `/`  | All submitted forms joined with paper information                                   |

### Graphs — `/api/graphs`

| Method | Path                                     | Description                                                                               |
| ------ | ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| `GET`  | `/:occurrenceId/distribution`            | Grade distribution for a single occurrence, formatted for charts                          |
| `GET`  | `/historical/:paperCode`                 | Year-over-year pass rates and student counts for a paper code                             |
| `GET`  | `/historical-distribution/:occurrenceId` | Full grade breakdowns for all previous occurrences of the same paper at the same location |

### Scraper — `/api/scraper`

| Method | Path       | Description                                                     |
| ------ | ---------- | --------------------------------------------------------------- |
| `POST` | `/outline` | Fetch and parse a course outline from the UoW curriculum system |

**Request body:**

```json
{
  "paperCode": "COMP103",
  "year": 2025,
  "trimester": "A",
  "location": "Hamilton"
}
```

The scraper builds an occurrence code in the format `COMP103-25A (Hamilton)`, URL-encodes it, and fetches HTML from the University of Waikato curriculum management system. Cheerio parses the returned HTML and extracts the following fields:

| Field | Source |
|---|---|
| `paperTitle` | `Paper Title` label |
| `paperOccurenceCode` | `Paper Occurrence Code` label |
| `points` | `Points` label |
| `deliveryMode` | `Delivery Mode` label |
| `whenTaught` / `whereTaught` | `When Taught` / `Where Taught` labels |
| `startWeek` / `endWeek` | `Start Week` / `End Week` labels |
| `selfPaced` | `Self-Paced` label |
| `assessmentRatio` | `Internal Assessment` label |
| `convenors` | Staff table rows matching `Convenor` |
| `lecturers` | Staff table rows matching `Lecturer` |
| `administrators` | Staff table rows matching `Administrators` |
| `tutors` | Staff table rows matching `Tutor` |

Staff entries are returned as `{ name, email }` objects, with the name and email parsed by splitting on ` - ` in the staff table cell text.

If the outline has not been published the endpoint returns `success: false` with a `404` status rather than throwing an error. The parsed data is returned to the frontend and can then be saved to `paper_outlines` via `POST /api/papers/occurrences/:id/outline`.

### Review — `/api/review`

| Method | Path               | Description                                                        |
| ------ | ------------------ | ------------------------------------------------------------------ |
| `GET`  | `/occurrences/:id` | Full occurrence details via the `occurrence_summary` database view |

### Health

| Method | Path          | Description  |
| ------ | ------------- | ------------ |
| `GET`  | `/api/health` | Health check |

## Database Schema

Seven tables with cascading foreign keys. All FK relationships use `ON DELETE CASCADE`.

### `papers`

Core course catalogue. Each paper has a unique `paper_code`.

| Column                      | Type         | Notes  |
| --------------------------- | ------------ | ------ |
| `paper_id`                  | serial PK    |        |
| `paper_code`                | varchar(20)  | unique |
| `paper_name`                | varchar(255) |        |
| `created_at` / `updated_at` | timestamp    |        |

### `occurrences`

A paper offered in a specific year, trimester, and location. Unique on `(paper_id, year, trimester, location)`.

| Column          | Type            | Notes |
| --------------- | --------------- | ----- |
| `occurrence_id` | serial PK       |       |
| `paper_id`      | int FK → papers |       |
| `year`          | int             |       |
| `trimester`     | varchar(20)     |       |
| `location`      | varchar(100)    |       |

### `grade_distributions`

One row per occurrence. Totals, pass count, and pass rate are computed columns.

| Column                                            | Type                 | Notes                  |
| ------------------------------------------------- | -------------------- | ---------------------- |
| `distribution_id`                                 | serial PK            |                        |
| `occurrence_id`                                   | int FK → occurrences | unique                 |
| `grade_a_plus` … `grade_e`                        | int                  | default 0              |
| `grade_rp`, `grade_other`, `grade_wd`, `grade_ic` | int                  |                        |
| `total_students`                                  | int                  | generated              |
| `pass_count`                                      | int                  | generated (A+–C- + RP) |
| `pass_rate`                                       | numeric(5,2)         | generated              |
| `uploaded_from_csv`                               | bool                 |                        |
| `upload_filename`                                 | varchar(255)         |                        |

### `staff`

Staff member registry, deduplicated by email.

| Column     | Type         | Notes  |
| ---------- | ------------ | ------ |
| `staff_id` | serial PK    |        |
| `name`     | varchar(100) |        |
| `email`    | varchar(255) | unique |

### `occurrence_staff`

Many-to-many join between occurrences and staff. Composite PK on `(occurrence_id, staff_id, role)`.

| Column          | Type                 | Notes                                           |
| --------------- | -------------------- | ----------------------------------------------- |
| `occurrence_id` | int FK → occurrences |                                                 |
| `staff_id`      | int FK → staff       |                                                 |
| `role`          | varchar(20)          | Lecturer, Convenor, Tutor, Administrator, Other |

### `course_forms`

Course review form submitted by staff. One form per occurrence.

| Column                                     | Type                 | Notes                                |
| ------------------------------------------ | -------------------- | ------------------------------------ |
| `form_id`                                  | serial PK            |                                      |
| `occurrence_id`                            | int FK → occurrences |                                      |
| `status`                                   | varchar(20)          | draft, submitted, reviewed, approved |
| `submitted_by_name` / `submitted_by_email` | varchar              |                                      |
| `lecturers`, `tutors`                      | text                 |                                      |
| `rp_count`                                 | int                  | default 0                            |
| `assessment_item_count`                    | int                  |                                      |
| `internal_external_split`                  | varchar(200)         |                                      |
| `assessment_types_summary`                 | text                 |                                      |
| `delivery_mode`                            | varchar(200)         |                                      |
| `major_changes_description`                | text                 |                                      |
| `grade_distribution_different`             | bool                 |                                      |
| `grade_distribution_comments`              | text                 |                                      |
| `other_comments`                           | text                 |                                      |

### `paper_outlines`

Scraped course outline data stored as JSONB. One row per occurrence.

| Column           | Type                 | Notes        |
| ---------------- | -------------------- | ------------ |
| `outline_id`     | serial PK            |              |
| `occurrence_id`  | int FK → occurrences | unique       |
| `scraped_data`   | jsonb                |              |
| `source_url`     | varchar(500)         |              |
| `scrape_success` | bool                 | default true |

### `occurrence_summary` (view)

Joins all tables above into a single flat view used by the review and presentation routes.

## Presentation Keyboard Shortcuts

| Key                  | Action                  |
| -------------------- | ----------------------- |
| `←` / `→` or `Space` | Navigate between papers |
| `F`                  | Toggle fullscreen       |
| `C`                  | Toggle compare mode     |
| `Escape`             | Exit presentation       |
