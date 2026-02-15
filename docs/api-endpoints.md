# API Endpoints

Base URL: `http://localhost:5000`

## Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + policy count |

## States

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/states` | All states with policy counts |
| GET | `/api/states/<code>/policies` | Policies for one state (e.g. `/api/states/CA/policies`) |

## Policies

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| GET | `/api/policies` | `level`, `status`, `topic_id`, `limit`, `offset` | All policies, paginated + filtered |
| GET | `/api/policies/<id>` | | Single policy detail |
| GET | `/api/topics` | | All topic categories |

## Trends

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trends/timeline` | Policy counts by year |
| GET | `/api/trends/topics` | Policy counts by topic |

## Q&A (Phase 4)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/ask` | `{"question": "..."}` | Natural language Q&A via Claude |
