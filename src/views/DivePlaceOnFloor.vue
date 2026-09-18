<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref, markRaw } from 'vue';
import { BoundingBoxComponent } from '@shopware-ag/dive';
import { QuickView } from '@shopware-ag/dive/quickview';
import { Toolbox } from '@shopware-ag/dive/toolbox';
import { useGridTheme } from '@/composables/useGridTheme';
import CanvasFileDropOverlay from '@/components/canvas/CanvasFileDropOverlay.vue';

const canvas: Ref<HTMLCanvasElement | null> = ref(null)
const dive: Ref<QuickView | null> = ref(null);
let toolbox: Toolbox | null = null;

let boundingBox: BoundingBoxComponent | null = null;

const { applyGridTheme } = useGridTheme(() => dive.value?.scene, {
    withFloor: true,
});

const drawBoundingBox = () => {
    const node = dive.value?.model;
    if (!node) {
        return;
    }

    // a component measures the node it is attached to, so it goes on the model
    if (boundingBox) {
        node.removeComponent(boundingBox);
        boundingBox.dispose();
    }

    boundingBox = node.addComponent(new BoundingBoxComponent());
    boundingBox.setBoxHelperVisible(false);
}

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
    if (!canvas.value) {
        return;
    }

    dive.value = markRaw(await QuickView('model/sofa_B.glb', {
        canvas: canvas.value,
        displayGrid: true,
        displayFloor: true,
    }));
    applyGridTheme();

    toolbox = new Toolbox(dive.value.scene, dive.value.orbitController);
    toolbox.enableTool('transform');

    // the node QuickView built, rather than hunting for it in the scene
    const node = dive.value.model;
    if (node) {
        toolbox.selectionState.select(node);
    }

    window.addEventListener('keydown', onKeyDown);

    drawBoundingBox();
})

onUnmounted(() => {
    boundingBox = null;
    window.removeEventListener('keydown', onKeyDown);
    toolbox?.dispose();
    toolbox = null;
    void dive.value?.disposeAsync();
    dive.value = null;
});

const loadFile = async (file: File) => {
    const targetDive = dive.value;

    if (!targetDive) {
        return;
    }

    const url = URL.createObjectURL(file);

    try {
        await targetDive.load(url);
    } finally {
        URL.revokeObjectURL(url);
    }

    drawBoundingBox();

    const node = targetDive.model;
    if (node) {
        toolbox?.selectionState.select(node);
    }
}

const placeOnFloor = () => {
    dive.value?.model?.dropIt();
}

defineProps<{
    msg: string
}>()
</script>

<template>
    <CanvasFileDropOverlay class="canvasWrapper" @loading="loadFile">
        <canvas ref="canvas"></canvas>
        <button @click="placeOnFloor">Place on floor</button>
    </CanvasFileDropOverlay>
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
