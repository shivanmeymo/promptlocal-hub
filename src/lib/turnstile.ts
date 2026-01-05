let loadingPromise: Promise<void> | null = null;

const SCRIPT_ID = 'turnstile-script';
const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?compat=recaptcha&render=explicit';

export function loadTurnstile(): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).turnstile) {
    return Promise.resolve();
  }

  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).turnstile) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Turnstile script')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Turnstile script'));
    document.head.appendChild(script);
  });

  return loadingPromise;
}

export type TurnstileAPI = {
  render: (
    container: string | HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'error-callback'?: () => void;
      'expired-callback'?: () => void;
      theme?: 'light' | 'dark' | 'auto';
      size?: 'normal' | 'compact';
    }
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

export function getTurnstile(): TurnstileAPI | undefined {
  return (window as any).turnstile as TurnstileAPI | undefined;
}
