<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref, markRaw, nextTick } from 'vue';
import { QuickView } from '@shopware-ag/dive/quickview';
import { AssetExporter } from '@shopware-ag/dive/assetexporter';
import type { FileType } from '@shopware-ag/dive';
import { AnimationSystem, type ClipAnimator, type TAnimatorLoopMode } from '@shopware-ag/dive/animation';
import CanvasFileDropOverlay from '@/components/canvas/CanvasFileDropOverlay.vue';

const canvas: Ref<HTMLCanvasElement | null> = ref(null);
const fileInput: Ref<HTMLInputElement | null> = ref(null);
const exportWrapper: Ref<HTMLElement | null> = ref(null);
const showExportMenu = ref(false);

let dive: QuickView | null = null;
let animationSystem: AnimationSystem | null = null;
let animator: ClipAnimator | null = null;
let disposed = false;

const exporter = new AssetExporter();
const exportFormats: FileType[] = ['glb', 'gltf', 'usdz'];

const clipNames: Ref<string[]> = ref([]);
const currentClip: Ref<string> = ref('');
const loopMode: Ref<TAnimatorLoopMode> = ref('once');
const isPlaying = ref(false);
const isPaused = ref(false);

async function loadModel(uri: string) {
    const targetCanvas = canvas.value;

    if (!targetCanvas || disposed) {
        return;
    }

    // dispose old dive and animation system
    await dive?.disposeAsync();
    animationSystem?.dispose();

    // reset UI
    clipNames.value = [];
    currentClip.value = '';
    isPlaying.value = false;
    isPaused.value = false;

    // load new model
    dive = markRaw(await QuickView(uri, { canvas: targetCanvas }));

    // set up animation system
    animationSystem = new AnimationSystem();
    dive.clock.addTicker(animationSystem);

    if (!dive.model.animations.length) {
        return;
    }

    // create new animator
    animator = await animationSystem.fromClips(dive.model, dive.model.animations);
    clipNames.value = animator.clipNames;

    // set up event listeners
    animator.addEventListener('complete', () => {
        isPlaying.value = false;
        isPaused.value = false;
    });

    animator.addEventListener('stop', () => {
        isPlaying.value = false;
        isPaused.value = false;
        currentClip.value = '';
    });

    // play first clip and set loop mode
    playClip(clipNames.value[0]);
    setLoopMode('repeat');
}

function loadFile(file: File) {
    const url = URL.createObjectURL(file);
    void loadModel(url).finally(() => {
        URL.revokeObjectURL(url);
    });
}

function onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    loadFile(file);
    input.value = '';
}

async function exportModel(type: FileType) {
    showExportMenu.value = false;

    if (!dive) return;

    const buffer = await exporter.export(dive.model, type);
    const blob = new Blob([buffer]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model.${type}`;
    a.click();
    URL.revokeObjectURL(url);
}

function onClickOutside(event: MouseEvent) {
    if (exportWrapper.value && !exportWrapper.value.contains(event.target as Node)) {
        showExportMenu.value = false;
    }
}

onMounted(() => {
    void (async () => {
        await nextTick();
        await loadModel('model/Fox.glb');
    })().catch(() => undefined);
    document.addEventListener('click', onClickOutside);
});

onUnmounted(async () => {
    disposed = true;
    document.removeEventListener('click', onClickOutside);
    animationSystem?.dispose();
    await dive?.disposeAsync();
});

const playClip = (name: string) => {
    if (!animator) return;

    animator.play(name);
    currentClip.value = name;
    isPlaying.value = true;
    isPaused.value = false;
};

const togglePlayPause = () => {
    if (!animator) return;

    if (isPlaying.value) {
        animator.pause();
        isPlaying.value = false;
        isPaused.value = true;

    } else if (isPaused.value) {
        animator.resume();
        isPlaying.value = true;
        isPaused.value = false;

    } else {
        animator.play(currentClip.value);
        isPlaying.value = true;
        isPaused.value = false;
    }
};

const stop = () => {
    if (!animator) return;

    animator.stop();
};

const setLoopMode = (mode: TAnimatorLoopMode) => {
    if (!animator) return;

    animator.loop = mode;
    loopMode.value = mode;
};
</script>

<template>
    <div class="page">
        <CanvasFileDropOverlay class="canvasWrapper" @loading="loadFile">
            <canvas ref="canvas"></canvas>
            <input
                ref="fileInput"
                type="file"
                accept=".glb,.gltf,.usdz"
                class="file-input"
                @change="onFileSelected"
            />
            <div class="controlPanel controlPanel--top">
                <div class="controlPanel-buttons">
                    <button @click="fileInput?.click()">Upload File</button>
                    <div ref="exportWrapper" class="export-wrapper">
                        <button @click="showExportMenu = !showExportMenu">
                            Export
                        </button>
                        <div v-if="showExportMenu" class="export-menu">
                            <button
                                v-for="format in exportFormats"
                                :key="format"
                                class="export-option"
                                @click="exportModel(format)"
                            >
                                .{{ format }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </CanvasFileDropOverlay>
        <div class="controlPanel">
            <div class="controlPanel-group">
                <span class="controlPanel-label">Clips</span>
                <div class="controlPanel-buttons">
                    <button
                        v-for="name in clipNames"
                        :key="name"
                        :class="{ active: currentClip === name }"
                        @click="playClip(name)"
                    >
                        {{ name }}
                    </button>
                </div>
            </div>
            <div class="controlPanel-group">
                <div class="controlPanel-buttons controlPanel-buttons--center">
                    <button @click="togglePlayPause" :disabled="!currentClip">
                        {{ isPlaying ? '⏸' : '▶' }}
                    </button>
                    <button @click="stop" :disabled="!isPlaying && !isPaused">
                        ⏹
                    </button>
                </div>
            </div>
            <div class="controlPanel-group">
                <span class="controlPanel-label">Loop</span>
                <div class="controlPanel-buttons">
                    <button
                        v-for="mode in (['once', 'repeat', 'pingpong'] as TAnimatorLoopMode[])"
                        :key="mode"
                        :class="{ active: loopMode === mode }"
                        @click="setLoopMode(mode)"
                    >
                        {{ mode }}
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
    position: relative;
    display: flex;
    height: 100%;
    min-height: 24rem;
    width: 100%;
}

canvas {
    display: block;
    width: 100%;
    height: 100%;
}

.file-input {
    display: none;
}

.controlPanel-buttons--center button {
    width: 2.5rem;
    text-align: center;
}
</style>
