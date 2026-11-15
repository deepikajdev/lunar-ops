import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowUpRight, Clock3, Database, Radio, RefreshCw, Satellite, ShieldAlert } from 'lucide-react';
import { createEventRepository } from '../../nasa/repository.js';
import { mapEventToGameSignal } from '../../nasa/mappingRules.js';
import { NASA_REPLAY_SCENARIOS } from '../../nasa/replayScenarios.js';
import { getCuratedNasaImages } from '../../nasa/imageGallery.js';
import { EducationSources } from './EducationSources.jsx';
import { createRequestGate } from '../../nasa/requestGate.js';
import '../../styles/nasa.css';

const KpChart = lazy(() => import('./KpChart.jsx').then((module) => ({ default: module.KpChart })));

const kinds = ['cme', 'gst', 'sep', 'ips'];
const labels = { CME: 'Coronal mass ejection', GST: 'Geomagnetic storm', SEP: 'Solar energetic particles', IPS: 'Interplanetary shock' };
const repository = createEventRepository();
const curatedImages = getCuratedNasaImages();

function dateLabel(value) {
  if (!value) return 'Timestamp not supplied';
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
}

function provenanceLabel(event) {
  return event.provenance?.type === 'NASA_LIVE' ? 'NASA LIVE' : event.provenance?.type === 'NASA_ARCHIVE' ? 'NASA ARCHIVE' : event.provenance?.type;
}

function eventSubtitle(event) {
  const detail = event.regions?.sourceLocation || event.regions?.location || event.regions?.activeRegionNumber;
  return detail ? String(detail) : labels[event.eventType] || event.eventType;
}

