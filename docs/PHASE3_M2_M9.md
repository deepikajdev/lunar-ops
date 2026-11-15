# Phase 3 M2–M9 — NASA data intelligence

This phase adds source-aware NASA observations alongside the existing mission dashboard and survival engine. It does not treat observations as game-generated events or NASA measurements as survival-model inputs.

## Architecture

- `server/nasa/` owns NASA HTTP transport and DONKI/Image API adapters. `NASA_API_KEY` is server-only and must never use a `VITE_` prefix.
- `src/nasa/schemas.js` validates only the successful M0 response shapes for CME, GST, SEP, IPS and Images. FLR intentionally has no schema.
- `src/nasa/normalize.js` creates the internal event model, retains source records and version history, and isolates malformed records.
- `src/data/nasaSnapshots.js` imports the raw M0 fixtures. Archive provenance comes from their sidecar response timestamps/endpoints; snapshots are not rewritten into new event records.
- `src/nasa/repository.js` reads live data through same-origin `/api` routes, caches normalized records in memory and IndexedDB, supports replay/offline modes, and falls back to genuine archive fixtures. Without an archive for a type, its empty placeholder is explicitly `SIMULATED` and contains no NASA observation.
- `src/nasa/mappingRules.js` is a declarative, source-linked rule set. It only produces explanatory annotations.
- `src/logic/gameSignals.js` validates the narrow context interface accepted by Phase 2. Signals do not include raw NASA records or effectful values.
- `src/nasa/imageGallery.js` selects only actual image renditions and metadata from the genuine M0 Images search response.

## Mapping policy

| DONKI type | Classification | Use in LUNAR OPS | Explicit limit |
| --- | --- | --- | --- |
| SEP | `INDIRECT` | Optional radiation/shelter discussion prompt | No local dose, exposure, shielding calculation, health impact, or protective benefit is modeled. |
| CME | `NARRATIVE` | Event and linked-record context | A cataloged CME does not establish local lunar equipment or surface effects. |
| GST | `NARRATIVE` | Earth geomagnetic context; display source Kp series when present | Kp is Earth-based context, not a lunar magnetic or surface measurement. |
| IPS | `NARRATIVE` | Interplanetary propagation/event-link context | Record association does not quantify a lunar environment or outpost impact. |
| FLR | Not mapped | No normalized event displayed | M0 could not verify a successful FLR response; no schema is invented. |

No mapping currently has `DIRECT` classification. No mapping creates a `DERIVED` observation. Any future derived value must name its formula and inputs. The game signal contains empty resource effects and zero crew/equipment deltas, enforced by the Phase 2 receiver. Source material: [NASA on flares and CMEs](https://science.nasa.gov/sun/solar-storms-and-flares/), [NASA on lunar astronaut radiation protection](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/), [NASA heliophysics vocabulary](https://science.nasa.gov/heliophysics/resources/vocabulary/), and [NOAA SWPC Planetary K index](https://www.swpc.noaa.gov/products/planetary-k-index).

## Verified replay records

Replay briefings use event IDs present in the captured M0 response fixtures:

- SEP: `2024-05-09T13:59:00-SEP-001`
- CME: `2024-05-08T05:36:00-CME-001`
- GST: `2024-05-10T15:00:00-GST-001`

They are NASA archive records, not newly generated observations. Selecting one sends only a sanitized, source-linked `GameSignal` into the simulator's context panel. The Phase 2 tests verify that the briefing does not change resources, crew, equipment, day progression, or game score. Records and capture methods are documented in [`PHASE3_M0_REPORT.md`](PHASE3_M0_REPORT.md), with raw bodies and sidecars in [`tests/fixtures/nasa/`](../tests/fixtures/nasa/).

## Gallery and attribution

The gallery uses the three genuine image results in `images-search-lunar-outpost.json`, their supplied medium image URLs, descriptions, NASA IDs, creators/credits and collection source links. It does not invent captions or credit text. NASA Images records are linked separately from DONKI records. Kp values in the sampled GST records identify NOAA as source; the interface attributes NOAA separately and does not consume a separate live NOAA feed. NASA does not endorse LUNAR OPS.

## Modes, cache and limitations

- `REPLAY` loads bundled NASA archive snapshots, regardless of browser connectivity.
- `OFFLINE` avoids API calls and uses cache/archive fallback.
- `LIVE` requests same-origin `/api` endpoints. The user runs the loopback server with a registered key for DONKI. Server transport applies bounded retries to network and eligible 5xx failures; 429 is surfaced with a cooldown and not immediately retried.
- Browser code never calls NASA directly with a credential. The Vite proxy is development-only; deployment needs a protected server-side API boundary and abuse controls.
- Cache freshness defaults to 15 minutes; stale cache content may be displayed while a background refresh runs. A rate-limit cooldown is respected.
- Snapshot coverage is a short May 2024 interval and one image query. It is not a live catalog or complete scientific dataset.
- The M0 report found browser-origin CORS behavior unverified. The application avoids relying on direct browser CORS by using same-origin proxy routes.
- Remote image rendering and links depend on NASA Images asset-host availability and were not validated in an end-user browser in this milestone.

## Validation coverage

`npm test` covers M0 fixture schemas and malformed records, nullable/missing fields, duplicate versions, normalized provenance, HTTP/network/timeout/JSON/rate-limit errors, bounded retries, cache and offline/replay paths, mapping constraints, replay IDs, signal isolation, gallery metadata, education/source attribution, and the existing Phase 2 deterministic simulation suite. `npm run build` checks the production bundle. Manual visual review and assistive-technology testing at target deployment sizes remain advisable; tests do not claim those checks occurred.
