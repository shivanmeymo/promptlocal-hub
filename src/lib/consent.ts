export type ConsentCategory = 'necessary' | 'functional' | 'analytics' | 'marketing';

export type ConsentState = Record<ConsentCategory, boolean> & {
  // store a timestamp of when consent was given/updated
  updatedAt: number;
  // versioning in case text changes materially (you can bump this)
  version: string;
};

const CONSENT_STORAGE_KEY = 'cookie_consent_v1';
const CURRENT_VERSION = '1.0.0';

const defaultConsent: ConsentState = {
  necessary: true, // always true by definition
  functional: false,
  analytics: false,
  marketing: false,
  updatedAt: 0,
  version: CURRENT_VERSION,
};

export function getConsent(): ConsentState {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return { ...defaultConsent };
    const parsed = JSON.parse(raw) as ConsentState;
    // ensure necessary is always true
    parsed.necessary = true;
    return parsed;
  } catch {
    return { ...defaultConsent };
  }
}

export function setConsent(partial: Partial<ConsentState>): ConsentState {
  const current = getConsent();
  const next: ConsentState = {
    ...current,
    ...partial,
    necessary: true,
    updatedAt: Date.now(),
    version: CURRENT_VERSION,
  };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function hasConsent(category: ConsentCategory): boolean {
  const state = getConsent();
  return !!state[category];
}

export function clearConsent() {
  localStorage.removeItem(CONSENT_STORAGE_KEY);
}
