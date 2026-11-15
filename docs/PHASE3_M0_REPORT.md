# Phase 3 Milestone 0 — NASA API verification and data discovery

**Verified:** 2026-11-15 (UTC response timestamps are recorded in fixture sidecars)
**Scope:** Source verification and genuine response snapshots only. No application, Phase 1, or Phase 2 behavior was changed.

## Repository inspection

The repository was clean on `main` at `b58ee9f` (`fix: scale emergency power with generator condition`), tracking `origin/main`. `README.md` describes the React/Vite application. Phase 2 logic is in `src/logic/engine.js` and `src/logic/events.js`; illustrative mission state is in `src/data/simulatedMission.js`, and the event catalog says those events are not lunar forecasts. No `docs/PHASE3_BLUEPRINT.md` was present. No NASA source data or API adapter existed before this work.

## DONKI verification

Server-side GET requests were made to `https://api.nasa.gov/DONKI/{FLR,CME,GST,SEP,IPS}` for `2024-05-08` through `2024-05-12`. All five returned HTTP 403 JSON `API_KEY_MISSING` without a key. Follow-up requests used NASA's public `DEMO_KEY` only for discovery; no credential value is recorded in any fixture or metadata. Four endpoints returned arrays of JSON observations. FLR returned HTTP 404 twice, including a wider `2024-05-01`–`2024-06-01` query.

| Endpoint | Result | Observed response fields and types |
|---|---|---|
| `GET /DONKI/FLR` | **Unverified / failed.** No-key: 403. With `DEMO_KEY`: 404 `Not Found`, path `/DONKI-API/get/FLR/` for both date ranges. NASA's API catalog lists the route, but no successful live schema was obtained. A 404 is not an empty result. | No event fields available. |
| `GET /DONKI/CME` | 200, JSON array; 20 records | Top-level fields: `activityID`, `catalog`, `startTime`, `instruments`, `sourceLocation`, `activeRegionNum`, `note`, `cmeAnalyses`, `linkedEvents`, `sentNotifications`, `link`, `submissionTime`, `versionId`. `activeRegionNum` was numeric in 9 records and JSON `null` in 11; `linkedEvents` was `null` in 11/20 and `sentNotifications` null in 10/20. Analysis entries included `time21_5`, `latitude`, `longitude`, `halfAngle`, `speed`, `type`, `featureCode`, `imageType`, `measurementTechnique`, `minorHalfWidth`, `speedMeasuredAtHeight`, `tilt`, `submissionTime`, `link`, `enlilList`; nested `minorHalfWidth`, `tilt`, and `kp_*` included nulls. |
| `GET /DONKI/GST` | 200, JSON array; 2 records | `gstID`, `startTime`, `allKpIndex`, `link`, `linkedEvents`, `sentNotifications`, `submissionTime`, `versionId`. Kp objects had numeric `kpIndex`, string `observedTime`, string `source` (observed `NOAA`). Linked-event objects contained `activityID`. |
| `GET /DONKI/SEP` | 200, JSON array; 8 records | `sepID`, `eventTime`, `instruments`, `link`, `linkedEvents`, `sentNotifications`, `submissionTime`, `versionId`. `sentNotifications` was null in 3/8. Instrument objects contained `displayName`; linked-event objects contained `activityID`. |
| `GET /DONKI/IPS` | 200, JSON array; 5 records | `catalog`, `activityID`, `location`, `eventTime`, `instruments`, `linkedEvents`, `sentNotifications`, `link`, `submissionTime`, `versionId`. `sentNotifications` was null in 3/5. |

For successful endpoints, `versionId` was an integer in every sampled record. `linkedEvents` appeared as either null or an array of `{ activityID }`; that catalog relation does not establish a gameplay effect. CME, GST, SEP and IPS use different ID fields in this sample (`activityID`, `gstID`, `sepID`), so an adapter must preserve source type and source ID. UTC-looking timestamps are strings ending in `Z`, but M1 schemas should validate rather than presume an invariant. These are observations from a bounded sample, not complete schemas.

NASA's API catalog lists all five DONKI routes. The no-key 403 responses corroborate the need for a key. NASA's published general limits are 1,000 requests/hour for a registered key and 30/hour plus 50/day per IP for `DEMO_KEY`; production should use a registered key managed server-side. Successful DONKI responses included `X-Ratelimit-Limit: 10`, changing `X-Ratelimit-Remaining`, and `X-Rate-Limit-Remaining` (118–119 observed). These response headers differ from the published general limits and may describe a separate gateway policy. Treat response headers and HTTP 429 as runtime signals; do not infer a stable quota from this single run. Error responses did not consistently include rate headers.

## NASA Image and Video Library verification

All requested routes returned HTTP 200 without an API key:

