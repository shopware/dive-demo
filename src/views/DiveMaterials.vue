<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import { Pane } from 'tweakpane';
import {
    QuickView,
    type QuickView as QuickViewType,
} from '@shopware-ag/dive/quickview';
import { AssetExporter } from '@shopware-ag/dive/assetexporter';
import type { FileType } from '@shopware-ag/dive';
import type { MeshStandardMaterial, Texture } from 'three';
import CanvasFileDropOverlay from '@/components/canvas/CanvasFileDropOverlay.vue';

const canvas: Ref<HTMLCanvasElement | null> = ref(null);
const fileInput: Ref<HTMLInputElement | null> = ref(null);
const exportWrapper: Ref<HTMLElement | null> = ref(null);
const showExportMenu = ref(false);

type MaterialLayerKey =
    | 'map'
    | 'normalMap'
    | 'roughnessMap'
    | 'metalnessMap'
    | 'alphaMap'
    | 'aoMap';

type InspectableMaterial = MeshStandardMaterial & {
    useMap?: boolean;
    useNormalMap?: boolean;
    useRoughnessMap?: boolean;
    useMetalnessMap?: boolean;
    useAlphaMap?: boolean;
    useAOMap?: boolean;
    exclusive?: MaterialLayerKey | null;
    map?: Texture | null;
    normalMap?: Texture | null;
    roughnessMap?: Texture | null;
    metalnessMap?: Texture | null;
    alphaMap?: Texture | null;
    aoMap?: Texture | null;
};

type InspectableModel = QuickViewType['model'] & {
    material?: InspectableMaterial | null;
    _material?: InspectableMaterial | null;
};

const onlyBuffer = {
    useMap: false,
    useNormalMap: false,
    useRoughnessMap: false,
    useMetalnessMap: false,
    useAlphaMap: false,
    useAOMap: false,
};

const DEFAULT_URL = 'model/DamagedHelmet.glb';
let quickView: QuickViewType | null = null;
let pane: Pane | null = null;
const exporter = new AssetExporter();

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
    }

    buildPane();

    document.addEventListener('click', onClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', onClickOutside);

    if (quickView) {
        void quickView.disposeAsync();
    }
});

function getModelMaterial() {
    if (!quickView) return null;

    const model = quickView.model as InspectableModel;
    return model.material ?? model._material ?? null;
}

function bindExclusiveLayer(
    folder: ReturnType<Pane['addFolder']>,
    material: InspectableMaterial,
    useKey: keyof typeof onlyBuffer,
    layerKey: MaterialLayerKey,
) {
    const texture = material[layerKey];
    folder.addBinding(material, useKey, { label: 'Use', disabled: !texture });
    folder
        .addBinding(onlyBuffer, useKey, { label: 'Only', disabled: !texture })
        .on('change', (event) => {
            material.exclusive = event.value ? layerKey : null;
        });
}

function buildPane() {
    const material = getModelMaterial();

    if (!material) return;

    pane?.dispose();

    pane = new Pane({ title: 'Material' });

    bindExclusiveLayer(
        pane.addFolder({ title: 'Diffuse / Albedo' }),
        material,
        'useMap',
        'map',
    );
    bindExclusiveLayer(
        pane.addFolder({ title: 'Normal' }),
        material,
        'useNormalMap',
        'normalMap',
    );
    bindExclusiveLayer(
        pane.addFolder({ title: 'Roughness' }),
        material,
        'useRoughnessMap',
        'roughnessMap',
    );
    bindExclusiveLayer(
        pane.addFolder({ title: 'Metalness' }),
        material,
        'useMetalnessMap',
        'metalnessMap',
    );
    bindExclusiveLayer(
        pane.addFolder({ title: 'Alpha' }),
        material,
        'useAlphaMap',
        'alphaMap',
    );
    bindExclusiveLayer(
        pane.addFolder({ title: 'Ambient Occlusion' }),
        material,
        'useAOMap',
        'aoMap',
    );
}

async function loadFile(file: File) {
    if (!quickView) {
        return;
    }

    const url = URL.createObjectURL(file);

    try {
        await quickView.model.setFromURL(url);
        quickView.model.placeOnFloor();
        quickView.orbitController.focusObject(quickView.model);
    } finally {
        URL.revokeObjectURL(url);
    }

    buildPane();
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
        <input
            ref="fileInput"
            type="file"
            :accept="exportFormats.join(',')"
            class="file-input"
            @change="onFileSelected"
        />
        <div class="controlPanel controlPanel--bottom">
            <div class="controlPanel-buttons">
                <button @click="fileInput?.click()">Upload File</button>
                <div ref="exportWrapper" class="export-wrapper">
                    <button @click="showExportMenu = !showExportMenu">
                        Export
                    </button>
                    <div
                        v-if="showExportMenu"
                        class="export-menu export-menu--up"
                    >
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
