# AI in Education Policy Explorer

Interactive dashboard for exploring US AI-in-education policy across all 50 states + DC.

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
Flask runs at http://localhost:5000

### Frontend
```bash
cd frontend
npm install
npm run dev
```
React app runs at http://localhost:5173

## Project Structure

- `frontend/` -- React (Vite) dashboard with map, trends, and Q&A tabs
- `backend/` -- Flask API with SQLite database
- `docs/` -- Schema and API documentation
