# GTM Engine

Outbound tracker for Ethana AI and Cursory. Replaces the scattered Gmail-only
tracking with a single interface backed by Airtable.

## Products / channels tracked

- **Ethana AI** (BFSI businesses): Direct, Partnership, Advisory, Tenders
- **Cursory** (social intelligence, agencies/brands): Direct to Brand, Direct
  to Agency, Agency for Brands, Tenders

Geographies: India, UK/Europe, US.

## Data

All lead data lives in the **GTM Engine Tracker** Airtable base
(`app3pIXQ08Ubx7s0f`), tables `Leads` and `Interactions`. The app reads and
writes directly to Airtable — no separate database.

## Setup

```bash
npm install
cp .env.example .env.local
# fill in AIRTABLE_API_KEY (Personal Access Token scoped to the base above)
npm run dev
```

Gmail live sync is not wired up yet — see `Notes` in the app for current
status.
