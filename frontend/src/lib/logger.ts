/**
 * Production-safe logging utility
 * Replaces console.log/error/warn with proper logging
 * In production, errors are sent to the backend audit endpoint.
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;
const API_BASE = import.meta.env.VITE_API_URL || '';

/** Fire-and-forget — report client error to backend audit log */
function reportToBackend(level: 'error' | 'warn', message: string, detail?: unknown) {
  if (!isProduction) return;
  try {
    const body = JSON.stringify({
      level,
      message,
      detail: detail instanceof Error
        ? { name: detail.name, message: detail.message, stack: detail.stack }
        : String(detail ?? ''),
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
    // Use sendBeacon for reliability (works during page unload), fallback to fetch
    const endpoint = `${API_BASE}/api/v1/audit/client-error`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => { /* silent — never let logging break the app */ });
    }
  } catch {
    /* silent — never let logging break the app */
  }
}

export const logger = {
  /**
   * Log informational messages (only in development)
   */
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log warning messages
   */
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
    reportToBackend('warn', String(args[0] ?? ''), args[1]);
  },

  /**
   * Log error messages — always reported to backend in production
   */
  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error('[ERROR]', ...args);
    }
    reportToBackend('error', String(args[0] ?? ''), args[1] ?? args[0]);
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  },

  /**
   * Log API errors with context
   */
  apiError: (endpoint: string, error: unknown) => {
    const errorMessage = (error as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail || (error as { message?: string })?.message || 'Unknown error';
    logger.error(`API Error [${endpoint}]:`, errorMessage, error);
  },
};

export default logger;
