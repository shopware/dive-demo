<script setup lang="ts">
import { computed, markRaw, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { QuickView, type QuickView as QuickViewType } from '@shopware-ag/dive/quickview';

type HDROption = {
  label: string;
  url: string;
};

const canvas = ref<HTMLCanvasElement | null>(null);
const dive = ref<QuickViewType | null>(null);
const loadingEnvironment = ref(false);
const environmentError = ref<string | null>(null);

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
let backgroundUpdateTimer: number | null = null;
let rotationUpdateTimer: number | null = null;

const getEnvironment = () => dive.value?.mainView.renderer.environment;

const applyHDR = async (url: string) => {
  const environment = getEnvironment();
  if (!environment) {
    return;
  }

  const requestId = ++environmentRequestId;
  loadingEnvironment.value = true;
  environmentError.value = null;

  try {
    await environment.setImageUrl(url);
  } catch (error) {
    if (requestId === environmentRequestId) {
      environmentError.value = error instanceof Error ? error.message : 'Failed to load HDR environment.';
    }
  } finally {
    if (requestId === environmentRequestId) {
      loadingEnvironment.value = false;
    }
  }
};

watch(useAsBackground, (enabled) => {
  if (backgroundUpdateTimer !== null) {
    window.clearTimeout(backgroundUpdateTimer);
  }

  backgroundUpdateTimer = window.setTimeout(() => {
    if (disposed) {
      return;
    }

    getEnvironment()?.setUseAsBackground(enabled);
  }, 50);
});

watch(rotationY, (degrees) => {
  const radians = (degrees * Math.PI) / 180;

  if (rotationUpdateTimer !== null) {
    window.clearTimeout(rotationUpdateTimer);
  }

  rotationUpdateTimer = window.setTimeout(() => {
    if (disposed) {
      return;
    }

    getEnvironment()?.setRotationY(radians);
  }, 50);
});

watch(selectedHDR, async (url) => {
  await applyHDR(url);
});

const initializeDive = async () => {
  await nextTick();
  await new Promise((resolve) => window.setTimeout(resolve, 50));

  if (!canvas.value || disposed) {
    return;
  }

  const quickView = await QuickView('sofa_B.glb', {
    canvas: canvas.value,
    displayGrid: false,
  });

  if (disposed) {
    await quickView.dispose();
    return;
  }

  dive.value = markRaw(quickView);
  getEnvironment()?.setUseAsBackground(useAsBackground.value);
  getEnvironment()?.setRotationY(0);
  await applyHDR(selectedHDR.value);
};

onMounted(() => {
  void initializeDive();
});

onUnmounted(() => {
  disposed = true;
  if (backgroundUpdateTimer !== null) {
    window.clearTimeout(backgroundUpdateTimer);
  }
  if (rotationUpdateTimer !== null) {
    window.clearTimeout(rotationUpdateTimer);
  }
  if (dive.value) {
    dive.value.dispose();
  }
});
</script>

<template>
  <div class="canvasWrapper">
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
