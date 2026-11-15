import test from 'node:test';
import assert from 'node:assert/strict';
import { ABOUT_SOURCES, SPACE_WEATHER_CARDS } from './spaceWeatherEducation.js';

test('education cards cover flares, CMEs, SEPs and Earth geomagnetic context with linked primary sources', () => {
  assert.deepEqual(SPACE_WEATHER_CARDS.map((card) => card.id), ['flares', 'cmes', 'seps', 'geomagnetic-storms']);
  for (const card of SPACE_WEATHER_CARDS) assert.match(card.sourceUrl, /^https:\/\//);
  assert.match(SPACE_WEATHER_CARDS.find((card) => card.id === 'seps').body, /not a lunar dose estimate/);
  assert.match(SPACE_WEATHER_CARDS.find((card) => card.id === 'geomagnetic-storms').body, /not a lunar environment measurement/);
});

test('sources separately attribute NASA observations and NOAA Kp context', () => {
  assert.ok(ABOUT_SOURCES.some((source) => source.name === 'NASA DONKI'));
  const noaa = ABOUT_SOURCES.find((source) => source.name.includes('NOAA'));
  assert.match(noaa.scope, /No separate live NOAA feed/);
});
