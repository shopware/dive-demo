<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref, markRaw } from 'vue';
import { QuickView } from '@shopware-ag/dive/quickview';
import { BoundingBox, DIVEMath, DIVEModel } from '@shopware-ag/dive';

const canvas: Ref<HTMLCanvasElement | null> = ref(null)

const dive: Ref<QuickView | null> = ref(null)

const width: Ref<number> = ref(0)
const height: Ref<number> = ref(0)
const depth: Ref<number> = ref(0)

const isBoundingBoxVisible: Ref<boolean> = ref(false)
const currentBoundingBox: Ref<BoundingBox | null> = ref(null)

onMounted(async () => {
    if (!canvas.value) {
        return;
    }

    dive.value = markRaw(await QuickView('sofa_B.glb', { canvas: canvas.value }));

    dive.value.scene.root.children.forEach((model) => {
        if (model instanceof DIVEModel) {
            drawBoundingBox(model);
        }
    });
})

onUnmounted(() => {
    void dive.value?.dispose();
    dive.value = null;
});

const switchObject = async (object: string) => {
    if (!dive.value) {
        return;
    }

    const model = dive.value.scene.root.children.find((child) => child instanceof DIVEModel) as DIVEModel | undefined;
    if (!model) {
        return;
    }
    await model.setFromURL(object);

    if (object === 'sofa_B.glb') {
        model.scale.set(1.0, 1.0, 1.0);
    }
    if (object === 'hay_chair.glb') {
        model.scale.set(0.1, 0.1, 0.1);
    }
    if (object === 'suzanne.glb') {
        model.scale.set(10.0, 10.0, 10.0);
    }

    dive.value.orbitController.focusObject(model);

    drawBoundingBox(model);
}

const drawBoundingBox = (model: DIVEModel) => {
    const bb = new BoundingBox(model);
    currentBoundingBox.value = bb;
    bb.setBoxHelperVisible(isBoundingBoxVisible.value);
    bb.setSphereHelperVisible(isBoundingBoxVisible.value);
    bb.scale.set(1 / model.scale.x, 1 / model.scale.y, 1 / model.scale.z);
    model.add(bb);

    width.value = DIVEMath.roundExp(bb.size.x, 2);
    height.value = DIVEMath.roundExp(bb.size.y, 2);
    depth.value = DIVEMath.roundExp(bb.size.z, 2);
}

const showBoundingBox = () => {
    if (currentBoundingBox.value) {
        currentBoundingBox.value.setBoxHelperVisible(isBoundingBoxVisible.value);
        currentBoundingBox.value.setSphereHelperVisible(isBoundingBoxVisible.value);
        return;
    }
    if (!dive.value) {
        return;
    }
    const model = dive.value.scene.root.children.find((child) => child instanceof DIVEModel) as DIVEModel | undefined;
    if (!model) {
        return;
    }
    drawBoundingBox(model);
}

defineProps<{
    msg: string
}>()
</script>

<template>
    <div class="canvasWrapper">
        <canvas ref="canvas"></canvas>
    </div>
    <div class="controlPanel">
        <div class="controlPanel-buttons">
            <button @click="switchObject('sofa_B.glb')">Sofa</button>
            <button @click="switchObject('hay_chair.glb')">Chair</button>
            <button @click="switchObject('suzanne.glb')">Suzanne</button>
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
