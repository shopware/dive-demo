<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref, markRaw } from 'vue';
import { QuickView, type QuickView as QuickViewType } from '@shopware-ag/dive/quickview';
import { AssetExporter } from '@shopware-ag/dive/assetexporter';
import type { FileType } from '@shopware-ag/dive';
import type { AnimationSystem, ClipAnimator, TAnimatorLoopMode } from '@shopware-ag/dive/animation';

const canvas: Ref<HTMLCanvasElement> = ref(document.createElement('canvas'));
const fileInput: Ref<HTMLInputElement | null> = ref(null);
const exportWrapper: Ref<HTMLElement | null> = ref(null);
const showExportMenu = ref(false);

let dive: QuickView | null = null;
let animationSystem: AnimationSystem | null = null;
let animator: ClipAnimator | null = null;

const exporter = new AssetExporter();
const exportFormats: FileType[] = ['glb', 'gltf', 'usdz'];

const clipNames: Ref<string[]> = ref([]);
const currentClip: Ref<string> = ref('');
const loopMode: Ref<TAnimatorLoopMode> = ref('once');
const isPlaying = ref(false);
const isPaused = ref(false);

async function loadModel(uri: string) {
    // dispose old dive and animation system
    await dive?.dispose();
    animationSystem?.dispose();

    // reset UI
    clipNames.value = [];
    currentClip.value = '';
    isPlaying.value = false;
    isPaused.value = false;

    // load new model
    dive = markRaw(await QuickView(uri, { canvas: canvas.value }));

    // set up animation system
    const { AnimationSystem } = await import('@shopware-ag/dive/animation');
    animationSystem = new AnimationSystem();
    dive.clock.addTicker(animationSystem);

    if (!dive.model.animations.length) return;

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

function onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    loadModel(url);
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
    loadModel('Fox.glb');
    document.addEventListener('click', onClickOutside);
});

onUnmounted(async () => {
    document.removeEventListener('click', onClickOutside);
    animationSystem?.dispose();
    await dive?.dispose();
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
        <div class="canvasWrapper">
            <canvas ref="canvas"></canvas>
            <input ref="fileInput" type="file" accept=".glb,.gltf,.usdz" class="file-input" @change="onFileSelected" />
            <div class="button-bar">
                <button class="action-button" @click="fileInput?.click()">
                    Upload File
                </button>
                <div ref="exportWrapper" class="export-wrapper">
                    <button class="action-button" @click="showExportMenu = !showExportMenu">
                        Export
                    </button>
                    <div v-if="showExportMenu" class="export-menu">
                        <button v-for="format in exportFormats" :key="format" class="export-option"
                            @click="exportModel(format)">
                            .{{ format }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="controlPanel">
            <div class="controlPanel-group">
                <span class="controlPanel-label">Clips</span>
                <div class="controlPanel-buttons">
                    <button v-for="name in clipNames" :key="name" :class="{ active: currentClip === name }"
                        @click="playClip(name)">
                        {{ name }}
                    </button>
                </div>
            </div>
            <div class="controlPanel-group">
                <div class="controlPanel-buttons controlPanel-buttons--center">
                    <button @click="togglePlayPause" :disabled="!currentClip">{{ isPlaying ? '⏸' : '▶' }}</button>
                    <button @click="stop" :disabled="!isPlaying && !isPaused">⏹</button>
                </div>
            </div>
            <div class="controlPanel-group">
                <span class="controlPanel-label">Loop</span>
                <div class="controlPanel-buttons">
                    <button v-for="mode in (['once', 'repeat', 'pingpong'] as TAnimatorLoopMode[])" :key="mode"
                        :class="{ active: loopMode === mode }" @click="setLoopMode(mode)">
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
}

.canvasWrapper {
    position: relative;
    display: flex;
    height: 100%;
    width: 100%;
}

.file-input {
    display: none;
}

.button-bar {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    margin: 1rem;
    display: flex;
    gap: 0.5rem;
}

.action-button {
    padding: 0.45rem 0.85rem;
    border-radius: 0.35rem;
    border: 1px solid #555;
    background-color: #2a2a2a;
    color: #eee;
    cursor: pointer;
    font-size: 0.8rem;
    transition: background-color 0.15s, border-color 0.15s;
}

.action-button:hover {
    background-color: #3a3a3a;
    border-color: #888;
}

.export-wrapper {
    position: relative;
}

.export-menu {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 0.25rem;
    display: flex;
    flex-direction: column;
    background-color: #2a2a2a;
    border: 1px solid #555;
    border-radius: 0.35rem;
    overflow: hidden;
    min-width: 100px;
}

.export-option {
    padding: 0.45rem 0.85rem;
    background: none;
    border: none;
    color: #eee;
    cursor: pointer;
    font-size: 0.8rem;
    text-align: left;
}

.export-option:hover {
    background-color: #3a3a3a;
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
    width: 2.5rem;
    text-align: center;
}
</style>
