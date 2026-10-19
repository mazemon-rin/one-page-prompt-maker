// GA4 is enabled only for this exact production hostname.
export const GA4_MEASUREMENT_ID = 'G-J5808LGQBY';
export const GA4_ALLOWED_HOSTS = Object.freeze([
  'matome-ai-mazemonrin.vercel.app'
]);

// Kept separate from the app's existing draft/history storage key.
export const ANALYTICS_CONSENT_KEY = 'matome-ai-ga4-consent-v1';
export const ANALYTICS_FLOW_KEY = 'matome-ai-ga4-flow-v1';
