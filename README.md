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

## Theming

Light and dark, following the OS by default with an explicit override that
persists. The dark choropleth steps are **selected for the dark surface and
validated against it**, not inverted — and the ramp runs the other way, since on
paper more ink means more while on a dark ground more light does.

| | light (`#fcfcfb`) | dark (`#1a1a19`) |
|---|---|---|
| ordinal ramp | passes | passes |
| worst all-pairs CVD ΔE | 14.0 | 15.8 |
| worst normal-vision ΔE | 15.6 | 15.9 |

Floors are 8 and 15. Colours live in two places — `utils/colors.js` for charts,
CSS custom properties for everything else — and a test asserts the two match, so
they cannot drift.

## Tests

```bash
cd frontend && npm test
```

Node's built-in runner, no extra dependency. Covers the pure logic (citation
linkifying, CSV escaping, comparison aggregation, the status palette) and the
invariants of the generated snapshot — including that the derived `policy_status`
still agrees with the underlying policies, and that every policy carries a
parseable source URL, which is a claim the methodology panel makes publicly.

CI runs these against the freshly generated snapshot before building, so a data
or logic regression fails the deploy instead of shipping.

## Social preview

`npm run og` regenerates `public/og-image.png` (1200×630) from the live snapshot —
the real choropleth and the real headline numbers, so the card cannot advertise
something the tracker does not say. Needs a local Chrome; the PNG is committed so
the build itself needs no browser. Re-run it when the data changes.

## Methodology

The in-app **Methodology** panel (`?about=1`) documents what counts as a policy, how
each state's colour is derived, where the data comes from, and — importantly — where
the dataset falls short. Every figure in it is computed from the snapshot at render
time rather than written by hand, so the prose cannot drift away from the data.

## Shareable URLs

App state lives in the query string, so views are linkable and survive a reload:

| URL | Opens |
|---|---|
| `?state=TX` | the map with Texas selected |
| `?state=US` | federal policy |
| `?view=trends` | the Trends view |
| `?view=trends&fstate=CA&type=bill` | Trends filtered to California bills |
| `?about=1` | the methodology panel |
| `?view=compare&states=CA,TX` | two states side by side |

Keys: `view`, `state`, `about`, `states` (compare), and the Trends filters `fstate`, `topic`, `type`.

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
