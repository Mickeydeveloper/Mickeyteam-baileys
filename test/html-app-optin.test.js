import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BRAND_BANNER_MESSAGE,
  buildBrandBanner,
  htmlSupported,
  maybeLogBrandBanner,
  richSupported,
} from '../lib/Utils/html-app.js';

test('rich and html capability helpers are enabled', () => {
  assert.equal(richSupported(), true);
  assert.equal(htmlSupported(), true);
});

test('brand banner defaults and opt-in behavior work as expected', () => {
  const events = [];
  const logger = {
    info: (...args) => events.push(args)
  };

  assert.equal(maybeLogBrandBanner(logger, { branding: false }), false);
  assert.deepEqual(events, []);

  assert.equal(maybeLogBrandBanner(logger, { branding: true }), true);
  assert.equal(events.length, 1);
  assert.equal(events[0][0], BRAND_BANNER_MESSAGE);

  const custom = 'CUSTOM SUPPORT TEXT';
  assert.equal(maybeLogBrandBanner(logger, { branding: { message: custom } }), true);
  assert.equal(events.at(-1)[0], custom);

  assert.equal(buildBrandBanner('   '), BRAND_BANNER_MESSAGE);
});
