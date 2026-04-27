<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref, markRaw, nextTick } from 'vue';
import { QuickView } from '@shopware-ag/dive/quickview';
import { AnimationSystem, type TargetAnimator } from '@shopware-ag/dive/animation';
import type { OrbitController } from '@shopware-ag/dive/orbitcontroller';
import { recordDiveDebugEvent, withDiveDebugSpan } from '@/utils/e2eDiagnostics';

const canvas: Ref<HTMLCanvasElement | null> = ref(null);

const dive: Ref<QuickView | null> = ref(null)
let orbitController: OrbitController | null = null;
let animationSystem: AnimationSystem | null = null;
let animator: TargetAnimator | null = null;
let disposed = false;
const controlsReady = ref(false);
const initAbortController = new AbortController();

const logTargetAnimation = (
    stage: string,
    details: Record<string, unknown> = {},
) => {
    console.info('[DiveTargetAnimation]', stage, details);
    recordDiveDebugEvent('DiveTargetAnimation', stage, details);
};

const activePreset: Ref<number> = ref(0);

const presets = [
    {
        label: 'Initial',
        position: { x: 0, y: 0, z: 0 },
        target: { x: 0, y: 0, z: 0 },
    },
    {
        label: 'Hero',
        position: { x: -2, y: 1.5, z: 2 },
        target: { x: 0, y: 0.5, z: 0 },
    },
    {
        label: 'Low',
        position: { x: -1.5, y: 0.2, z: 1.5 },
        target: { x: 0, y: 0.5, z: 0 },
    },
    {
        label: 'Top-down',
        position: { x: 0, y: 4, z: 0.5 },
        target: { x: 0, y: 0, z: 0 },
    },
    {
        label: 'Back',
        position: { x: -2.5, y: 0.30, z: -1.5 },
        target: { x: 0.15, y: 0.65, z: -0.35 },
    },
];

const initializeDive = async () => {
    await nextTick();

    if (disposed || initAbortController.signal.aborted) {
        return;
    }

    const initialCanvas = canvas.value;

    if (!initialCanvas) {
        const error = new Error('Target-animation canvas ref is missing');
        console.error('Failed to initialize DiveTargetAnimation', error);
        return;
    }

    try {
        logTargetAnimation('quick-view-start', {
            canvasTestId: initialCanvas.dataset.testid ?? null,
        });
        const quickView = await withDiveDebugSpan(
            'DiveTargetAnimation',
            'quick-view-call',
            () => QuickView(
                'sofa_B.glb',
                { canvas: initialCanvas },
            ),
            { uri: 'sofa_B.glb', canvasTestId: initialCanvas.dataset.testid ?? null },
        );
        logTargetAnimation('quick-view-resolved', {
            rendererInitialized: quickView.mainView.renderer.initialized,
        });
        dive.value = markRaw(quickView);
        logTargetAnimation('dive-ref-set', {
            rendererInitialized: dive.value.mainView.renderer.initialized,
        });

        if (disposed) {
            await dive.value?.disposeAsync();
            logTargetAnimation('disposed-after-quick-view');
            return;
        }

        orbitController = dive.value?.orbitController;
        logTargetAnimation('orbit-controller-set');
        animationSystem = await withDiveDebugSpan(
            'DiveTargetAnimation',
            'animation-system-create-call',
            () => new AnimationSystem(),
        );
        logTargetAnimation('animation-system-created');
        dive.value?.clock.addTicker(animationSystem);
        logTargetAnimation('animation-system-added-to-clock');

        // set initial position and target
        presets[0].position = orbitController.object.position.clone();
        presets[0].target = orbitController.target.clone();
        activePreset.value = 0;
        logTargetAnimation('initial-preset-captured');
        controlsReady.value = true;
        logTargetAnimation('controls-ready');
    } catch (error) {
        const lastError = error instanceof Error ? error : new Error(String(error));
        logTargetAnimation('initialize-failed', {
            errorName: lastError.name,
            errorMessage: lastError.message,
        });
        console.error('Failed to initialize DiveTargetAnimation', lastError);
    }
};

onMounted(() => {
    void initializeDive();
});

onUnmounted(async () => {
    disposed = true;
    initAbortController.abort();
    controlsReady.value = false;
    animationSystem?.dispose();
    await dive.value?.disposeAsync();
});

const goToPreset = async (index: number) => {
    if (!orbitController || !animationSystem) return;

    animationSystem.remove(animator?.uuid ?? '');

    animator = await withDiveDebugSpan(
        'DiveTargetAnimation',
        'animator-from-targets-call',
        () => animationSystem!.fromTargets(
            [
                { object: orbitController!.object.position, to: { ...presets[index].position } },
                { object: orbitController!.target, to: { ...presets[index].target } },
            ],
            800, // ms
            { easing: animationSystem!.Easing.Quadratic.InOut },
        ),
        { presetIndex: index, presetLabel: presets[index].label },
    );

    animator.addEventListener('update', () => {
        orbitController?.object.lookAt(orbitController.target);
    });

    animator.play();
};

const setActivePreset = async (index: number) => {
    activePreset.value = index;
    await nextTick();
    await goToPreset(index);
};
</script>

<template>
    <div
        class="page"
        data-testid="target-animation-page"
        :data-ready="controlsReady ? 'true' : 'false'"
    >
        <div class="canvasWrapper">
            <canvas ref="canvas" data-testid="target-animation-canvas"></canvas>
        </div>
        <div class="controlPanel" data-testid="target-animation-control-panel">
            <div class="controlPanel-group">
                <span class="controlPanel-label">Camera</span>
                <div class="controlPanel-buttons controlPanel-buttons--center">
                    <button v-for="(preset, i) in presets" :key="i" :class="{ active: activePreset === i }"
                        data-testid="target-animation-preset" :disabled="!controlsReady" @click="setActivePreset(i)">
                        {{ preset.label }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 100vh;
}

.canvasWrapper {
    display: flex;
    min-height: 24rem;
    height: 100%;
    width: 100%;
}

canvas {
    display: block;
    width: 100%;
    height: 100%;
}
</style>