- `/search?q=lunar%20outpost&media_type=image&page_size=3` returned a JSON `collection`, `metadata.total_hits: 333`, and three page items. Metadata fields vary by item; observed keys included `nasa_id`, `title`, `description`, `description_508`, `date_created`, `media_type`, `center`, `keywords`, `photographer` or `secondary_creator`, and optional `album`/`location`. Genuine result `jsc2026e417568` is titled `Crewed Lunar Terrain Vehicle Testing`, has `media_type: image`, and credits `NASA/Bill Stafford` in its result description and `photographer` field.
- `/asset/jsc2026e417568` returned a JSON collection whose `items[].href` values include `~orig.jpeg`, `~large.jpg`, `~medium.jpg`, `~small.jpg`, `~thumb.jpg`, and a `metadata.json` asset.
- `/metadata/jsc2026e417568` returned `{ "location": "https://images-assets.nasa.gov/image/jsc2026e417568/metadata.json" }`. It points to metadata JSON rather than returning descriptive metadata inline.

## CORS and access

Server-side responses for DONKI and all three Image Library routes advertised `Access-Control-Allow-Origin: *`. Image API responses also advertised GET in `Access-Control-Allow-Methods`. A separate browser-origin check was attempted from a local Vite test page, but the in-app browser could not connect to the local origin. Thus actual browser `fetch` behavior is **unverified**; a response header observed server-side is not proof of a successful browser CORS request. Redirected image-host behavior is also unverified.

NASA's API authentication documentation describes API keys and published limits. Never place a NASA key in frontend code, a `VITE_*` variable, a committed fixture, or a public browser request URL. `DEMO_KEY` is rate-limited and was used only for verification. If a browser client later needs DONKI, use a small server-side proxy with a registered key held in server environment configuration, or a deliberate offline-only mode. Keep `.env` ignored and untracked.

## Captured fixtures

Each `.meta.json` sidecar records source endpoint, non-secret query parameters, retrieval date, status, content type, body size and returned headers. Raw bodies are saved as received; no API keys are stored.

- No-key DONKI errors: `donki-{flr,cme,gst,sep,ips}-2024-05-08-to-12.json` plus matching `.meta.json` (403).
- Keyed verification: `donki-{cme,gst,sep,ips}-2024-05-08-to-12-demokey-test.json` plus sidecars (200); `donki-flr-2024-05-08-to-12-demokey-test.json` plus sidecar (404).
- NASA Image Library: `images-search-lunar-outpost.json`, `images-asset-jsc2026e417568.json`, and `images-metadata-jsc2026e417568.json`, each with a `.meta.json` sidecar.

All are in [`tests/fixtures/nasa/`](../tests/fixtures/nasa/).

## Scientific limitations and M1 risks

DONKI records are heliophysics observations, analyses, model outputs or alerts with specific instruments, locations, times and uncertainty. They are not direct lunar-surface measurements. Do not translate a FLR, CME, GST, IPS or SEP record directly into lunar equipment damage, local lunar radiation dose, or game consequence. Earth Kp values are geomagnetic context, not a Moon-local condition. SEP may support radiation education, but a gameplay mapping would need defensible intensity, timing, spacecraft shielding, lunar location and exposure-dose sources and review. `linkedEvents` expresses catalog relations, not causality for a lunar outpost. Keep observed NASA data separate from simulation state and label any derived values with their calculation.

1. FLR returned repeatable 404 despite being listed in the NASA catalog. Recheck service health and schema before building its adapter; never convert the 404 to `[]` silently.
2. Direct browser CORS was not verified. Check on the intended deployed origin. Use a server-side DONKI key proxy by default.
3. Published quotas and live gateway headers differed. M1 needs timeout/retry/backoff and 429 handling, without assuming a stable quota.
4. Schemas must tolerate null/absent fields, mixed `activeRegionNum` values, variable image result metadata and revisions. Preserve `versionId`, `submissionTime`, source URL and provenance; define deduplication deliberately.
5. Asset/metadata links returned inside JSON use `http` URLs although the APIs were requested over HTTPS. Verify HTTPS asset availability and mixed-content behavior before using them in a secure page.
6. These snapshots cover a short date range and one image search, so they are provenance examples, not a complete schema corpus, production cache or NASA endorsement.

## Validation

- All captured fixture bodies and metadata parse as JSON.
- Browser-origin CORS: **not verified**, for the local connection reason above.
- Application tests: `npm test` passed (22 tests). `npm run build` passed; Vite emitted existing Framer Motion `use client` directive warnings while bundling. No application code was changed.

Sources: [NASA API authentication and rate limits](https://api.nasa.gov/assets/html/authentication.html), [NASA Open APIs catalog](https://api.nasa.gov/), [NASA Image and Video Library API documentation](https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf).
