<script setup lang="ts">
import { computed, markRaw, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { QuickView, type QuickView as QuickViewType } from '@shopware-ag/dive/quickview';
import { recordDiveDebugEvent, withDiveDebugSpan } from '@/utils/e2eDiagnostics';

type HDROption = {
  label: string;
  url: string;
};

const canvas = ref<HTMLCanvasElement | null>(null);
const dive = ref<QuickViewType | null>(null);
const loadingEnvironment = ref(false);
const environmentError = ref<string | null>(null);
const initError = ref<string | null>(null);
const initStage = ref('idle');
const ready = ref(false);

const hdrOptions: HDROption[] = [
  { label: 'Blocky Studio', url: 'blocky_photo_studio_1k.hdr' },
  { label: 'Brown Photostudio', url: 'brown_photostudio_02_1k.hdr' },
  { label: 'Hornkoppe Spring', url: 'horn-koppe_spring_1k.hdr' },
  { label: 'Qwantani Sunset', url: 'qwantani_sunset_puresky_1k.hdr' },
  { label: 'Studio Small', url: 'studio_small_09_1k.hdr' },
];

const selectedHDR = ref<string>(hdrOptions[0].url);
const useAsBackground = ref(true);
const rotationY = ref(0);
const selectedHDRLabel = computed(
  () => hdrOptions.find((option) => option.url === selectedHDR.value)?.label ?? hdrOptions[0].label,
);

let environmentRequestId = 0;
let disposed = false;

const logInit = (stage: string, details: Record<string, unknown> = {}) => {
  console.info('[DiveHDREnvironment]', stage, details);
  recordDiveDebugEvent('DiveHDREnvironment', stage, details);
};

const setInitStage = (stage: string, details: Record<string, unknown> = {}) => {
  initStage.value = stage;
  logInit(stage, details);
};

const getEnvironment = () => dive.value?.mainView.renderer.environment;

const hasQueryFlag = (flag: string) =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has(flag);

const shouldSkipHDRLoad = () => hasQueryFlag('skipHDRLoad');

const shouldStopRenderLoop = () => hasQueryFlag('stopRenderLoop');

const applyHDR = async (url: string) => {
  const environment = getEnvironment();
  if (!environment) {
    setInitStage('apply-hdr-skip', { url, reason: 'missing-environment' });
    return;
  }

  if (shouldSkipHDRLoad()) {
    loadingEnvironment.value = false;
    environmentError.value = null;
    initError.value = null;
    setInitStage('apply-hdr-skip', { url, reason: 'skip-query-param' });
    return;
  }

  const requestId = ++environmentRequestId;
  loadingEnvironment.value = true;
  environmentError.value = null;
  initError.value = null;
  setInitStage('apply-hdr-start', { url, requestId });

  try {
    await withDiveDebugSpan(
      'DiveHDREnvironment',
      'environment-set-image-url-call',
      () => environment.setImageUrl(url),
      { url, requestId },
    );
    setInitStage('apply-hdr-resolved', { url, requestId });
  } catch (error) {
    if (requestId === environmentRequestId) {
      environmentError.value = error instanceof Error ? error.message : 'Failed to load HDR environment.';
    }
    initError.value = error instanceof Error ? error.message : 'Failed to load HDR environment.';
    setInitStage('apply-hdr-failed', { url, requestId, message: initError.value });
    console.error('[DiveHDREnvironment]', 'apply-hdr-failed', error);
  } finally {
    if (requestId === environmentRequestId) {
      loadingEnvironment.value = false;
    }
  }
};

watch(useAsBackground, (enabled) => {
  if (disposed) {
    return;
  }

  getEnvironment()?.setUseAsBackground(enabled);
});

watch(rotationY, (degrees) => {
  const radians = (degrees * Math.PI) / 180;

  if (disposed) {
    return;
  }

  getEnvironment()?.setRotationY(radians);
});

const scheduleHDRApply = (url: string, reason: string) => {
  logInit('apply-hdr-scheduled', {
    url,
    reason,
    nextRequestId: environmentRequestId + 1,
  });
  void applyHDR(url);
};

watch(selectedHDR, (url) => {
  scheduleHDRApply(url, 'selection-change');
});

const initializeDive = async () => {
  ready.value = false;
  initError.value = null;
  setInitStage('init-start', { hasCanvas: Boolean(canvas.value), disposed });
  await nextTick();

  if (!canvas.value || disposed) {
    setInitStage('init-skip', { hasCanvas: Boolean(canvas.value), disposed });
    return;
  }

  setInitStage('quick-view-start', { uri: 'sofa_B.glb' });
  const quickView = await withDiveDebugSpan(
    'DiveHDREnvironment',
    'quick-view-call',
    () => QuickView('sofa_B.glb', {
      canvas: canvas.value!,
      displayGrid: false,
    }),
    { uri: 'sofa_B.glb', displayGrid: false },
  );
  setInitStage('quick-view-resolved', { uri: 'sofa_B.glb', disposed });

  if (disposed) {
    setInitStage('quick-view-dispose-stale', { uri: 'sofa_B.glb' });
    await quickView.disposeAsync();
    return;
  }

  dive.value = markRaw(quickView);
  setInitStage('dive-assigned');
  getEnvironment()?.setUseAsBackground(useAsBackground.value);
  getEnvironment()?.setRotationY(0);
  setInitStage('environment-baseline-applied', { useAsBackground: useAsBackground.value, rotationY: 0 });
  scheduleHDRApply(selectedHDR.value, 'initial');

  if (shouldStopRenderLoop()) {
    quickView.stop();
    setInitStage('render-loop-stopped', { reason: 'query-param' });
  }

  ready.value = true;
  setInitStage('ready-true', {
    selectedHDR: selectedHDR.value,
    loadingEnvironment: loadingEnvironment.value,
  });
};

onMounted(() => {
  void initializeDive().catch((error: unknown) => {
    initError.value = error instanceof Error ? error.message : 'Dive HDR initialization failed.';
    setInitStage('init-failed', { message: initError.value });
    console.error('[DiveHDREnvironment]', 'init-failed', error);
  });
});

onUnmounted(() => {
  disposed = true;
  ready.value = false;
  setInitStage('unmounted');
  if (dive.value) {
    dive.value.disposeAsync();
  }
});
</script>

<template>
  <div class="canvasWrapper" data-testid="hdr-environment-page" :data-ready="ready ? 'true' : 'false'"
    :data-init-stage="initStage" :data-init-error="initError ?? ''">
    <canvas ref="canvas"></canvas>

    <div class="controlPanel controlPanel--top controlPanel--row" data-testid="hdr-control-panel">
      <div class="controlPanel-group">
        <span class="controlPanel-label">HDR Preset</span>
        <select v-model="selectedHDR" class="hdrSelect" aria-label="HDR Preset" data-testid="hdr-select">
          <option v-for="option in hdrOptions" :key="option.url" :value="option.url" data-testid="hdr-option">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="controlPanel-group controlPanel-group--wide">
        <span class="controlPanel-label">Rotation Y</span>
        <div class="sliderRow">
          <input v-model="rotationY" type="range" min="-180" max="180" step="1" aria-label="Rotation Y"
            data-testid="hdr-rotation" />
          <span class="sliderValue" data-testid="hdr-slider-value">{{ rotationY }}&deg;</span>
        </div>
      </div>

      <div class="controlPanel-group">
        <span class="controlPanel-label">Background</span>
        <label class="checkbox-button">
          <input v-model="useAsBackground" type="checkbox" aria-label="Show HDR as background"
            data-testid="hdr-background" />
          Show HDR as background
        </label>
      </div>
    </div>

    <div class="infoBadge" data-testid="hdr-info-badge">
      <span>{{ selectedHDRLabel }}</span>
      <span v-if="loadingEnvironment">Loading HDR…</span>
      <span v-else-if="environmentError">{{ environmentError }}</span>
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

.controlPanel-group--wide {
  min-width: 20rem;
}

.hdrSelect {
  min-width: 14rem;
  padding: 0.45rem 0.85rem;
  border-radius: 0.35rem;
  border: 1px solid var(--ui-btn-border);
  background-color: var(--ui-btn-bg);
  color: var(--ui-btn-text);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.sliderRow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sliderRow input[type='range'] {
  width: 100%;
}

.sliderValue {
  min-width: 4rem;
  text-align: right;
  color: var(--ui-btn-text);
  font-variant-numeric: tabular-nums;
}

.checkbox-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ui-btn-text);
}

.infoBadge {
  position: absolute;
  left: 1rem;
  bottom: 1rem;
  display: inline-flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.6rem 0.85rem;
  border-radius: 0.75rem;
  background-color: var(--ui-panel-bg);
  border: 1px solid var(--ui-panel-border);
  color: var(--ui-btn-text);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
</style>
