<script setup lang="ts">
import { markRaw, onMounted, onUnmounted, ref, watch } from 'vue';
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

let environmentRequestId = 0;

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
  getEnvironment()?.setUseAsBackground(enabled);
});

watch(rotationY, (degrees) => {
  const radians = (degrees * Math.PI) / 180;
  getEnvironment()?.setRotationY(radians);
});

watch(selectedHDR, async (url) => {
  await applyHDR(url);
});

onMounted(async () => {
  if (!canvas.value) {
    return;
  }

  dive.value = markRaw(
    await QuickView('sofa_B.glb', {
      canvas: canvas.value,
      displayGrid: false,
    }),
  );

  getEnvironment()?.setUseAsBackground(useAsBackground.value);
  getEnvironment()?.setRotationY(0);
  await applyHDR(selectedHDR.value);
});

onUnmounted(() => {
  if (dive.value) {
    dive.value.dispose();
  }
});
</script>

<template>
  <div class="canvasWrapper">
    <canvas ref="canvas"></canvas>

    <div class="controlPanel controlPanel--top controlPanel--row">
      <div class="controlPanel-group">
        <span class="controlPanel-label">HDR Preset</span>
        <select v-model="selectedHDR" class="hdrSelect">
          <option v-for="option in hdrOptions" :key="option.url" :value="option.url">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="controlPanel-group controlPanel-group--wide">
        <span class="controlPanel-label">Rotation Y</span>
        <div class="sliderRow">
          <input v-model="rotationY" type="range" min="-180" max="180" step="1" />
          <span class="sliderValue">{{ rotationY }}&deg;</span>
        </div>
      </div>

      <div class="controlPanel-group">
        <span class="controlPanel-label">Background</span>
        <label class="checkbox-button">
          <input v-model="useAsBackground" type="checkbox" />
          Show HDR as background
        </label>
      </div>
    </div>

    <div class="infoBadge">
      <span v-if="environmentError">{{ environmentError }}</span>
      <span v-else>{{ loadingEnvironment ? 'Loading HDR…' : 'HDR ready' }}</span>
      <span>{{ hdrOptions.find((option) => option.url === selectedHDR)?.label }}</span>
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
