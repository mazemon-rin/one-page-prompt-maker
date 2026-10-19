import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyAnalyticsConsent,
  createAnalyticsFlowTracker,
  initializeAnalytics,
  isAnalyticsAllowed,
  readAnalyticsConsent,
  safePageLocation,
  safePageReferrer,
  trackAnalyticsEvent
} from '../src/analytics.mjs';
import { ANALYTICS_CONSENT_KEY, ANALYTICS_FLOW_KEY, GA4_ALLOWED_HOSTS, GA4_MEASUREMENT_ID } from '../src/analytics-config.mjs';

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

function fakeBrowser(hostname = GA4_ALLOWED_HOSTS[0]) {
  const scripts = [];
  const cookieWrites = [];
  let cookieValue = '';
  const documentObject = {
    referrer: 'https://note.com/article?email=private@example.com',
    head: { appendChild: (script) => scripts.push(script) },
    createElement: () => ({ dataset: {} })
  };
  Object.defineProperty(documentObject, 'cookie', {
    get: () => cookieValue,
    set: (value) => {
      cookieWrites.push(value);
      const [name, assignedValue] = value.split('=', 2);
      if (value.includes('Max-Age=0')) {
        cookieValue = cookieValue.split(';').map((part) => part.trim()).filter((part) => part.split('=')[0] !== name).join('; ');
      } else if (assignedValue !== undefined) {
        cookieValue = cookieValue ? `${cookieValue}; ${value}` : value;
      }
    }
  });
  const windowObject = {};
  return {
    documentObject,
    locationObject: { hostname, href: `https://${hostname}/?topic=private&utm_source=threads&utm_medium=social#step1` },
    scripts,
    cookieWrites,
    windowObject
  };
}

test('consent is stored separately from the existing app data key', () => {
  const storage = new MemoryStorage();
  storage.setItem('one-page-prompt-maker-ver01', '{"draft":{}}');

  assert.equal(applyAnalyticsConsent('denied', { storage }), true);
  assert.equal(readAnalyticsConsent(storage), 'denied');
  assert.equal(storage.getItem('one-page-prompt-maker-ver01'), '{"draft":{}}');
  assert.equal(storage.getItem(ANALYTICS_CONSENT_KEY), 'denied');
});

test('an unset or denied consent does not initialize the tag or send events', () => {
  const storage = new MemoryStorage();
  const browser = fakeBrowser();
  assert.equal(initializeAnalytics({ consent: null, ...browser }), false);
  assert.equal(browser.scripts.length, 0);
  assert.equal(browser.windowObject.dataLayer, undefined);
  assert.equal(trackAnalyticsEvent('app_start', { consent: null, hostname: browser.locationObject.hostname, windowObject: browser.windowObject }), false);

  assert.equal(applyAnalyticsConsent('denied', { storage, ...browser }), true);
  assert.equal(browser.scripts.length, 0);
  assert.equal(browser.windowObject.dataLayer, undefined);
  assert.equal(trackAnalyticsEvent('prompt_generated', { consent: 'denied', hostname: browser.locationObject.hostname, windowObject: browser.windowObject }), false);
});

test('an unavailable consent store fails closed and does not initialize GA4', () => {
  const browser = fakeBrowser();
  const blockedStorage = { setItem() { throw new Error('storage blocked'); } };

  assert.equal(applyAnalyticsConsent('granted', { storage: blockedStorage, ...browser }), false);
  assert.equal(browser.scripts.length, 0);
  assert.equal(browser.windowObject.dataLayer, undefined);
});

test('the exact production host loads GA4 once after explicit consent', () => {
  const storage = new MemoryStorage();
  const browser = fakeBrowser();
  assert.equal(applyAnalyticsConsent('granted', { storage, ...browser }), true);
  assert.equal(browser.scripts.length, 1);
  assert.equal(browser.scripts[0].src, `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`);
  assert.equal(browser.windowObject.__matomeGa4Loaded, true);

  const configCall = browser.windowObject.dataLayer.find((args) => args[0] === 'config');
  assert.equal(configCall[1], GA4_MEASUREMENT_ID);
  assert.equal(configCall[2].send_page_view, true);
  assert.equal(configCall[2].allow_google_signals, false);
  assert.equal(configCall[2].allow_ad_personalization_signals, false);
  assert.equal(configCall[2].page_location, `https://${GA4_ALLOWED_HOSTS[0]}/?utm_source=threads&utm_medium=social`);
  assert.equal(configCall[2].page_referrer, 'https://note.com');

  assert.equal(initializeAnalytics({ consent: 'granted', ...browser }), true);
  assert.equal(browser.scripts.length, 1);
  assert.equal(readAnalyticsConsent(storage), 'granted');
});

