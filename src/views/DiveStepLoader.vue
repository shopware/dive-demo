<script setup lang="ts">
import { ref, onMounted, type Ref, markRaw } from 'vue';
import { QuickView } from '@shopware-ag/dive/quickview';

const canvas: Ref<HTMLCanvasElement | undefined> = ref(undefined);
const dive: Ref<QuickView | null> = ref(null);
const uploadButton: Ref<HTMLButtonElement | null> = ref(null);
const uploadInput: Ref<HTMLInputElement | null> = ref(null);
const loading: Ref<boolean> = ref(false);
const error: Ref<string | null> = ref(null);
const timing: Ref<string | null> = ref(null);

// Sample STEP file – use cube.stp for reliable loading.
// D100.step and Mech-horsE.stp may fail (AP242/complex assemblies).
const DEFAULT_STEP_URL = '/D100.step';

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
    <div class="controls">
      <button ref="uploadButton" @click="uploadInput?.click()">
        Upload STEP / IGES
      </button>
      <input type="file" ref="uploadInput" style="display: none" @change="uploadFile" accept=".step,.stp,.iges,.igs" />
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
  border-radius: 4px;
  font-size: 0.875rem;
  z-index: 10;
}

.loading {
  background: rgba(0, 0, 0, 0.7);
  color: white;
}

.error {
  background: rgba(200, 50, 50, 0.9);
  color: white;
}

.timing {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  background: rgba(0, 0, 0, 0.7);
  color: #4fc3f7;
  z-index: 10;
  font-variant-numeric: tabular-nums;
}

.controls {
  position: absolute;
  top: 0;
  right: 0;
  margin: 1rem;
}

.label {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  background: rgba(0, 0, 0, 0.6);
  color: #ccc;
  z-index: 10;
}

button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.875rem;
}

button:hover {
  background: var(--color-background-active);
}
</style>
