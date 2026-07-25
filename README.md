# Nād-Chitra — mock-up

A deliberately simple proof-of-concept built with React, JavaScript and Node/Express.

## Run it

Requires a recent Node.js installation.

```bash
npm install
npm run install:all
npm run dev
```

Open the Vite URL printed in the terminal (normally http://localhost:5173).

## What it does

- Home/splash page for **Nād-Chitra**
- Browse the two collections by museum
- Browse instrument classifications across both museums
- Painting thumbnails come from `training_source.csv`
- Object-page URLs and research metadata come from `normalized_output.csv`
- Selecting a painting attempts to show the museum object page in an iframe
- A direct "Open on museum site" link is provided because museums may block iframe embedding

## Structure

- `client/` — React/Vite frontend
- `server/` — tiny Express API
- `data/` — the two supplied CSV files

There is intentionally no database, authentication, state library, design system, or production architecture.
# N-d-Chitra-mockups
