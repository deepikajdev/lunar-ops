import { NasaApiError } from './errors.js';
import { validateDonkiPayload } from './schemas.js';

const EVENT_IDS = Object.freeze({ cme: 'activityID', gst: 'gstID', sep: 'sepID', ips: 'activityID' });
const EVENT_TIMES = Object.freeze({ cme: 'startTime', gst: 'startTime', sep: 'eventTime', ips: 'eventTime' });

function parsedTimestamp(value, field, required = false) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new Error(`${field} is required.`);
    return null;
  }
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) throw new Error(`${field} is not a valid timestamp.`);
  return new Date(milliseconds).toISOString();
}

function measurementsFor(kind, record) {
  if (kind === 'cme') {
    return (record.cmeAnalyses ?? []).map((analysis) => ({
      kind: 'CME_ANALYSIS',
      ...(analysis.speed === undefined || analysis.speed === null ? {} : { speedKmPerSecond: analysis.speed }),
      ...(analysis.latitude === undefined || analysis.latitude === null ? {} : { latitude: analysis.latitude }),
      ...(analysis.longitude === undefined || analysis.longitude === null ? {} : { longitude: analysis.longitude }),
      ...(analysis.halfAngle === undefined || analysis.halfAngle === null ? {} : { halfAngleDegrees: analysis.halfAngle }),
      ...(analysis.time21_5 ? { measuredAt: analysis.time21_5 } : {}),
      ...(analysis.link ? { sourceUrl: analysis.link } : {}),
      ...(analysis.isMostAccurate === undefined ? {} : { isMostAccurate: analysis.isMostAccurate }),
    }));
  }
  if (kind === 'gst') {
    return (record.allKpIndex ?? []).map((measurement) => ({
      kind: 'KP_INDEX',
      value: measurement.kpIndex,
      observedAt: measurement.observedTime,
      source: measurement.source,
    }));
  }
  return [];
}

function normalizeRecord(kind, record, provenance) {
  const sourceId = record[EVENT_IDS[kind]];
  const observedAt = parsedTimestamp(record[EVENT_TIMES[kind]], EVENT_TIMES[kind]);
  const submittedAt = parsedTimestamp(record.submissionTime, 'submissionTime');
  const id = `${kind.toUpperCase()}:${sourceId}`;
  const sourceUrl = typeof record.link === 'string' ? record.link : provenance.sourceUrl;
  return {
    id,
    eventType: kind.toUpperCase(),
    sourceId,
    observedAt,
    submittedAt,
    magnitude: measurementsFor(kind, record),
    regions: {
      ...(record.sourceLocation === undefined ? {} : { sourceLocation: record.sourceLocation }),
      ...(record.activeRegionNum === undefined ? {} : { activeRegionNumber: record.activeRegionNum }),
      ...(record.location === undefined ? {} : { location: record.location }),
    },
    linkedEventIds: record.linkedEvents === undefined ? null : record.linkedEvents === null ? null : record.linkedEvents.map((event) => event.activityID),
    versionId: record.versionId ?? null,
    source: 'NASA DONKI',
    sourceUrl,
    provenance,
    retrievedAt: provenance.retrievedAt ?? provenance.archivedAt,
    sourceRecord: record,
  };
}

function revisionRank(event) {
  return [event.versionId ?? Number.NEGATIVE_INFINITY, event.submittedAt ? Date.parse(event.submittedAt) : Number.NEGATIVE_INFINITY];
}

function compareRevisions(left, right) {
  const [leftVersion, leftSubmission] = revisionRank(left);
  const [rightVersion, rightSubmission] = revisionRank(right);
  return leftVersion - rightVersion || leftSubmission - rightSubmission;
}

/** Validates each record independently, groups revisions, and preserves every raw source record. */
export function normalizeDonkiEvents(kind, records, provenance) {
  if (!EVENT_IDS[kind]) throw new NasaApiError('NASA_SCHEMA_UNVERIFIED', `No normalized schema exists for DONKI ${String(kind).toUpperCase()}.`);
  if (!provenance || !['NASA_LIVE', 'NASA_ARCHIVE'].includes(provenance.type)) {
    throw new TypeError('DONKI normalization requires NASA_LIVE or NASA_ARCHIVE provenance.');
  }
  if (!Array.isArray(records)) {
    return { events: [], rejected: [{ index: null, reason: 'Payload must be an array.', sourceRecord: records }] };
  }

  const rejected = [];
  const groups = new Map();
  records.forEach((record, index) => {
    try {
      validateDonkiPayload(kind, [record]);
      const event = normalizeRecord(kind, record, provenance);
      const revisions = groups.get(event.id) ?? [];
      revisions.push(event);
      groups.set(event.id, revisions);
    } catch (error) {
      rejected.push({ index, reason: error.message, sourceRecord: record });
    }
  });

  const events = [...groups.values()].map((revisions) => {
    revisions.sort(compareRevisions);
    const current = revisions.at(-1);
    return {
      ...current,
      revisionHistory: revisions.map(({ versionId, submittedAt, sourceRecord, sourceUrl }) => ({ versionId, submittedAt, sourceRecord, sourceUrl })),
    };
  }).sort((left, right) => {
    const leftTime = left.observedAt ? Date.parse(left.observedAt) : Number.POSITIVE_INFINITY;
    const rightTime = right.observedAt ? Date.parse(right.observedAt) : Number.POSITIVE_INFINITY;
    return leftTime - rightTime || left.id.localeCompare(right.id);
  });

  return { events, rejected };
}

export function assertValidEventTimestamp(value, field = 'timestamp') {
  return parsedTimestamp(value, field, true);
}
