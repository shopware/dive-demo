type CanvasTarget = HTMLCanvasElement | null | (() => HTMLCanvasElement | null);

const DEFAULT_TIMEOUT_MS = 10_000;

const nextFrame = (): Promise<void> =>
    new Promise((resolve) => requestAnimationFrame(() => resolve()));

const resolveCanvasTarget = (canvasTarget: CanvasTarget): HTMLCanvasElement | null =>
    typeof canvasTarget === 'function' ? canvasTarget() : canvasTarget;

const hasCanvasLayout = (canvas: HTMLCanvasElement): boolean => {
    const rect = canvas.getBoundingClientRect();
    return rect.width >= 1 && rect.height >= 1;
};

export const waitForCanvasLayout = (
    canvasTarget: CanvasTarget,
    isCancelled: () => boolean = () => false,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<boolean> =>
    new Promise((resolve) => {
        let settled = false;
        let verifyScheduled = false;
        let rafId: number | null = null;
        let observedCanvas: HTMLCanvasElement | null = null;
        let observedParent: Element | null = null;
        const startedAt = performance.now();

        const hasTimedOut = () => performance.now() - startedAt >= timeoutMs;

        const resizeObserver = new ResizeObserver(() => {
            void verify();
        });

        const syncObservedElements = (): HTMLCanvasElement | null => {
            const canvas = resolveCanvasTarget(canvasTarget);
            const parent = canvas?.parentElement ?? null;

            if (canvas === observedCanvas && parent === observedParent) {
                return canvas;
            }

            resizeObserver.disconnect();
            observedCanvas = canvas;
            observedParent = parent;

            if (canvas) {
                resizeObserver.observe(canvas);
            }

            if (parent) {
                resizeObserver.observe(parent);
            }

            return canvas;
        };

        const finish = (value: boolean) => {
            if (settled) {
                return;
            }

            settled = true;
            resizeObserver.disconnect();

            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }

            resolve(value);
        };

        const verify = async () => {
            if (settled || verifyScheduled) {
                return;
            }

            verifyScheduled = true;

            try {
                if (isCancelled()) {
                    finish(false);
                    return;
                }

                const canvas = syncObservedElements();

                if (!canvas || !canvas.isConnected) {
                    if (hasTimedOut()) {
                        finish(false);
                    }
                    return;
                }

                if (!hasCanvasLayout(canvas)) {
                    if (hasTimedOut()) {
                        finish(false);
                    }
                    return;
                }

                await nextFrame();

                if (isCancelled()) {
                    finish(false);
                    return;
                }

                const stableCanvas = syncObservedElements();

                if (!stableCanvas || !stableCanvas.isConnected) {
                    if (hasTimedOut()) {
                        finish(false);
                    }
                    return;
                }

                if (hasCanvasLayout(stableCanvas)) {
                    finish(true);
                    return;
                }

                if (hasTimedOut()) {
                    finish(false);
                }
            } finally {
                verifyScheduled = false;
            }
        };

        const tick = () => {
            if (settled) {
                return;
            }

            void verify();
            rafId = requestAnimationFrame(tick);
        };

        tick();
    });
