import { NasaApiError } from './errors.js';

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isString = (value) => typeof value === 'string';
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const isInteger = (value) => Number.isInteger(value);
const isBoolean = (value) => typeof value === 'boolean';
const isArray = (value) => Array.isArray(value);
const isNullable = (check) => (value) => value === null || check(value);
const arrayOf = (check) => (value) => isArray(value) && value.every(check);
const objectWith = (required, optional = {}) => (value) => isObject(value)
  && Object.entries(required).every(([key, check]) => check(value[key]))
  && Object.entries(optional).every(([key, check]) => value[key] === undefined || check(value[key]));

const stringArray = arrayOf(isString);
const instruments = arrayOf(objectWith({ displayName: isString }));
const linkedEvents = isNullable(arrayOf(objectWith({ activityID: isString })));
const notifications = isNullable(arrayOf(objectWith({
  messageID: isString,
  messageIssueTime: isString,
  messageURL: isString,
})));
const cmeAnalysis = objectWith({
  isMostAccurate: isBoolean,
  levelOfData: isNumber,
  submissionTime: isString,
  link: isString,
}, {
  time21_5: isString,
  latitude: isNullable(isNumber),
  longitude: isNullable(isNumber),
  halfAngle: isNullable(isNumber),
  speed: isNullable(isNumber),
  type: isString,
  featureCode: isString,
  imageType: isString,
  measurementTechnique: isString,
  note: isString,
  minorHalfWidth: isNullable(isNumber),
  speedMeasuredAtHeight: isNullable(isNumber),
  tilt: isNullable(isNumber),
  enlilList: arrayOf(isObject),
});

export const DONKI_SCHEMAS = Object.freeze({
  cme: arrayOf(objectWith({
    activityID: isString,
    startTime: isString,
    submissionTime: isString,
    link: isString,
    versionId: isInteger,
  }, {
    catalog: isString,
    instruments,
    sourceLocation: isString,
    activeRegionNum: isNullable(isNumber),
    note: isString,
    cmeAnalyses: arrayOf(cmeAnalysis),
    linkedEvents,
    sentNotifications: notifications,
  })),
  gst: arrayOf(objectWith({
    gstID: isString,
    startTime: isString,
    submissionTime: isString,
    link: isString,
    versionId: isInteger,
    allKpIndex: arrayOf(objectWith({ kpIndex: isNumber, observedTime: isString, source: isString })),
  }, { linkedEvents, sentNotifications: notifications })),
  sep: arrayOf(objectWith({
    sepID: isString,
    eventTime: isString,
    submissionTime: isString,
    link: isString,
    versionId: isInteger,
    instruments,
  }, { linkedEvents, sentNotifications: notifications })),
  ips: arrayOf(objectWith({
    activityID: isString,
    eventTime: isString,
    location: isString,
    submissionTime: isString,
    link: isString,
    versionId: isInteger,
    instruments,
  }, { catalog: isString, linkedEvents, sentNotifications: notifications })),
});

const imageData = objectWith({ nasa_id: isString, title: isString, media_type: isString }, {
  description: isString,
  description_508: isString,
  date_created: isString,
  center: isString,
  keywords: stringArray,
  photographer: isString,
  secondary_creator: isString,
  album: stringArray,
  location: isString,
});

export const IMAGE_SCHEMAS = Object.freeze({
  search: objectWith({
    collection: objectWith({
      items: arrayOf(objectWith({ data: arrayOf(imageData) }, { href: isString })),
      metadata: objectWith({ total_hits: isInteger }),
    }),
  }),
  asset: objectWith({
    collection: objectWith({
      href: isString,
      items: arrayOf(objectWith({ href: isString })),
    }, { version: isString }),
  }),
  metadata: objectWith({ location: isString }),
});

export function validatePayload(schema, payload, label) {
  if (!schema(payload)) {
    throw new NasaApiError('NASA_INVALID_RESPONSE_SCHEMA', `${label} response did not match the verified M0 schema.`, {
      details: { schema: label },
    });
  }
  return payload;
}

export function parseJsonResponse(text, label = 'NASA') {
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new NasaApiError('NASA_INVALID_JSON', `${label} returned invalid JSON.`, { cause });
  }
}

export function validateDonkiPayload(kind, payload) {
  const schema = DONKI_SCHEMAS[kind];
  if (!schema) throw new NasaApiError('NASA_SCHEMA_UNVERIFIED', `No verified response schema exists for DONKI ${kind.toUpperCase()}.`);
  return validatePayload(schema, payload, `DONKI ${kind.toUpperCase()}`);
}

export function validateImagePayload(kind, payload) {
  const schema = IMAGE_SCHEMAS[kind];
  if (!schema) throw new NasaApiError('NASA_INVALID_REQUEST', `Unsupported NASA Images operation: ${kind}.`);
  return validatePayload(schema, payload, `NASA Images ${kind}`);
}
