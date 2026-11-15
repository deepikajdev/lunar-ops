# Manual QA and screenshot checklist

## Confirmed browser smoke-test result

**PASS — owner-confirmed manual browser testing.** The project owner confirmed that manual browser testing passed. The browser/version, viewport sizes, and individually tested flows were not supplied, so this records only the aggregate smoke-test result. The detailed checks below remain unchecked unless separately verified.

This browser result is separate from the automated Node.js test suite run with `npm test`; neither result should be inferred from the other.

## Journeys

- [ ] Overview loads with sample-data labels; open and close mission details and notifications using mouse and keyboard.
- [ ] Roster opens Crew; activity-log action opens Mission log; notification action opens Systems.
- [ ] Every sidebar destination renders unique relevant content, sets the current item, and remains keyboard-operable at desktop and mobile widths.
- [ ] Life support shows Oxygen, Water, Power, and Food cards; Crew uses the existing demo roster; Systems and Mission log labels disclose sample/static content.
- [ ] Survival sim: start, select a decision, advance days, observe resources/event changes, reach a result, verify score, restart, and replay an archived context briefing. Confirm NASA briefing changes no game resource or health.
- [ ] NASA Intelligence: REPLAY is archived; OFFLINE makes no API request; LIVE with API configured; LIVE with API unavailable; force refresh; cached refresh success/failure; one event category failing while others succeed; mode change during in-flight request; navigate away during refresh.
- [ ] Inspect timeline selection, empty states, error status, source links, archive/live badges, Kp values/table/UTC labels, image credits, education links, and source attribution.
- [ ] Keyboard: Tab/Shift+Tab through navigation and controls; Enter/Space activate; Escape closes mission and notification panels; verify focus remains usable after closing.
- [ ] Use a screen reader to check active navigation, dialogs/popovers, chart summary/table, image alternatives, and status announcements.
- [ ] Test widths 1440px, 1024px, 768px, and 390px; check horizontal overflow, collapsed nav labels/tooltips, panel order, and image wrapping.
- [ ] Enable OS reduced-motion preference and confirm Framer Motion and CSS movement is reduced.

## Screenshot capture checklist

- [ ] Overview at desktop width, with no open overlay.
- [ ] Overview at mobile width with collapsed navigation.
- [ ] Crew and Life support destination views.
- [ ] Survival sim decision state and mission result state.
- [ ] NASA REPLAY timeline/detail with archive provenance and the Kp chart/table where available.
- [ ] NASA gallery showing the supplied credit line.
- [ ] Notifications and mission details panels, if screenshots of controls are needed.

Capture genuine browser screenshots after deployment/local browser review; do not synthesize or imply live NASA data when using bundled replay records.
