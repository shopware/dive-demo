type DiveDebugDetails = Record<string, unknown>;

type DiveDebugEvent = {
  scope: string;
  stage: string;
  timestamp: string;
  elapsedMs: number;
  details: DiveDebugDetails;
};

declare global {
  interface Window {
    __DIVE_DEMO_DEBUG_EVENTS__?: DiveDebugEvent[];
  }
}

const MAX_EVENTS = 300;
const PENDING_MILESTONES_MS = [5000, 15000, 30000, 60000];

export const isDiveDebugEnabled = () => {
  if (import.meta.env.VITE_DIVE_E2E_DEBUG === '1') {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  return new URLSearchParams(window.location.search).has('diveDebug');
};

const sanitizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (value instanceof HTMLElement) {
    return {
      tagName: value.tagName,
      testId: value.dataset.testid ?? null,
      width: value.getBoundingClientRect().width,
      height: value.getBoundingClientRect().height,
    };
  }

  if (value && typeof value === 'object') {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return String(value);
    }
  }

  return value;
};

const sanitizeDetails = (details: DiveDebugDetails): DiveDebugDetails =>
  Object.fromEntries(
    Object.entries(details).map(([key, value]) => [key, sanitizeValue(value)]),
  );

export const recordDiveDebugEvent = (
  scope: string,
  stage: string,
  details: DiveDebugDetails = {},
) => {
  if (!isDiveDebugEnabled()) {
    return;
  }

  const event: DiveDebugEvent = {
    scope,
    stage,
    timestamp: new Date().toISOString(),
    elapsedMs: Math.round(performance.now()),
    details: sanitizeDetails(details),
  };

  window.__DIVE_DEMO_DEBUG_EVENTS__ ??= [];
  window.__DIVE_DEMO_DEBUG_EVENTS__.push(event);

  if (window.__DIVE_DEMO_DEBUG_EVENTS__.length > MAX_EVENTS) {
    window.__DIVE_DEMO_DEBUG_EVENTS__.splice(
      0,
      window.__DIVE_DEMO_DEBUG_EVENTS__.length - MAX_EVENTS,
    );
  }

  console.info('[DiveDebug]', scope, stage, event.details);
};

export const recordDiveDebugError = (
  scope: string,
  stage: string,
  error: unknown,
  details: DiveDebugDetails = {},
) => {
  recordDiveDebugEvent(scope, stage, {
    ...details,
    error: sanitizeValue(error),
  });
};

export const withDiveDebugSpan = async <T>(
  scope: string,
  stage: string,
  run: () => T | Promise<T>,
  details: DiveDebugDetails = {},
): Promise<T> => {
  if (!isDiveDebugEnabled()) {
    return await run();
  }

  const start = performance.now();
  const timers = PENDING_MILESTONES_MS.map((milestoneMs) =>
    window.setTimeout(() => {
      recordDiveDebugEvent(scope, `${stage}-pending`, {
        ...details,
        elapsedMs: Math.round(performance.now() - start),
      });
    }, milestoneMs),
  );

  recordDiveDebugEvent(scope, `${stage}-start`, details);

  try {
    const result = await run();
    recordDiveDebugEvent(scope, `${stage}-resolved`, {
      ...details,
      elapsedMs: Math.round(performance.now() - start),
    });

    return result;
  } catch (error) {
    recordDiveDebugError(scope, `${stage}-failed`, error, {
      ...details,
      elapsedMs: Math.round(performance.now() - start),
    });
    throw error;
  } finally {
    timers.forEach((timer) => window.clearTimeout(timer));
  }
};
