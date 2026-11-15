import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

test('NASA Intelligence renders its initial REPLAY status without a runtime reference error', async (t) => {
  const vite = await createServer({
    configFile: './vite.config.js',
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  });
  t.after(() => vite.close());

  const { SpaceWeatherView } = await vite.ssrLoadModule('/src/components/nasa/SpaceWeatherView.jsx');
  const html = renderToString(createElement(SpaceWeatherView));

  assert.match(html, /Solar environment/);
  assert.match(html, /REPLAY/);
  assert.match(html, /CURRENT/);
});
