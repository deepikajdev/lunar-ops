# Demo walkthrough

Use `npm install` and `npm run dev`, then open the Vite URL. The UI displays sample mission data and archived NASA records unless a server API is configured.

1. **Overview:** inspect the clearly simulated outpost snapshot. Open the mission details control and notifications. Use Roster and View activity log to visit the corresponding views.
2. **Life support:** inspect the four sample resource cards and existing demo alerts.
3. **Crew:** review the existing sample roster and status labels.
4. **Systems:** review the conceptual outpost illustration and sample mission alerts.
5. **Mission log:** review the static Phase 1 activity feed; it is not the simulator history.
6. **Survival sim:** select a daily decision and advance the existing deterministic game. Continue to a result and restart. Values are illustrative game rules.
7. **NASA Intelligence:** begin in REPLAY mode. Select a NASA record to inspect the timestamp, catalog link, linked IDs, provenance, and associated Kp chart if available. Use the gallery and science cards; select a verified archived briefing to attach an informational context card to the simulator.
8. For an offline check, choose OFFLINE. For LIVE, configure `NASA_API_KEY` in the server process, run `npm run api` and `npm run dev` in separate terminals, then choose LIVE. Without that setup, the UI falls back to cache/archive and labels the data source.

No NASA observation in this walkthrough changes simulator resources, crew health, equipment, or score.
