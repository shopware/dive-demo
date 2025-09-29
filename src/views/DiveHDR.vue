<script setup lang="ts">
import { ref, onMounted, type Ref, markRaw } from 'vue';
import ResizablePanels from '@/components/layout/ResizablePanels.vue';
import { QuickView } from '@shopware-ag/dive/quickview';
import { DIVEMath } from '@shopware-ag/dive';

const canvas: Ref<HTMLCanvasElement | null> = ref(null)
const canvasHDR: Ref<HTMLCanvasElement | null> = ref(null)

const canvases: Ref<HTMLCanvasElement | null>[] = [canvas, canvasHDR];

const dive: Ref<QuickView | null> = ref(null)
const diveHDR: Ref<QuickView | null> = ref(null)

const imageurl: Ref<string> = ref('default.hdr')
const hdrOptions = [
    'default.hdr',
    'studio_small_09_1k.hdr',
    'blocky_photo_studio_1k.hdr',
    'brown_photostudio_02_1k.hdr',
    'qwantani_sunset_puresky_1k.hdr',
    'horn-koppe_spring_1k.hdr',
] as const

onMounted(async () => {
    if (!canvas.value || !canvasHDR.value) {
        return;
    }

    dive.value = markRaw(await QuickView('astronaut_helmet.glb', {
        canvas: canvas.value, displayFloor: false, hdr: {
            enabled: false,
        }
    }));

    diveHDR.value = markRaw(await QuickView('astronaut_helmet.glb', {
        canvas: canvasHDR.value, displayFloor: false, hdr: {
            enabled: true,
            imageUrl: imageurl.value,
            exposure: 1.0,
            replaceLights: true,
            useAsBackground: true,
            rotateY: DIVEMath.degToRad(0),
        },
    }));
})

const switchImage = async (value: string) => {
    await diveHDR.value?.hdr.setImageUrl(value);
}

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
                    <p>Classic</p>
                </div>
                <canvas ref="canvas"></canvas>
            </div>
        </template>
        <template #panel-1>
            <div class="canvasWrapper">
                <div class="overlay">
                    <p>HDR</p>
                    <div class="controls">
                        <label>
                            HDR Texture
                            <select v-model="imageurl" @change="switchImage(imageurl)">
                                <option v-for="option in hdrOptions" :key="option" :value="option">{{ option }}</option>
                            </select>
                        </label>
                    </div>
                </div>
                <canvas ref="canvasHDR"></canvas>
            </div>
        </template>
    </ResizablePanels>
</template>

<style scoped>
.canvasWrapper {
    position: relative;
    display: flex;
    height: 100%;
    width: 100%;

    justify-content: center;
    align-items: center;
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

    .controls {
        position: absolute;
        top: 20px;
        right: 20px;
        display: flex;
        gap: 8px;
        background-color: rgba(255, 255, 255, 0.85);
        padding: 8px 12px;
        border-radius: 8px;
        pointer-events: all;

        label {
            display: flex;
            flex-direction: column;
            font-size: 14px;
            font-weight: 600;
            color: black;
        }

        select {
            margin-top: 4px;
            padding: 6px 10px;
            border: none;
            border-radius: 6px;
            background-color: #e0f2ff;
            color: black;
            cursor: pointer;
            min-width: 200px;
        }
    }
}
</style>