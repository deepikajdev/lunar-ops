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
| `npm run build` | Build the production bundle into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Node.js built-in tests for the simulation engine |

## Project layout

```text
src/
  components/           Reusable dashboard components
    simulation/         Survival screen, panels, decisions, and result
  data/                 Phase 1 dashboard demo content
  logic/                Game balance, events, decisions, engine, scoring
    __tests__/           Simulation engine tests
  styles/                Dashboard and simulation stylesheets
  App.jsx                App navigation and React state wiring
  main.jsx               Browser entry point
```

## Technology

- React and React DOM
- Vite
- Lucide React for icons
- Recharts for dashboard visualizations
- Framer Motion for animation
- Node.js built-in test runner for simulation tests

Dependencies are recorded in `package.json` and `package-lock.json`. Keep generated output (`dist/`) and installed packages (`node_modules/`) out of version control.
