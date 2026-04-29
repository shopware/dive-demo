<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import { QuickView, type QuickView as QuickViewType } from '@shopware-ag/dive/quickview';
import { AssetExporter } from '@shopware-ag/dive/assetexporter';
import type { FileType } from '@shopware-ag/dive';
import { recordDiveDebugEvent, withDiveDebugSpan } from '@/utils/e2eDiagnostics';

const canvas: Ref<HTMLCanvasElement | null> = ref(null);
const fileInput: Ref<HTMLInputElement | null> = ref(null);
const exportWrapper: Ref<HTMLElement | null> = ref(null);
const showExportMenu = ref(false);
const ready = ref(false);

let quickView: QuickViewType | null = null;
const exporter = new AssetExporter();

const logInit = (stage: string, details: Record<string, unknown> = {}) => {
  console.info('[DiveQuickView]', stage, details);
  recordDiveDebugEvent('DiveQuickView', stage, details);
};

const exportFormats: FileType[] = ['glb', 'gltf', 'usdz'];

async function loadModel(uri: string) {
  logInit('load-model-start', { uri, hasCanvas: Boolean(canvas.value) });
  if (!canvas.value) {
    logInit('load-model-skip', { uri, reason: 'missing-canvas' });
    return;
  }

  ready.value = false;
  logInit('ready-false', { uri });

  if (!quickView) {
    logInit('quick-view-start', { uri });
    quickView = await withDiveDebugSpan(
      'DiveQuickView',
      'quick-view-call',
      () => QuickView(uri, { canvas: canvas.value!, displayGrid: true }),
      { uri, displayGrid: true },
    );
    logInit('quick-view-resolved', { uri });
  } else {
    logInit('model-replace-start', { uri });
    await withDiveDebugSpan(
      'DiveQuickView',
      'model-set-from-url-call',
      () => quickView!.model.setFromURL(uri),
      { uri },
    );
    quickView.model.placeOnFloor();
    quickView.orbitController.focusObject(quickView.model);
    logInit('model-replace-complete', { uri });
  }

  ready.value = true;
  logInit('ready-true', { uri });
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  void loadModel(url)
    .catch((error: unknown) => {
      console.error('[DiveQuickView]', 'load-model-failed', error);
    })
    .finally(() => {
      URL.revokeObjectURL(url);
    });
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
  void loadModel('sofa_B.glb').catch((error: unknown) => {
    console.error('[DiveQuickView]', 'load-model-failed', error);
  });
  document.addEventListener('click', onClickOutside);
});

onUnmounted(() => {
  ready.value = false;
  logInit('unmounted');
  document.removeEventListener('click', onClickOutside);
  if (quickView) {
    quickView.disposeAsync();
  }
});

defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="canvasWrapper" data-testid="quick-view-page" :data-ready="ready ? 'true' : 'false'">
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
