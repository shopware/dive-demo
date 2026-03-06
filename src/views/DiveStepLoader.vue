<script setup lang="ts">
import { ref, onMounted, watch, type Ref, markRaw } from 'vue';
import { QuickView } from '@shopware-ag/dive/quickview';
import { Mesh } from 'three';

const canvas: Ref<HTMLCanvasElement | undefined> = ref(undefined);
const dive: Ref<QuickView | null> = ref(null);
const uploadButton: Ref<HTMLButtonElement | null> = ref(null);
const uploadInput: Ref<HTMLInputElement | null> = ref(null);
const loading: Ref<boolean> = ref(false);
const error: Ref<string | null> = ref(null);
const timing: Ref<string | null> = ref(null);
const wireframe: Ref<boolean> = ref(false);

// Sample STEP file – use cube.stp for reliable loading.
// D100.step and Mech-horsE.stp may fail (AP242/complex assemblies).
const DEFAULT_STEP_URL = 'D100.step';

onMounted(async () => {
  if (!canvas.value) {
    return;
  }

  await loadStepFile(DEFAULT_STEP_URL);
});

const loadStepFile = async (url: string) => {
  if (!canvas.value) return;

  loading.value = true;
  error.value = null;
  timing.value = null;

  const t0 = performance.now();

  try {
    dive.value?.dispose();
    dive.value = markRaw(
      await QuickView(url, { canvas: canvas.value }),
    );

    const elapsed = performance.now() - t0;
    timing.value = `Loaded in ${(elapsed / 1000).toFixed(2)}s`;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load STEP file';
  } finally {
    loading.value = false;
  }
};

const setWireframe = (enabled: boolean) => {
  if (!dive.value) return;
  dive.value.scene.root.traverse((child) => {
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

const uploadFile = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  await loadStepFile(url);
  URL.revokeObjectURL(url);
};

defineProps<{
  msg: string;
}>();
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
        <input type="file" ref="uploadInput" style="display: none" @change="uploadFile" accept=".step,.stp,.iges,.igs" />
      </div>
    </div>
    <div class="label">occt-import-js</div>
  </div>
</template>

<style scoped>
.canvasWrapper {
  display: flex;
  height: 100%;
  width: 100%;
  position: relative;
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
