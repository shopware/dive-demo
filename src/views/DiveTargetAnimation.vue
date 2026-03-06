<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref, markRaw, watch } from 'vue';
import { QuickView } from '@shopware-ag/dive/quickview';
import type { AnimationSystem, TargetAnimator } from '@shopware-ag/dive/animation';
import type { OrbitController } from '@shopware-ag/dive/orbitcontroller';

const canvas: Ref<HTMLCanvasElement | null> = ref(null);

let dive: QuickView | null = null;
let orbitController: OrbitController | null = null;
let animationSystem: AnimationSystem | null = null;
let animator: TargetAnimator | null = null;

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

onMounted(async () => {
    if (!canvas.value) return;

    dive = markRaw(await QuickView('sofa_B.glb', { canvas: canvas.value }));
    orbitController = dive.orbitController;

    // set up animation system
    const { AnimationSystem } = await import('@shopware-ag/dive/animation');
    animationSystem = new AnimationSystem();
    dive.clock.addTicker(animationSystem);

    // set initial position and target
    presets[0].position = orbitController.object.position.clone();
    presets[0].target = orbitController.target.clone();
    activePreset.value = 0;
});

onUnmounted(async () => {
    animationSystem?.dispose();
    await dive?.dispose();
});

watch(activePreset, (newVal) => {
    goToPreset(newVal);
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
    ) || null;

    animator.play();
};
</script>

<template>
    <div class="page">
        <div class="canvasWrapper">
            <canvas ref="canvas"></canvas>
        </div>
        <div class="controlPanel">
            <div class="controlPanel-group">
                <span class="controlPanel-label">Camera</span>
                <div class="controlPanel-buttons controlPanel-buttons--center">
                    <button v-for="(preset, i) in presets" :key="i" :class="{ active: activePreset === i }"
                        @click="activePreset = i">
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
}

.canvasWrapper {
    display: flex;
    height: 100%;
    width: 100%;
}
</style>
