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

  quickView = await QuickView(uri, { canvas: canvas.value });
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
    <div class="button-bar">
      <button class="action-button" @click="fileInput?.click()">
        Upload File
      </button>
      <div ref="exportWrapper" class="export-wrapper">
        <button class="action-button" @click="showExportMenu = !showExportMenu">
          Export
        </button>
        <div v-if="showExportMenu" class="export-menu">
          <button v-for="format in exportFormats" :key="format" class="export-option" @click="exportModel(format)">
            .{{ format }}
          </button>
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

.button-bar {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  margin: 1rem;
  display: flex;
  gap: 0.5rem;
}

.action-button {
  padding: 0.5rem 1rem;
  background-color: var(--color-background-active);
  color: var(--color-text);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  height: 50px;
  min-width: 120px;
  font-size: 1rem;
}

.export-wrapper {
  position: relative;
}

.export-menu {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 0.25rem;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-active);
  border-radius: 0.5rem;
  overflow: hidden;
  min-width: 120px;
}

.export-option {
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  color: var(--color-text);
  cursor: pointer;
  font-size: 1rem;
  text-align: left;
}

.export-option:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>