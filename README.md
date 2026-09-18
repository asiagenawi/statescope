# StateScope — AI in Education Policy Tracker

Interactive dashboard for exploring US AI-in-education policy across all 50 states + DC.

## Architecture

The frontend is **decoupled from the API for everything the map needs**. Policy data is
exported to a static snapshot at build time (`frontend/public/data/snapshot.json`) and read
directly by the browser, so the map paints without a network round trip — and without waiting
on the free-tier backend to cold start. The Flask API is only required for the `/ask` chat.

```
frontend/  React (Vite) — map, trends, chat. Deployed to GitHub Pages.
backend/   Flask + SQLite — /ask (Claude) plus the REST endpoints the snapshot is built from.
docs/      Schema and API documentation.
```

The SQLite database is derived, not authoritative: it is rebuilt from the checked-in JSON in
`backend/data/` by `init_db.py` + `seed_data.py` on every deploy. To change the data, edit that
JSON and re-run the seed.

## Quick Start

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python scripts/init_db.py
python scripts/seed_data.py
python app.py
```
Flask runs at http://localhost:5001

Set `ANTHROPIC_API_KEY` in `.env` for the chat to work (see `.env.example`).

### Frontend
```bash
# Generate the static data snapshot the frontend reads (needs the seeded DB above)
python backend/scripts/export_static_data.py

cd frontend
npm install
npm run dev
```
React app runs at http://localhost:5173

The map works with the backend stopped. Only the chat needs it.

## Shareable URLs

App state lives in the query string, so views are linkable and survive a reload:

| URL | Opens |
|---|---|
| `?state=TX` | the map with Texas selected |
| `?view=trends` | the Trends view |
| `?view=trends&fstate=CA&type=bill` | Trends filtered to California bills |

Keys: `view`, `state`, and the Trends filters `fstate`, `topic`, `type`.

## Regenerating the data snapshot

Any time the seed JSON changes:

```bash
python backend/scripts/init_db.py
python backend/scripts/seed_data.py
python backend/scripts/export_static_data.py
```

CI does this automatically on every deploy (`.github/workflows/deploy-frontend.yml`).
`DATA_UPDATED` in `export_static_data.py` is the curation date shown in the header — it is
deliberately not the build date, since rebuilding doesn't make the data any fresher.
