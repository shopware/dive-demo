<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref, markRaw, nextTick } from 'vue';
import { QuickView } from '@shopware-ag/dive/quickview';
import type { AnimationSystem, TargetAnimator } from '@shopware-ag/dive/animation';
import type { OrbitController } from '@shopware-ag/dive/orbitcontroller';
import { waitForCanvasLayout } from '@/utils/waitForCanvasLayout';

const canvas: Ref<HTMLCanvasElement | null> = ref(null);

let dive: QuickView | null = null;
let orbitController: OrbitController | null = null;
let animationSystem: AnimationSystem | null = null;
let animator: TargetAnimator | null = null;
let disposed = false;
const controlsReady = ref(false);

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

    if (!canvas.value || disposed) return;

    const hasLayout = await waitForCanvasLayout(canvas.value, () => disposed);

    if (!hasLayout || disposed) {
        return;
    }

    const quickView = await QuickView('sofa_B.glb', { canvas: canvas.value });

    if (disposed) {
        await quickView.dispose();
        return;
    }

    dive = markRaw(quickView);
    orbitController = dive.orbitController;

    // set up animation system
    const { AnimationSystem } = await import('@shopware-ag/dive/animation');
    animationSystem = new AnimationSystem();
    dive.clock.addTicker(animationSystem);

    // set initial position and target
    presets[0].position = orbitController.object.position.clone();
    presets[0].target = orbitController.target.clone();
    activePreset.value = 0;
    controlsReady.value = true;
};

onMounted(() => {
    void initializeDive();
});

onUnmounted(async () => {
    disposed = true;
    controlsReady.value = false;
    animationSystem?.dispose();
    await dive?.dispose();
});

const goToPreset = async (index: number) => {
    if (!orbitController || !animationSystem) return;

    animationSystem.remove(animator?.uuid ?? '');

    animator = await animationSystem.fromTargets(
        [
            { object: orbitController.object.position, to: { ...presets[index].position } },
            { object: orbitController.target, to: { ...presets[index].target } },
        ],
        800, // ms
        { easing: animationSystem.Easing.Quadratic.InOut },
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
    <div class="page">
        <div class="canvasWrapper">
            <canvas ref="canvas" data-testid="target-animation-canvas"></canvas>
        </div>
        <div class="controlPanel" data-testid="target-animation-control-panel">
            <div class="controlPanel-group">
                <span class="controlPanel-label">Camera</span>
                <div class="controlPanel-buttons controlPanel-buttons--center">
                    <button v-for="(preset, i) in presets" :key="i" :class="{ active: activePreset === i }"
                        data-testid="target-animation-preset"
                        :disabled="!controlsReady"
                        @click="setActivePreset(i)">
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
