import { DIVE, DIVEModel, type DIVESettings } from '@shopware-ag/dive';
import { AssetCache } from '@shopware-ag/dive/assetcache';
import { OrbitController } from '@shopware-ag/dive/orbitcontroller';
import type { QuickView } from '@shopware-ag/dive/quickview';

const MODEL_LOAD_TIMEOUT_MS = 15000;
const MODEL_LOAD_MAX_ATTEMPTS = 3;
const MODEL_LOAD_RETRY_DELAY_MS = 250;

type CreateStableQuickViewOptions = {
    signal?: AbortSignal;
    modelLoadTimeoutMs?: number;
    maxAttempts?: number;
    retryDelayMs?: number;
};

type ResolvedCreateStableQuickViewOptions = {
    signal?: AbortSignal;
    modelLoadTimeoutMs: number;
    maxAttempts: number;
    retryDelayMs: number;
};

const toAbortError = (reason?: unknown): Error => {
    if (reason instanceof Error) {
        return reason;
    }

    return new DOMException('The operation was aborted.', 'AbortError');
};

const throwIfAborted = (signal?: AbortSignal): void => {
    if (signal?.aborted) {
        throw toAbortError(signal.reason);
    }
};

const isAbortError = (error: unknown): boolean =>
    error instanceof DOMException && error.name === 'AbortError';

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
    new Promise((resolve, reject) => {
        throwIfAborted(signal);

        const timeoutId = window.setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
        }, ms);

        const onAbort = () => {
            window.clearTimeout(timeoutId);
            reject(toAbortError(signal?.reason));
        };

        signal?.addEventListener('abort', onAbort, { once: true });
    });

const withTimeout = async <T>(
    promise: Promise<T>,
    timeoutMs: number,
    label: string,
    signal?: AbortSignal,
): Promise<T> => {
    throwIfAborted(signal);

    return new Promise<T>((resolve, reject) => {
        let settled = false;

        const finish = (callback: (value: T | Error) => void, value: T | Error) => {
            if (settled) {
                return;
            }

            settled = true;
            window.clearTimeout(timeoutId);
            signal?.removeEventListener('abort', onAbort);
            callback(value);
        };

        const timeoutId = window.setTimeout(() => {
            finish(reject as (value: T | Error) => void, new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        const onAbort = () => {
            finish(reject as (value: T | Error) => void, toAbortError(signal?.reason));
        };

        signal?.addEventListener('abort', onAbort, { once: true });

        promise.then(
            (value) => finish(resolve as (value: T | Error) => void, value),
            (error: unknown) =>
                finish(reject as (value: T | Error) => void, error instanceof Error ? error : new Error(String(error))),
        );
    });
};

const loadModelWithRetry = async (
    uri: string,
    options: ResolvedCreateStableQuickViewOptions,
): Promise<DIVEModel> => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
        throwIfAborted(options.signal);

        // Failed loads can leave a pending cache entry behind, which would make
        // the next model load await the stale promise forever.
        AssetCache.delete(uri);

        const model = new DIVEModel();

        try {
            await withTimeout(
                model.setFromURL(uri),
                options.modelLoadTimeoutMs,
                `Loading ${uri}`,
                options.signal,
            );
            return model;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            AssetCache.delete(uri);

            if (isAbortError(lastError) || attempt === options.maxAttempts) {
                throw lastError;
            }

            await sleep(options.retryDelayMs * attempt, options.signal);
        }
    }

    throw lastError ?? new Error(`Failed to load ${uri}`);
};

export const createStableQuickView = async (
    uri: string,
    settings?: Partial<DIVESettings>,
    options: CreateStableQuickViewOptions = {},
): Promise<QuickView> => {
    const resolvedOptions: ResolvedCreateStableQuickViewOptions = {
        signal: options.signal,
        modelLoadTimeoutMs: options.modelLoadTimeoutMs ?? MODEL_LOAD_TIMEOUT_MS,
        maxAttempts: options.maxAttempts ?? MODEL_LOAD_MAX_ATTEMPTS,
        retryDelayMs: options.retryDelayMs ?? MODEL_LOAD_RETRY_DELAY_MS,
    };

    throwIfAborted(resolvedOptions.signal);

    const dive = new DIVE(settings);
    dive.mainView.camera.position.set(0, 1, 2);

    const orbitController = new OrbitController(
        dive.mainView.camera,
        dive.mainView.canvas,
    );
    dive.clock.addTicker(orbitController);

    try {
        const model = await loadModelWithRetry(uri, resolvedOptions);

        throwIfAborted(resolvedOptions.signal);

        dive.scene.root.add(model);
        model.placeOnFloor();
        orbitController.focusObject(model);

        const quickView = Object.assign(dive, { orbitController, model });
        const originalDispose = dive.dispose.bind(dive);

        quickView.dispose = async () => {
            orbitController.dispose();
            await originalDispose();
        };

        return quickView;
    } catch (error) {
        orbitController.dispose();
        await dive.dispose();
        throw error;
    }
};
