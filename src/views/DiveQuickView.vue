<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import { QuickView, type QuickView as QuickViewType } from '@shopware-ag/dive/quickview';
import { AssetExporter } from '@shopware-ag/dive/assetexporter';
import type { FileType } from '@shopware-ag/dive';

const canvas: Ref<HTMLCanvasElement | null> = ref(null);
const fileInput: Ref<HTMLInputElement | null> = ref(null);
const exportWrapper: Ref<HTMLElement | null> = ref(null);
const showExportMenu = ref(false);

let quickView: QuickViewType | null = null;
const exporter = new AssetExporter();

const exportFormats: FileType[] = ['glb', 'gltf', 'usdz'];

async function loadModel(uri: string) {
  if (!canvas.value) return;

  await quickView?.dispose();

  quickView = await QuickView(uri, { canvas: canvas.value, displayGrid: true });
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
  if (exportWrapper.value && !exportWrapper.value.contains(event.target as Node)) {
    showExportMenu.value = false;
  }
}

onMounted(() => {
  loadModel('sofa_B.glb');
  document.addEventListener('click', onClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside);
  if (quickView) {
    quickView.dispose();
  }
});

defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="canvasWrapper">
    <canvas ref="canvas"></canvas>
    <input ref="fileInput" type="file" :accept="exportFormats.join(',')" class="file-input" @change="onFileSelected" />
    <div class="controlPanel controlPanel--bottom">
      <div class="controlPanel-buttons">
        <button @click="fileInput?.click()">Upload File</button>
        <div ref="exportWrapper" class="export-wrapper">
          <button @click="showExportMenu = !showExportMenu">Export</button>
          <div v-if="showExportMenu" class="export-menu export-menu--up">
            <button v-for="format in exportFormats" :key="format" class="export-option" @click="exportModel(format)">
              .{{ format }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
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