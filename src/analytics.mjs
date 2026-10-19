import {
  ANALYTICS_CONSENT_KEY,
  ANALYTICS_FLOW_KEY,
  GA4_ALLOWED_HOSTS,
  GA4_MEASUREMENT_ID
} from './analytics-config.mjs';

const EVENTS = new Set(['app_start', 'prompt_generated', 'prompt_copied']);
const SAFE_UTM_VALUES = Object.freeze({
  utm_source: new Set(['threads', 'note']),
  utm_medium: new Set(['social', 'referral'])
});

function browserStorage(name) {
  try {
    return globalThis[name] ?? null;
  } catch {
    return null;
  }
}

export function readAnalyticsConsent(storage = browserStorage('localStorage')) {
  try {
    const value = storage?.getItem(ANALYTICS_CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

export function saveAnalyticsConsent(value, storage = browserStorage('localStorage')) {
  if (value !== 'granted' && value !== 'denied') return false;
  try {
    if (!storage) return false;
    storage.setItem(ANALYTICS_CONSENT_KEY, value);
    return true;
  } catch {
    return false;
  }
}

export function isAnalyticsAllowed(hostname, consent = readAnalyticsConsent()) {
  return consent === 'granted' && GA4_ALLOWED_HOSTS.includes(hostname);
}

/** Keep only known, non-user-specific source tags in the page URL. */
export function safePageLocation(href) {
  try {
    const url = new URL(href);
    const safeParams = new URLSearchParams();
    for (const [key, allowedValues] of Object.entries(SAFE_UTM_VALUES)) {
      const values = url.searchParams.getAll(key);
      if (values.length === 1 && allowedValues.has(values[0].toLowerCase())) {
        safeParams.set(key, values[0].toLowerCase());
      }
    }
    url.search = safeParams.toString();
    url.hash = '';
    return url.href;
  } catch {
    return '';
  }
}

/** Referrer hostname is enough for source attribution; omit path and query. */
export function safePageReferrer(referrer) {
  try {
    return referrer ? new URL(referrer).origin : '';
  } catch {
    return '';
  }
}

export function initializeAnalytics(options = {}) {
  const consent = options.consent ?? readAnalyticsConsent();
  const windowObject = options.windowObject ?? globalThis.window;
  const documentObject = options.documentObject ?? globalThis.document;
  const locationObject = options.locationObject ?? globalThis.location;
  const hostname = options.hostname ?? locationObject?.hostname;
  const href = options.href ?? locationObject?.href;
  const referrer = options.referrer ?? documentObject?.referrer;
  if (!isAnalyticsAllowed(hostname, consent) || !windowObject || !documentObject?.head) return false;

  const disabledFlag = `ga-disable-${GA4_MEASUREMENT_ID}`;
  windowObject[disabledFlag] = false;

  if (windowObject.__matomeGa4Loaded) {
    windowObject.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    return true;
  }

  windowObject.dataLayer = windowObject.dataLayer || [];
  windowObject.gtag = windowObject.gtag || function gtag() {
    windowObject.dataLayer.push(arguments);
  };
  windowObject.gtag('js', new Date());
  windowObject.gtag('config', GA4_MEASUREMENT_ID, {
    send_page_view: true,
    page_location: safePageLocation(href || ''),
    page_referrer: safePageReferrer(referrer || ''),
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  const script = documentObject.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  script.dataset.matomeGa4 = 'true';
  documentObject.head.appendChild(script);
  windowObject.__matomeGa4Loaded = true;
  return true;
}

function clearAnalyticsCookies(documentObject) {
  try {
    const names = String(documentObject.cookie || '')
      .split(';')
      .map((part) => part.trim().split('=')[0])
      .filter((name) => name === '_ga' || name.startsWith('_ga_'));
    for (const name of names) {
      documentObject.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    }
  } catch {
    // Cookie access can be unavailable; future GA loading remains disabled.
  }
}

export function disableAnalytics({
  windowObject = globalThis.window,
  documentObject = globalThis.document
} = {}) {
  if (windowObject) {
    windowObject[`ga-disable-${GA4_MEASUREMENT_ID}`] = true;
    if (windowObject.__matomeGa4Loaded) {
      windowObject.gtag?.('consent', 'update', { analytics_storage: 'denied' });
    }
  }
  if (documentObject) clearAnalyticsCookies(documentObject);
}

export function applyAnalyticsConsent(value, options = {}) {
  const storage = options.storage ?? browserStorage('localStorage');
  if (!saveAnalyticsConsent(value, storage)) return false;
  if (value === 'granted') {
    initializeAnalytics({ ...options, consent: value });
  } else {
    disableAnalytics(options);
  }
  return true;
}

export function trackAnalyticsEvent(name, {
  consent = readAnalyticsConsent(),
  hostname = globalThis.location?.hostname,
  windowObject = globalThis.window
} = {}) {
  if (!EVENTS.has(name) || !isAnalyticsAllowed(hostname, consent) || !windowObject?.__matomeGa4Loaded) return false;
  if (windowObject[`ga-disable-${GA4_MEASUREMENT_ID}`] === true || typeof windowObject.gtag !== 'function') return false;
  windowObject.gtag('event', name);
  return true;
}

function readFlowState(storage) {
  try {
    const parsed = JSON.parse(storage?.getItem(ANALYTICS_FLOW_KEY) || 'null');
    if (parsed && typeof parsed.flowId === 'string') {
      return {
        flowId: parsed.flowId,
        revision: Number.isInteger(parsed.revision) ? parsed.revision : 0,
        generatedRevision: Number.isInteger(parsed.generatedRevision) ? parsed.generatedRevision : -1
      };
    }
  } catch {
    // A missing or unreadable session marker only weakens de-duplication.
  }
  return { flowId: '', revision: 0, generatedRevision: -1 };
}

function createFlowId() {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch {
    // Use a non-identifying random fallback if crypto is unavailable.
  }
  return `flow-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Session-only markers deduplicate events without putting model data in analytics. */
export function createAnalyticsFlowTracker({
  storage = browserStorage('sessionStorage'),
  emit = trackAnalyticsEvent,
  makeId = createFlowId
} = {}) {
  let state = readFlowState(storage);
  const persist = () => {
    try {
      storage?.setItem(ANALYTICS_FLOW_KEY, JSON.stringify(state));
    } catch {
      // The app remains usable; only cross-reload de-duplication is unavailable.
    }
  };

  return {
    start() {
      if (state.flowId) return false;
      state = { flowId: makeId(), revision: 0, generatedRevision: -1 };
      persist();
      emit('app_start');
      return true;
    },
    markChanged() {
      if (!state.flowId) return false;
      state.revision += 1;
      persist();
      return true;
    },
    promptGenerated() {
      if (!state.flowId) state = { flowId: makeId(), revision: 0, generatedRevision: -1 };
      if (state.generatedRevision === state.revision) return false;
      state.generatedRevision = state.revision;
      persist();
      emit('prompt_generated');
      return true;
    },
    reset() {
      state = { flowId: '', revision: 0, generatedRevision: -1 };
      try {
        storage?.removeItem(ANALYTICS_FLOW_KEY);
      } catch {
        // The app remains usable if session storage is unavailable.
      }
    }
  };
}
