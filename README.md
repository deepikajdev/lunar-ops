# LUNAR OPS

LUNAR OPS is an educational lunar outpost survival simulator being developed for the NASA Space Apps Challenge 2026. It pairs a mission-control dashboard with a deterministic, ten-day survival game. Game values and outcomes are illustrative software rules; they are not NASA measurements, operational guidance, or an endorsement by NASA.

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+

## Getting started

```bash
npm install
npm run dev
```

Vite prints a local URL (usually `http://localhost:5173`). Open it in a browser to use the dashboard and simulator.

## How to play

1. Open **Survival sim** in the left navigation.
2. Review oxygen, water, food, power, crew health, equipment condition, and any active scenario event.
3. Choose one daily action. Each choice lists its modeled benefits and tradeoffs; choices that cannot be paid for with the current reserve are disabled.
4. Select **Advance day** to resolve the choice, resource use and regeneration, equipment wear, crew safety, and any active event.
5. Continue through Day 10. Keep the crew alive and reserves and equipment above critical levels for a successful outcome. A score breakdown explains the final result; restart begins the same seeded scenario again.

The original **Overview** destination remains available as the Phase 1 dashboard. Simulation state stays in memory while switching between destinations and resets when the page is reloaded.

## Simulation model and assumptions

The engine is deterministic for a given seed and decision sequence. It contains no NASA datasets or scientific measurements. Resource quantities are **game points** with a capacity of 100 points; rates, starting reserves, event odds, equipment wear, health effects, and score thresholds are balance choices for this educational game.

- Starting inventories, capacities, daily use, base regeneration, warning thresholds, health-loss rules, and equipment wear are configured in `src/logic/gameConfig.js`.
- Daily resource flow is current reserve + effective production − use, clamped between zero and capacity. Oxygen and water regeneration are scaled by their recycler condition; solar generation is scaled by array condition.
- Event probabilities, day eligibility, event effects, and compatible responses are in `src/logic/events.js`. A seed selects at most one event per day and does not repeat the same event on consecutive event days.
- Decision descriptions and their resource, crew, equipment, and continuity effects are in `src/logic/decisions.js`.
- Mission scoring weights crew survival (40), reserves (20), equipment (20), event responses (10), and continuity (10). Completion thresholds are implemented in `src/logic/scoring.js`.
- Pure state transitions live in `src/logic/engine.js`; React renders state but does not perform the simulation calculations.

These rules are designed for playability, not for estimating real lunar survival, validating a mission plan, or replacing expert guidance.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local Vite development server |
| `npm run api` | Start the server-only NASA API proxy on `127.0.0.1:8787` |
| `npm run build` | Build the production bundle into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Node.js tests for simulation and NASA API foundation |

## Project layout

```text
src/
  components/           Reusable dashboard components
    simulation/         Survival screen, panels, decisions, and result
  data/                 Phase 1 demo content and educational reference cards
  logic/                Game balance, events, decisions, engine, scoring
    __tests__/           Simulation engine tests
  nasa/                  NASA schemas, normalization, cache, mappings and provenance
  styles/                Dashboard, simulation, and NASA intelligence stylesheets
  App.jsx                App navigation and React state wiring
  main.jsx               Browser entry point
server/
  index.js               Loopback-only NASA API boundary
  nasa/                  Server-only NASA adapters and transport
    __tests__/            API boundary and transport tests
docs/
  PHASE3_M0_REPORT.md     NASA endpoint verification and captured-sample notes
  PHASE3_M2_M9.md         NASA data integration, scientific limits, and validation
tests/fixtures/nasa/      Genuine M0 NASA responses and retrieval sidecars
```

## Technology

- React and React DOM
- Vite
- Lucide React for icons
- Recharts for dashboard visualizations
- Framer Motion for animation
- Node.js built-in test runner for simulation and API tests

Dependencies are recorded in `package.json` and `package-lock.json`. Keep generated output (`dist/`) and installed packages (`node_modules/`) out of version control.

## NASA API foundation (Phase 3 M1)

Reusable adapters and server transport live under `server/nasa/`; shared response schemas, normalization, cache, and provenance live under `src/nasa/`. Run `npm run api` to start the server-only API boundary. Authenticated DONKI operations read `NASA_API_KEY` from the server process environment; the key is never read by Vite or included in frontend code. In PowerShell, set a registered key only in the terminal session before starting the server:

```powershell
$env:NASA_API_KEY = '<registered NASA API key>'
npm run api
```

Do not use `VITE_*` names, commit `.env` files, or put credentials in public, user-supplied, committed, or browser-visible URLs, fixtures, logs, or browser requests. NASA requires the server to send the key as an outbound query parameter; the adapter strips it from provenance URLs and does not log request URLs. Production requests reject `DEMO_KEY`. The API server binds to loopback by default and does not enable cross-origin access. Do not expose it through a public reverse proxy until caller authentication and abuse-rate controls are in place.

The server routes are `GET /api/nasa/donki/{cme,gst,sep,ips}`, the explicitly unverified `GET /api/nasa/donki/flr`, `GET /api/nasa/images/search?q=...`, and image `GET /api/nasa/images/{asset,metadata}/{nasa_id}`. Vite proxies same-origin `/api` requests to the loopback service; direct browser requests to NASA are not used. For live access, run `npm run api` and `npm run dev` in separate terminals. Without the API service, the application can use its bundled archives and offline cache.

DONKI CME, GST, SEP and IPS payloads are validated against genuine M0 samples. FLR remains explicitly schema-unverified. NASA Images search, asset, and metadata responses have separate validators. Transport failures use bounded retries only for network errors and selected 5xx responses (two retries by default, a hard cap of five); 429 returns a normalized rate-limit error and `Retry-After` rather than retrying automatically. Request provenance distinguishes `NASA_LIVE`, `NASA_ARCHIVE`, `DERIVED`, and `SIMULATED`. The browser repository uses memory and IndexedDB caches, a 15-minute configurable TTL, stale-while-revalidate, and the genuine bundled M0 snapshots for REPLAY/OFFLINE operation.

## NASA intelligence (Phase 3 M2–M9)

Open **NASA Intelligence** in the sidebar to view the event timeline, inspect normalized NASA records and linked event IDs, see GST Kp values, choose LIVE/REPLAY/OFFLINE mode, browse the curated NASA Images gallery, or read the source-linked science cards. REPLAY is selected by default. Live DONKI access requires the server API boundary and a registered key; without it, the page shows available cache/archive content and labels the fallback. Start the app in two terminals when live data is configured: `npm run api` and `npm run dev`.

The NASA observation-to-game mapping is deliberately informational. SEP may prompt a radiation and shelter discussion, but no dose, shielding benefit, crew-health effect, resource change, or equipment damage is calculated. CME, GST and IPS observations are narrative context. Kp is Earth geomagnetic context; the sampled DONKI GST records identify NOAA as the Kp source, separately attributed in the interface. Three replay briefings use records selected from the genuine May 2024 M0 snapshots. Adding a briefing to the survival simulator stores a sanitized `GameSignal` and cannot alter the game model. No FLR records are normalized or mapped.

See [`docs/PHASE3_M2_M9.md`](docs/PHASE3_M2_M9.md) for the architecture, mapping classifications, archive IDs, and limits. `npm test` covers the NASA adapters, error paths, caches, archive modes, provenance, conservative mappings, three verified replay records, gallery curation and Phase 2 regressions. The NASA Intelligence view uses responsive layouts and keyboard-operable native controls; visual behavior still requires browser review at deployment breakpoints.
