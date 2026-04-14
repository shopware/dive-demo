const nextFrame = (): Promise<void> =>
    new Promise((resolve) => requestAnimationFrame(() => resolve()));

const hasCanvasLayout = (canvas: HTMLCanvasElement): boolean => {
    const rect = canvas.getBoundingClientRect();
    return rect.width >= 1 && rect.height >= 1;
};

export const waitForCanvasLayout = (
    canvas: HTMLCanvasElement,
    isCancelled: () => boolean = () => false,
): Promise<boolean> =>
    new Promise((resolve) => {
        let settled = false;
        let verifyScheduled = false;
        let rafId: number | null = null;

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
                if (isCancelled() || !canvas.isConnected) {
                    finish(false);
                    return;
                }

                if (!hasCanvasLayout(canvas)) {
                    return;
                }

                await nextFrame();

                if (isCancelled() || !canvas.isConnected) {
                    finish(false);
                    return;
                }

                if (hasCanvasLayout(canvas)) {
                    finish(true);
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

        const resizeObserver = new ResizeObserver(() => {
            void verify();
        });

        resizeObserver.observe(canvas);

        if (canvas.parentElement) {
            resizeObserver.observe(canvas.parentElement);
        }

        tick();
    });
