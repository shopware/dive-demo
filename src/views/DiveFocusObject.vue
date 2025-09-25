<script setup lang="ts">
import { ref, onMounted, type Ref, markRaw } from 'vue';
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

    dive.value = markRaw(await QuickView('sofa_B.glb', { canvas: canvas.value, displayFloor: false }));

    dive.value.scene.root.children.forEach((model) => {
        if (model instanceof DIVEModel) {
            drawBoundingBox(model);
        }
    });
})

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
    <div class="buttonWrapper">
        <button @click="switchObject('sofa_B.glb')">Sofa</button>
        <button @click="switchObject('hay_chair.glb')">Chair</button>
        <button @click="switchObject('suzanne.glb')">Suzanne</button>
    </div>
    <div class="infoPanel">
        <div class="infoPanel-dimensions">
            <div class="infoPanel-dimensions-tags">
                <p>Width:</p>
                <p>Height:</p>
                <p>Depth:</p>
            </div>
            <div class="infoPanel-dimensions-values">
                <p>{{ width }} m</p>
                <p>{{ height }} m</p>
                <p>{{ depth }} m</p>
            </div>
        </div>
        <div class="infoPanel-controls">
            <label>
                <input type="checkbox" v-model="isBoundingBoxVisible" @change="showBoundingBox" />
                Show bounding volume
            </label>
        </div>
    </div>
</template>

<style scoped>
.canvasWrapper {
    display: flex;
    height: 100%;
    width: 100%;
}

.buttonWrapper {
    display: flex;
    gap: 0.5rem;
    position: absolute;
    bottom: 10px;
    width: 100%;
    justify-content: center;
    align-items: center;

    button {
        padding: 10px;
        border-radius: 5px;
        border: 1px solid #ccc;
        cursor: pointer;
    }
}

.infoPanel {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 4rem;
    left: 4rem;
    background-color: #ccc;
    padding: 0.5rem;
    border-radius: 1rem;

    .infoPanel-dimensions {
        display: flex;

        flex-direction: row;
        justify-content: space-between;

        padding: 0.5rem;

        .infoPanel-dimensions-tags {
            display: flex;
            flex-direction: column;
        }

        .infoPanel-dimensions-values {
            display: flex;
            flex-direction: column;

            p {
                color: black;
                text-align: right;
            }
        }



        p {
            color: black;
        }
    }

    .infoPanel-controls {
        display: flex;
        align-items: center;

        padding: 0.5rem;
    }
}
</style>