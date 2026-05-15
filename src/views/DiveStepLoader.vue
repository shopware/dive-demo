<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, type Ref, markRaw, nextTick } from 'vue';
import { QuickView } from '@shopware-ag/dive/quickview';
import { Mesh } from 'three';

const canvas: Ref<HTMLCanvasElement | null> = ref(null);
const uploadButton: Ref<HTMLButtonElement | null> = ref(null);
const uploadInput: Ref<HTMLInputElement | null> = ref(null);
const loading: Ref<boolean> = ref(false);
const error: Ref<string | null> = ref(null);
const timing: Ref<string | null> = ref(null);
const wireframe: Ref<boolean> = ref(false);

const DEFAULT_STEP_URL = 'model/D100.step';
let quickView: QuickView | null = null;
let disposed = false;

onMounted(async () => {
  if (!canvas.value) {
    return;
  }

  if (!quickView) {
    quickView = await QuickView(DEFAULT_STEP_URL, { canvas: canvas.value, displayGrid: true });
  }
});

onUnmounted(() => {
  disposed = true;
  void quickView?.disposeAsync();
  quickView = null;
});

async function onFileSelected(event: Event) {
  if(!canvas.value || !quickView) {
    return;
  }

  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  await quickView.model.setFromURL(url);
  quickView.model.placeOnFloor();
  quickView.orbitController.focusObject(quickView.model);
  URL.revokeObjectURL(url);
}

const setWireframe = (enabled: boolean) => {
  if (!quickView) return;
  quickView.scene.root.traverse((child) => {
    if (child instanceof Mesh) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => (m.wireframe = enabled));
      } else {
        child.material.wireframe = enabled;
      }
    }
  });
};

watch(wireframe, (val) => setWireframe(val));

defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="canvasWrapper">
    <canvas ref="canvas"></canvas>
    <div v-if="loading" class="loading">Loading STEP file…</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-if="timing" class="timing">{{ timing }}</div>
    <div class="controlPanel controlPanel--top-right">
      <div class="controlPanel-buttons">
        <label class="checkbox-button">
          <input type="checkbox" v-model="wireframe" :disabled="loading" />
          Wireframe
        </label>
        <button ref="uploadButton" @click="uploadInput?.click()">
          Upload STEP / IGES
        </button>
        <input type="file" ref="uploadInput" style="display: none" @change="onFileSelected"
          accept=".step,.stp,.iges,.igs" />
      </div>
    </div>
    <div class="label">occt-import-js</div>
  </div>
</template>

<style scoped>
.canvasWrapper {
  display: flex;
  height: 100%;
  min-height: 100vh;
  width: 100%;
  position: relative;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.loading,
.error {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem 1rem;
  border-radius: 0.35rem;
  font-size: 0.875rem;
  z-index: 10;
  background-color: var(--ui-panel-bg);
  border: 1px solid var(--ui-panel-border);
  color: var(--ui-btn-text);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.error {
  background: rgba(200, 50, 50, 0.85);
  border-color: rgba(200, 50, 50, 0.5);
  color: white;
}

.timing {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem 1rem;
  border-radius: 0.35rem;
  font-size: 0.875rem;
  background-color: var(--ui-panel-bg);
  border: 1px solid var(--ui-panel-border);
  color: var(--ui-btn-text);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 10;
  font-variant-numeric: tabular-nums;
}

.label {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.35rem;
  font-size: 0.75rem;
  background-color: var(--ui-panel-bg);
  border: 1px solid var(--ui-panel-border);
  color: var(--ui-label-text);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 10;
}
</style>
