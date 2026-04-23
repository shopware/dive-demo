<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, type Ref, markRaw, nextTick } from 'vue';
import { QuickView } from '@shopware-ag/dive/quickview';
import { Mesh } from 'three';

const canvas: Ref<HTMLCanvasElement | null> = ref(null);
const dive: Ref<QuickView | null> = ref(null);
const uploadButton: Ref<HTMLButtonElement | null> = ref(null);
const uploadInput: Ref<HTMLInputElement | null> = ref(null);
const loading: Ref<boolean> = ref(false);
const error: Ref<string | null> = ref(null);
const timing: Ref<string | null> = ref(null);
const wireframe: Ref<boolean> = ref(false);
const ready: Ref<boolean> = ref(false);

// Keep the original demo asset; CI stability must not change the showcased model.
const DEFAULT_STEP_URL = 'D100.step';
const STEP_LOAD_TIMEOUT_MS = 120000;
const INITIAL_LOAD_DELAY_MS = 150;
let disposed = false;

const waitForPresentationFrames = async (frames = 2) => {
  for (let index = 0; index < frames; index += 1) {
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }
};

const shouldAutoloadDefaultStep = () => {
  const search = new URLSearchParams(window.location.search);
  return search.get('autoload') !== '0';
};

const getRequestedStepUrl = () => {
  const search = new URLSearchParams(window.location.search);
  return search.get('url')?.trim() || null;
};

const initializeStep = async (url: string) => {
  await nextTick();
  await new Promise((resolve) => window.setTimeout(resolve, INITIAL_LOAD_DELAY_MS));

  if (!canvas.value || disposed) {
    return;
  }

  await loadStepFile(url);
};

const loadStepFile = async (url: string) => {
  if (!canvas.value || disposed) return;

  loading.value = true;
  ready.value = false;
  error.value = null;
  timing.value = null;

  const t0 = performance.now();

  try {
    let timeoutId: number | undefined;

    try {
      await dive.value?.disposeAsync();
      dive.value = null;

      if (!canvas.value || disposed) {
        return;
      }

      const nextDive = await Promise.race([
        QuickView(url, { canvas: canvas.value }),
        new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => {
            reject(new Error(`STEP loading timed out after ${STEP_LOAD_TIMEOUT_MS / 1000}s`));
          }, STEP_LOAD_TIMEOUT_MS);
        }),
      ]);

      if (disposed) {
        await nextDive.disposeAsync();
        return;
      }

      dive.value = markRaw(nextDive);

      const elapsed = performance.now() - t0;
      timing.value = `Loaded in ${(elapsed / 1000).toFixed(2)}s`;
      error.value = null;
      await waitForPresentationFrames();
      ready.value = true;
    } finally {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load STEP file';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  const requestedStepUrl = getRequestedStepUrl();

  if (requestedStepUrl) {
    void initializeStep(requestedStepUrl);
    return;
  }

  if (shouldAutoloadDefaultStep()) {
    void initializeStep(DEFAULT_STEP_URL);
  }
});

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

onUnmounted(() => {
  disposed = true;
  ready.value = false;
  void dive.value?.disposeAsync();
  dive.value = null;
});
</script>

<template>
  <div class="canvasWrapper" data-testid="step-loader-page" :data-ready="ready ? 'true' : 'false'">
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
        <input type="file" ref="uploadInput" style="display: none" @change="uploadFile"
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
