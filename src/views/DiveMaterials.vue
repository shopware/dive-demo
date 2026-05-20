<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import {
    QuickView,
    type QuickView as QuickViewType,
} from '@shopware-ag/dive/quickview';
import { AssetExporter } from '@shopware-ag/dive/assetexporter';
import type { FileType } from '@shopware-ag/dive';
import CanvasFileDropOverlay from '@/components/canvas/CanvasFileDropOverlay.vue';
import { useDiveMaterialControls } from '@/composables/useDiveMaterialControls';

const canvas: Ref<HTMLCanvasElement | null> = ref(null);
const fileInput: Ref<HTMLInputElement | null> = ref(null);
const exportWrapper: Ref<HTMLElement | null> = ref(null);
const showExportMenu = ref(false);

const DEFAULT_URL = 'model/DamagedHelmet.glb';
let quickView: QuickViewType | null = null;
const exporter = new AssetExporter();
const materialControls = useDiveMaterialControls({
    getModel: () => quickView?.model,
});

const exportFormats: FileType[] = ['glb', 'gltf', 'usdz'];

onMounted(async () => {
    if (!canvas.value) {
        return;
    }

    if (!quickView) {
        quickView = await QuickView(DEFAULT_URL, {
            canvas: canvas.value,
            displayGrid: true,
        });
        quickView.mainView.renderer.environment.setUseAsBackground(true);
    }

    materialControls.rebuildPane();

    document.addEventListener('click', onClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', onClickOutside);
    materialControls.disposePane();

    if (quickView) {
        void quickView.disposeAsync();
    }
});

async function loadFile(file: File) {
    if (!quickView) {
        return;
    }

    const url = URL.createObjectURL(file);
    materialControls.resetMaterial();

    try {
        await quickView.model.setFromURL(url);
        quickView.model.placeOnFloor();
        quickView.orbitController.focusObject(quickView.model);
    } finally {
        URL.revokeObjectURL(url);
    }

    materialControls.rebuildPane();
}

async function onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    await loadFile(file);
    input.value = '';
}

async function exportModel(type: FileType) {
    showExportMenu.value = false;
    if (!quickView) return;

    const buffer = await exporter.export(quickView.model, type);
    const blob = new Blob([buffer]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model.${type}`;
    a.click();
    URL.revokeObjectURL(url);
}

function onClickOutside(event: MouseEvent) {
    if (
        exportWrapper.value &&
        !exportWrapper.value.contains(event.target as Node)
    ) {
        showExportMenu.value = false;
    }
}

defineProps<{
    msg: string;
}>();
</script>

<template>
    <CanvasFileDropOverlay class="canvasWrapper" @loading="loadFile">
        <canvas ref="canvas"></canvas>
        <input ref="fileInput" type="file" :accept="exportFormats.join(',')" class="file-input"
            @change="onFileSelected" />
        <div class="controlPanel controlPanel--bottom">
            <div class="controlPanel-buttons">
                <button @click="fileInput?.click()">Upload File</button>
                <div ref="exportWrapper" class="export-wrapper">
                    <button @click="showExportMenu = !showExportMenu">
                        Export
                    </button>
                    <div v-if="showExportMenu" class="export-menu export-menu--up">
                        <button v-for="format in exportFormats" :key="format" class="export-option"
                            @click="exportModel(format)">
                            .{{ format }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </CanvasFileDropOverlay>
</template>

<style scoped>
.canvasWrapper {
    position: relative;
    display: flex;
    height: 100%;
    width: 100%;
}

.file-input {
    display: none;
}
</style>
