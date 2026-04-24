<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref, markRaw } from 'vue';
import { DIVEModel, BoundingBox } from '@shopware-ag/dive';
import { QuickView } from '@shopware-ag/dive/quickview';
import { Toolbox } from '@shopware-ag/dive/toolbox';

const canvas: Ref<HTMLCanvasElement | null> = ref(null)
const dive: Ref<QuickView | null> = ref(null);
const ready = ref(false);
let toolbox: Toolbox | null = null;

const logInit = (stage: string, details: Record<string, unknown> = {}) => {
    console.info('[DivePlaceOnFloor]', stage, details);
};

const onKeyDown = (event: KeyboardEvent) => {
    const transformTool = toolbox?.getTool('transform');
    if (!transformTool) {
        return;
    }

    if (event.key === 'a') {
        transformTool.setGizmoMode('translate');
    }
    if (event.key === 's') {
        transformTool.setGizmoMode('rotate');
    }
    if (event.key === 'd') {
        transformTool.setGizmoMode('scale');
    }
};

onMounted(async () => {
    ready.value = false;
    logInit('init-start', { hasCanvas: Boolean(canvas.value) });
    if (!canvas.value) {
        logInit('init-skip', { reason: 'missing-canvas' });
        return;
    }

    logInit('quick-view-start', { uri: 'sofa_B.glb' });
    dive.value = markRaw(await QuickView('sofa_B.glb', { canvas: canvas.value, displayFloor: true }));
    logInit('quick-view-resolved', { uri: 'sofa_B.glb' });

    toolbox = new Toolbox(dive.value.scene, dive.value.orbitController);
    toolbox.enableTool('transform');
    logInit('toolbox-ready');

    const model = dive.value.scene.root.children.find((child) => 'isDIVEModel' in child) as DIVEModel;
    toolbox.selectionState.select(model);

    window.addEventListener('keydown', onKeyDown);



    dive.value.scene.root.children.forEach((child) => {
        if (child instanceof DIVEModel) {
            const bb = new BoundingBox(child);
            bb.setBoxHelperVisible(false);
            child.add(bb);
        }
    });
    logInit('bounding-boxes-initialized');

    ready.value = true;
    logInit('ready-true');
})

onUnmounted(() => {
    ready.value = false;
    logInit('unmounted');
    window.removeEventListener('keydown', onKeyDown);
    toolbox?.dispose();
    toolbox = null;
    void dive.value?.disposeAsync();
    dive.value = null;
});

const placeOnFloor = () => {
    dive.value?.scene.root.children.forEach((child) => {
        if (child instanceof DIVEModel) {
            child.dropIt();
        }
    });
}

defineProps<{
    msg: string
}>()
</script>

<template>
    <div class="canvasWrapper" data-testid="place-on-floor-page" :data-ready="ready ? 'true' : 'false'">
        <canvas ref="canvas"></canvas>
        <button @click="placeOnFloor">Place on floor</button>
    </div>
</template>

<style scoped>
.canvasWrapper {
    display: flex;
    height: 100%;
    width: 100%;
    justify-content: center;
}

button {
    position: absolute;
    bottom: 20px;
}
</style>