test('localhost, aliases, preview and individual deployment hosts never load GA4', () => {
  const excludedHosts = [
    'localhost',
    '127.0.0.1',
    'matome-ai-self.vercel.app',
    'matome-ai-git-main-mazemonrin.vercel.app',
    'matome-ai-pr-123-mazemonrin.vercel.app',
    'matome-abc123-mazemonrin.vercel.app',
    'matome-ai-mazemonrin.vercel.app.attacker.example'
  ];
  for (const hostname of excludedHosts) {
    const browser = fakeBrowser(hostname);
    assert.equal(isAnalyticsAllowed(hostname, 'granted'), false, hostname);
    assert.equal(initializeAnalytics({ consent: 'granted', ...browser }), false, hostname);
    assert.equal(browser.scripts.length, 0, hostname);
    assert.equal(browser.windowObject.dataLayer, undefined, hostname);
  }
});

test('page URLs retain only allow-listed attribution tags and referrer origin', () => {
  assert.equal(
    safePageLocation('https://matome-ai-mazemonrin.vercel.app/?topic=private&utm_source=Threads&utm_medium=SOCIAL&utm_campaign=private#result'),
    'https://matome-ai-mazemonrin.vercel.app/?utm_source=threads&utm_medium=social'
  );
  assert.equal(safePageLocation('https://matome-ai-mazemonrin.vercel.app/?utm_source=note.com&utm_medium=social'), 'https://matome-ai-mazemonrin.vercel.app/?utm_medium=social');
  assert.equal(safePageLocation('not a URL'), '');
  assert.equal(safePageReferrer('https://note.com/article/private?email=person@example.com'), 'https://note.com');
  assert.equal(safePageReferrer(''), '');
});

test('custom events carry only their event name and are gated by consent and hostname', () => {
  const browser = fakeBrowser();
  initializeAnalytics({ consent: 'granted', ...browser });
  for (const name of ['app_start', 'prompt_generated', 'prompt_copied']) {
    assert.equal(trackAnalyticsEvent(name, { consent: 'granted', hostname: browser.locationObject.hostname, windowObject: browser.windowObject }), true);
  }
  const eventCalls = browser.windowObject.dataLayer.filter((args) => args[0] === 'event');
  assert.deepEqual(eventCalls.map((args) => [...args]), [
    ['event', 'app_start'],
    ['event', 'prompt_generated'],
    ['event', 'prompt_copied']
  ]);
  assert.equal(trackAnalyticsEvent('other_event', { consent: 'granted', hostname: browser.locationObject.hostname, windowObject: browser.windowObject }), false);
  assert.equal(trackAnalyticsEvent('app_start', { consent: 'granted', hostname: 'localhost', windowObject: browser.windowObject }), false);
});

test('withdrawing consent disables future collection and tries to clear GA cookies', () => {
  const storage = new MemoryStorage();
  const browser = fakeBrowser();
  applyAnalyticsConsent('granted', { storage, ...browser });
  browser.documentObject.cookie = '_ga=old; _ga_J5808LGQBY=state; other=value';
  browser.cookieWrites.length = 0;

  applyAnalyticsConsent('denied', { storage, ...browser });

  assert.equal(browser.windowObject[`ga-disable-${GA4_MEASUREMENT_ID}`], true);
  assert.equal(readAnalyticsConsent(storage), 'denied');
  assert.deepEqual(browser.cookieWrites, [
    '_ga=; Max-Age=0; path=/; SameSite=Lax',
    '_ga_J5808LGQBY=; Max-Age=0; path=/; SameSite=Lax'
  ]);
  assert.equal(trackAnalyticsEvent('prompt_copied', { consent: 'denied', hostname: browser.locationObject.hostname, windowObject: browser.windowObject }), false);
});

test('flow events are deduplicated per session flow and prompt revision', () => {
  const storage = new MemoryStorage();
  const events = [];
  let nextId = 0;
  const makeTracker = () => createAnalyticsFlowTracker({ storage, emit: (name) => events.push(name), makeId: () => `flow-${++nextId}` });
  let tracker = makeTracker();

  assert.equal(tracker.start(), true);
  assert.equal(tracker.start(), false);
  assert.equal(tracker.promptGenerated(), true);
  assert.equal(tracker.promptGenerated(), false);
  tracker.markChanged();
  assert.equal(tracker.promptGenerated(), true);

  tracker = makeTracker();
  assert.equal(tracker.promptGenerated(), false);
  tracker.markChanged();
  assert.equal(tracker.promptGenerated(), true);
  assert.deepEqual(events, ['app_start', 'prompt_generated', 'prompt_generated', 'prompt_generated']);

  tracker.reset();
  assert.equal(storage.getItem(ANALYTICS_FLOW_KEY), null);
  assert.equal(tracker.start(), true);
  assert.equal(events.at(-1), 'app_start');
});

test('the consent flow can still be changed to denied after GA4 was initialized', () => {
  const storage = new MemoryStorage();
  const browser = fakeBrowser();
  applyAnalyticsConsent('granted', { storage, ...browser });
  assert.equal(browser.scripts.length, 1);

  assert.equal(applyAnalyticsConsent('denied', { storage, ...browser }), true);
  assert.equal(browser.scripts.length, 1);
  assert.equal(readAnalyticsConsent(storage), 'denied');
  assert.equal(browser.windowObject[`ga-disable-${GA4_MEASUREMENT_ID}`], true);
});
