# Data Sources

## Current (Phase 1)

**Hand-curated seed data** -- 25 real AI education policies from public legislative databases.

## Phase 5: Congress.gov API

- Free API key from api.data.gov (5,000 req/hr)
- Fetch federal bills from curated bill number list
- No keyword search at list level; maintain known-bills list manually

## Phase 6: Advanced Sources

| Source | Method | Notes |
|--------|--------|-------|
| ECS (Education Commission of the States) | Playwright scraper (JS-rendered) | Rich state policy data |
| State DoE guidance PDFs | Manual download + `pdfplumber` extraction | ~33 states have docs |
| TeachAI / EDSAFE / CDT | Aggregator websites for bill discovery | Used to update bill_numbers.json |