export function SpaceWeatherView({ onSendSignal = () => {} }) {
  const [mode, setMode] = useState('REPLAY');
  const [events, setEvents] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const requestGate = useRef(createRequestGate());

  const load = useCallback(async (nextMode, refresh = false) => {
    const version = requestGate.current.begin();
    setBusy(true);
    setRefreshing(false);
    setNotice('');
    const settled = await Promise.allSettled(kinds.map((kind) => repository.getEvents(kind, { mode: nextMode, forceRefresh: refresh })));
    if (!requestGate.current.isCurrent(version)) return;
    const failures = settled.flatMap((item, index) => item.status === 'rejected' ? [{ eventKind: kinds[index], events: [], mode: 'OFFLINE', requestedMode: nextMode, delivery: 'UNAVAILABLE', lastFetchedAt: null, provenance: { type: 'SIMULATED' }, fallbackReason: item.reason?.code || 'NASA_REQUEST_FAILED' }] : []);
    const loaded = settled.flatMap((item, index) => item.status === 'fulfilled' ? [{ ...item.value, eventKind: kinds[index] }] : []);
    const combined = [...loaded, ...failures];
    const apply = (nextResults) => {
      const records = nextResults.flatMap((result) => result.events).sort((a, b) => (b.observedAt || '').localeCompare(a.observedAt || ''));
      setResults(nextResults);
      setEvents(records);
      setSelectedId((current) => records.some((event) => event.id === current) ? current : records[0]?.id ?? null);
    };
    apply(combined);
    setBusy(false);
    const background = loaded.filter((result) => result.refreshPromise);
    if (background.length) {
      setRefreshing(true);
      const refreshed = await Promise.allSettled(background.map((result) => result.refreshPromise));
      if (!requestGate.current.isCurrent(version)) return;
      const nextResults = [...combined];
      refreshed.forEach((item, index) => {
        const kind = background[index].eventKind;
        const resultIndex = nextResults.findIndex((result) => result.eventKind === kind);
        if (resultIndex < 0) return;
        if (item.status === 'fulfilled') nextResults[resultIndex] = { ...item.value, eventKind: kind };
        else nextResults[resultIndex] = { ...nextResults[resultIndex], refreshFailed: true, fallbackReason: item.reason?.code || 'NASA_REFRESH_FAILED' };
      });
      apply(nextResults);
      setRefreshing(false);
      if (refreshed.some((item) => item.status === 'fulfilled')) setUpdatedAt(new Date().toISOString());
    }
    if (failures.length || combined.some((result) => result.fallbackReason || result.refreshFailed)) setNotice('Some NASA sources could not refresh. Available cached or archived observations remain labeled by provenance.');
  }, []);

  useEffect(() => { load(mode); return () => { requestGate.current.invalidate(); }; }, [mode, load]);
  const selected = events.find((event) => event.id === selectedId) || null;
  const signal = selected ? mapEventToGameSignal(selected) : null;
  const kpData = useMemo(() => (selected?.eventType === 'GST' ? selected.magnitude.filter((item) => item.kind === 'KP_INDEX') : [])
    .map((item) => ({ time: item.observedAt.slice(11, 16), kp: item.value })), [selected]);
  const deliverySummary = [...new Set(results.map((result) => result.delivery).filter(Boolean))].join(' / ');
  const lastFetchedAt = results.map((result) => result.lastFetchedAt).filter(Boolean).sort().at(-1) ?? null;
  const hasStaleResults = results.some((result) => result.stale);

  return <div className="nasa-view">
    <header className="nasa-page-header">
      <div><p className="section-kicker">DATA INTELLIGENCE / SPACE WEATHER</p><h1>Solar environment</h1><p className="nasa-lede">NASA DONKI observations, presented with source context. Observations are informational and do not trigger simulator effects.</p></div>
      <div className="nasa-toolbar" aria-label="Observation controls">
        <label className="mode-control">DATA MODE <select value={mode} onChange={(event) => setMode(event.target.value)}><option value="LIVE">LIVE</option><option value="REPLAY">REPLAY</option><option value="OFFLINE">OFFLINE</option></select></label>
        <button className="nasa-refresh" type="button" onClick={() => load(mode, true)} disabled={busy || refreshing || mode !== 'LIVE'} title={mode === 'LIVE' ? 'Refresh NASA data' : 'Switch to LIVE to refresh'}><RefreshCw size={15} className={busy || refreshing ? 'spin' : ''} /> Refresh</button>
      </div>
    </header>

    <section className="nasa-status panel" aria-live="polite">
      <span className={`status-indicator ${mode === 'LIVE' && results.length > 0 && results.every((result) => result.delivery === 'NASA_LIVE') ? 'is-live' : ''}`}><i /> {mode}</span>
      <span><Database size={14} /> {deliverySummary.replaceAll('_', ' ') || 'LOADING OBSERVATIONS'}</span>
      <span><Clock3 size={14} /> LAST FETCHED {dateLabel(lastFetchedAt).replace(' UTC', '')}</span>
      <span className="nasa-refresh-state">{busy ? 'LOADING' : refreshing ? 'REFRESHING CACHED DATA' : updatedAt ? `UPDATED ${dateLabel(updatedAt).replace(' UTC', '')}` : hasStaleResults ? 'STALE CACHE' : 'CURRENT'}</span>
      <span className="nasa-status-note">NASA observations · educational use</span>
    </section>
    {notice && <p className="nasa-notice" role="status">{notice}</p>}

    <section className="nasa-summary-grid" aria-label="Observation categories">
      {kinds.map((kind, index) => {
        const count = events.filter((event) => event.eventType === kind.toUpperCase()).length;
        const Icon = [Satellite, Activity, ShieldAlert, Radio][index];
        return <article className="nasa-kind panel" key={kind}><span className="nasa-kind-icon"><Icon size={17} /></span><div><small>{labels[kind.toUpperCase()]}</small><strong>{count}</strong></div><span className="nasa-kind-unit">EVENTS</span></article>;
      })}
    </section>

    <div className="nasa-content-grid">
      <section className="panel nasa-timeline" aria-labelledby="timeline-title">
        <div className="panel-heading"><div><p className="section-kicker">NASA DONKI · CME / GST / SEP / IPS</p><h2 id="timeline-title">Observation timeline</h2></div><span className="nasa-count">{events.length} RECORDS</span></div>
        {busy && events.length === 0 ? <p className="nasa-empty">Loading observations…</p> : events.length ? <div className="event-list" role="list">{events.map((event) => <button type="button" role="listitem" key={event.id} className={`event-row ${selectedId === event.id ? 'selected' : ''}`} onClick={() => setSelectedId(event.id)} aria-pressed={selectedId === event.id}>
          <span className={`event-mark event-${event.eventType.toLowerCase()}`} />
          <span className="event-main"><strong>{event.eventType} <i>·</i> {event.sourceId}</strong><small>{eventSubtitle(event)}</small></span>
          <span className="event-date">{dateLabel(event.observedAt)}</span>
          <span className="event-source-badge">{provenanceLabel(event)}</span>
        </button>)}</div> : <p className="nasa-empty">No verified observations are available for this mode.</p>}
      </section>

      <aside className="panel nasa-detail" aria-labelledby="detail-title">
        <div className="panel-heading"><div><p className="section-kicker">SELECTED RECORD</p><h2 id="detail-title">Event detail</h2></div><span className="detail-mark"><Activity size={16} /></span></div>
        {selected ? <>
          <div className="detail-type"><span>{selected.eventType}</span><small>{labels[selected.eventType] || 'NASA DONKI observation'}</small></div>
          <dl className="detail-fields"><div><dt>OBSERVATION TIME</dt><dd>{dateLabel(selected.observedAt)}</dd></div><div><dt>SUBMITTED</dt><dd>{dateLabel(selected.submittedAt)}</dd></div><div><dt>LOCATION / REGION</dt><dd>{eventSubtitle(selected)}</dd></div><div><dt>VERSION</dt><dd>{selected.versionId ?? 'Not supplied'}</dd></div><div><dt>LINKED EVENTS</dt><dd>{selected.linkedEventIds?.length ? selected.linkedEventIds.join(', ') : 'None listed in this record'}</dd></div></dl>
          {signal && <div className="signal-context"><div><span>GAME CONTEXT · {signal.classification}</span><strong>{signal.title}</strong></div><p>{signal.message}</p><small>{signal.effects}</small><a href={signal.educationalSourceUrl} target="_blank" rel="noreferrer">Scientific context <ArrowUpRight size={12} /></a></div>}
          {kpData.length > 0 && <Suspense fallback={<p role="status">Loading Kp chart…</p>}><KpChart data={kpData} /></Suspense>}
          <div className="detail-provenance"><span>{provenanceLabel(selected)}</span><small>Retrieved {dateLabel(selected.retrievedAt || selected.provenance?.archivedAt)}</small><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Open NASA source <ArrowUpRight size={13} /></a></div>
        </> : <p className="nasa-empty">Select an observation to inspect its source details.</p>}
      </aside>
    </div>
    <section className="nasa-scenarios" aria-labelledby="scenario-title"><div className="panel-heading"><div><p className="section-kicker">VERIFIED NASA ARCHIVE · MAY 2024</p><h2 id="scenario-title">Replay a context briefing</h2></div><span className="nasa-count">3 ARCHIVED EVENTS</span></div><p>Choose a verified archived observation to attach a source-linked briefing to the survival simulator. The observation will not change game resources, health, or equipment.</p><div className="scenario-grid">{NASA_REPLAY_SCENARIOS.map((scenario) => <article className="panel scenario-card" key={scenario.id}><span>{scenario.signal.classification} CONTEXT</span><h3>{scenario.title}</h3><p>{scenario.description}</p><small>{scenario.eventId}</small><button type="button" onClick={() => onSendSignal(scenario.signal)}>Send context to Survival sim</button></article>)}</div></section>
    <section className="nasa-gallery" aria-labelledby="gallery-title"><div className="panel-heading"><div><p className="section-kicker">NASA IMAGE AND VIDEO LIBRARY · CAPTURED SEARCH</p><h2 id="gallery-title">Lunar exploration gallery</h2></div><a href="https://images.nasa.gov/" target="_blank" rel="noreferrer">NASA Images <ArrowUpRight size={13} /></a></div><p>Curated from the genuine “lunar outpost” NASA Images response captured for M0. Credits and source records are shown with every item.</p><div className="gallery-grid">{curatedImages.map((item) => <article className="panel gallery-card" key={item.nasaId}><a className="gallery-image-link" href={item.sourceUrl} target="_blank" rel="noreferrer"><img src={item.imageUrl} alt={item.title} loading="lazy" /><span>{item.mediaType.toUpperCase()}</span></a><div className="gallery-copy"><h3>{item.title}</h3><p>{item.description}</p><small>Credit: {item.credit}{item.dateCreated ? ` · ${item.dateCreated.slice(0, 10)}` : ''}</small><a href={item.sourceUrl} target="_blank" rel="noreferrer">View NASA source <ArrowUpRight size={12} /></a></div></article>)}</div></section>
    <EducationSources />
    <footer className="nasa-attribution">Data source: <a href="https://api.nasa.gov/" target="_blank" rel="noreferrer">NASA Open APIs · DONKI</a>. NASA does not endorse LUNAR OPS. Space weather observations are not direct measurements of outpost equipment conditions.</footer>
  </div>;
}
