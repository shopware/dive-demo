<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref, markRaw, watch } from 'vue';
import { QuickView } from '@shopware-ag/dive/quickview';
import type { AnimationSystem, TargetAnimator } from '@shopware-ag/dive/animation';
import type { OrbitController } from '@shopware-ag/dive/orbitcontroller';

const canvas: Ref<HTMLCanvasElement | null> = ref(null);

let dive: QuickView;
let orbitController: OrbitController;
let animationSystem: AnimationSystem;
let animator: TargetAnimator;

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
    animationSystem.dispose();
    await dive?.dispose();
});

watch(activePreset, (newVal) => {
    goToPreset(newVal);
});

const goToPreset = async (index: number) => {
    // remove old animator
    animationSystem.remove(animator.uuid);

    // create new animator
    animator = await animationSystem.fromTargets(
        [
            { object: orbitController.object.position, to: { ...presets[index].position } },
            { object: orbitController.target, to: { ...presets[index].target } },
        ],
        800, // ms
        { easing: animationSystem.Easing.Quadratic.InOut },
    );

    // play new animator
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

.controlPanel {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(30, 30, 30, 0.9);
    padding: 1rem;
    border-radius: 0.75rem;
    backdrop-filter: blur(8px);
}

.controlPanel-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.controlPanel-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #aaa;
}

.controlPanel-buttons {
    display: flex;
    gap: 0.4rem;
}

.controlPanel-buttons button {
    padding: 0.45rem 0.85rem;
    border-radius: 0.35rem;
    border: 1px solid #555;
    background-color: #2a2a2a;
    color: #eee;
    cursor: pointer;
    font-size: 0.8rem;
    transition: background-color 0.15s, border-color 0.15s;
}

.controlPanel-buttons button:hover:not(:disabled) {
    background-color: #3a3a3a;
    border-color: #888;
}

.controlPanel-buttons button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.controlPanel-buttons button.active {
    background-color: #0066cc;
    border-color: #0088ff;
    color: white;
}

.controlPanel-buttons--center {
    justify-content: center;
}

.controlPanel-buttons--center button {
    min-width: 2.5rem;
    text-align: center;
}
</style>
