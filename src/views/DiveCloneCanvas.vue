<script setup lang="ts">
import { ref, onMounted, type Ref, markRaw } from 'vue';
import ResizablePanels from '@/components/layout/ResizablePanels.vue';
import { QuickView } from '@shopware-ag/dive/quickview';


const canvas0 = ref<HTMLCanvasElement | null>(null);
const canvas1 = ref<HTMLCanvasElement | null>(null);
const canvases: Ref<HTMLCanvasElement | null>[] = [canvas0, canvas1];

const dive: Ref<QuickView | null> = ref(null);

onMounted(async () => {
    if (!canvas0.value || !canvas1.value) {
        return;
    }

    // create dive instance
    dive.value = markRaw(await QuickView('sofa_B.glb', { canvas: canvas0.value, displayFloor: true }));

    // create clone
    const clone1 = dive.value.createView(dive.value.mainView.camera);

    // add cloned canvas to orbit controller
    dive.value.orbitController.addDomElements(clone1.canvas);

    // replace reference (vue related)
    canvas1.value.replaceWith(clone1.canvas);
    canvas1.value = clone1.canvas;
});

defineProps<{
    msg: string
}>()
</script>

<template>
    <ResizablePanels :initial-sizes="[100 / canvases.length, 100 / canvases.length]" :min-size="10"
        orientation="horizontal">
        <template #panel-0>
            <div class="canvasWrapper">
                <div class="overlay">
                    <p>Original</p>
                </div>
                <canvas ref="canvas0"></canvas>
            </div>
        </template>
        <template #panel-1>
            <div class="canvasWrapper">
                <div class="overlay">
                    <p>Clone</p>
                </div>
                <canvas ref="canvas1"></canvas>
            </div>
        </template>
    </ResizablePanels>

</template>

<style scoped lang="scss">
.canvasWrapper {
    position: relative;
    display: flex;
    height: 100%;
    width: 100%;

    justify-content: center;
    align-items: center;
}

canvas {
    width: 100%;
    height: 100%;
}

button {
    position: absolute;
    bottom: 20px;
}

.overlay {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;

    p {
        position: absolute;
        bottom: 20px;
        color: black;
        font-size: 30px;
        font-weight: bold;
        text-align: center;
    }
}
</style>