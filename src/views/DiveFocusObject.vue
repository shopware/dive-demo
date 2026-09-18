<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref, markRaw } from 'vue';
import { QuickView } from '@shopware-ag/dive/quickview';
import { ModelComponent, BoundingBoxComponent, DIVEMath } from '@shopware-ag/dive';
import { useGridTheme } from '@/composables/useGridTheme';
import CanvasFileDropOverlay from '@/components/canvas/CanvasFileDropOverlay.vue';
import { Euler } from 'three/webgpu';

const canvas: Ref<HTMLCanvasElement | null> = ref(null)

const dive: Ref<QuickView | null> = ref(null)

const width: Ref<number> = ref(0)
const height: Ref<number> = ref(0)
const depth: Ref<number> = ref(0)

const isBoundingBoxVisible: Ref<boolean> = ref(false)

let boundingBox: BoundingBoxComponent | null = null;

const { applyGridTheme } = useGridTheme(() => dive.value?.scene);

onMounted(async () => {
    if (!canvas.value) {
        return;
    }

    dive.value = markRaw(await QuickView('model/sofa_B.glb', { canvas: canvas.value, displayGrid: true }));
    applyGridTheme();

    drawBoundingBox();
})

onUnmounted(() => {
    boundingBox = null;
    void dive.value?.disposeAsync();
    dive.value = null;
});

const switchObject = async (object: string) => {
    if (!dive.value) {
        return;
    }

    // the transform lives on the node, the geometry in its model component
    const node = dive.value.model;
    if (!node) {
        return;
    }

    // not load(), because the scaling below has to happen before framing
    await node.requireComponent(ModelComponent).setFromURL(object);

    if (object === 'model/sofa_B.glb') {
        node.scale.set(1.0, 1.0, 1.0);
        node.setRotationFromEuler(new Euler(0, Math.PI / 4, 0));
    }
    if (object === 'model/hay_chair.glb') {
        node.scale.set(0.1, 0.1, 0.1);
    }
    if (object === 'model/suzanne.glb') {
        node.scale.set(10.0, 10.0, 10.0);
    }

    dive.value.orbitController.focusObject(node);

    drawBoundingBox();
}

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
    boundingBox.setOriented(true);
    boundingBox.setBoxHelperVisible(isBoundingBoxVisible.value);
    boundingBox.setSphereHelperVisible(isBoundingBoxVisible.value);

    width.value = DIVEMath.roundExp(boundingBox.size.x, 2);
    height.value = DIVEMath.roundExp(boundingBox.size.y, 2);
    depth.value = DIVEMath.roundExp(boundingBox.size.z, 2);
}

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
}

const showBoundingBox = () => {
    boundingBox?.setBoxHelperVisible(isBoundingBoxVisible.value);
    boundingBox?.setSphereHelperVisible(false);
}

defineProps<{
    msg: string
}>()
</script>

<template>
    <CanvasFileDropOverlay class="canvasWrapper" @loading="loadFile">
        <canvas ref="canvas"></canvas>
    </CanvasFileDropOverlay>
    <div class="controlPanel">
        <div class="controlPanel-buttons">
            <button @click="switchObject('model/sofa_B.glb')">Sofa</button>
            <button @click="switchObject('model/hay_chair.glb')">Chair</button>
            <button @click="switchObject('model/suzanne.glb')">Suzanne</button>
        </div>
    </div>
    <div class="infoPanel">
        <span class="controlPanel-label">Dimensions</span>
        <div class="infoPanel-dimensions">
            <div class="infoPanel-row">
                <span class="infoPanel-key">Width</span>
                <span class="infoPanel-value">{{ width }} m</span>
            </div>
            <div class="infoPanel-row">
                <span class="infoPanel-key">Height</span>
                <span class="infoPanel-value">{{ height }} m</span>
            </div>
            <div class="infoPanel-row">
                <span class="infoPanel-key">Depth</span>
                <span class="infoPanel-value">{{ depth }} m</span>
            </div>
        </div>
        <label class="checkbox-button">
            <input type="checkbox" v-model="isBoundingBoxVisible" @change="showBoundingBox" />
            Show bounding volume
        </label>
    </div>
</template>

<style scoped>
.canvasWrapper {
    display: flex;
    height: 100%;
    width: 100%;
}

.infoPanel-dimensions {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.5rem;
}

.infoPanel-row {
    display: flex;
    justify-content: space-between;
    gap: 1.5rem;
    font-size: 0.8rem;
}

.infoPanel-key {
    color: var(--ui-label-text);
}

.infoPanel-value {
    font-variant-numeric: tabular-nums;
    text-align: right;
}
</style>
