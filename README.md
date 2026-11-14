# LUNAR OPS

An educational lunar mission survival simulator being developed for the NASA Space Apps Challenge 2026. This repository currently contains the Phase 0 project foundation only; mission systems and simulator behavior have not yet been implemented.

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+

## Getting started

```bash
npm install
npm run dev
```

Vite prints a local URL (usually `http://localhost:5173`). Open it in a browser to view the starter page.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local Vite development server |
| `npm run build` | Build the production bundle into `dist/` |
| `npm run preview` | Preview the production build locally |

## Project layout

```text
src/
  components/   Reusable interface components
  data/         Project data and future sourced datasets
  logic/        Simulator and application logic
  styles/       Global and shared stylesheets
  App.jsx       Root React component
  main.jsx      Browser entry point
```

The folders are intentionally starting points. No NASA datasets or scientific claims are bundled in this setup. Add future data with source, licensing, and provenance documented alongside it.

## Technology

- React and React DOM
- Vite
- Lucide React for icons
- Recharts for charts
- Framer Motion for animation

## Development notes

This project uses JavaScript and JSX with native ES modules. Dependencies are recorded in `package.json` and locked in `package-lock.json` after installation. Keep generated output (`dist/`) and installed packages (`node_modules/`) out of version control.
