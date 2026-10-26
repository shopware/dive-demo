<script setup lang="ts">
import { computed, markRaw, nextTick, onMounted, onUnmounted, ref, type Ref, watch } from 'vue';
import { DIVENode, GroundProjectionComponent, SoftShadowComponent } from '@shopware-ag/dive';
import { QuickView } from '@shopware-ag/dive/quickview';
import CanvasFileDropOverlay from '@/components/canvas/CanvasFileDropOverlay.vue';

type HDROption = {
  label: string;
  url: string;
};

type BackgroundMode = 'none' | 'image' | 'dome';

const canvas = ref<HTMLCanvasElement | null>(null);
const dive: Ref<QuickView | null> = ref(null);
const loadingEnvironment = ref(false);
const environmentError = ref<string | null>(null);

const hdrOptions: HDROption[] = [
  { label: 'Blocky Studio', url: 'hdri/blocky_photo_studio_1k.hdr' },
  { label: 'Brown Photostudio', url: 'hdri/brown_photostudio_02_1k.hdr' },
  { label: 'Hornkoppe Spring', url: 'hdri/horn-koppe_spring_1k.hdr' },
  { label: 'Qwantani Sunset', url: 'hdri/qwantani_sunset_puresky_1k.hdr' },
  { label: 'Studio Small', url: 'hdri/studio_small_09_1k.hdr' },
];

const selectedHDR = ref<string>(hdrOptions[0].url);
const backgroundMode = ref<BackgroundMode>('dome');
const rotationY = ref(0);
const intensity = ref(1);
const domeHeight = ref(1.5);
const domeRadius = ref(50);
const softShadow = ref(true);
const selectedHDRLabel = computed(
  () => hdrOptions.find((option) => option.url === selectedHDR.value)?.label ?? hdrOptions[0].label,
);

let environmentRequestId = 0;
let disposed = false;
let dome: GroundProjectionComponent | null = null;

const radians = () => (Number(rotationY.value) * Math.PI) / 180;

const ensureDome = (quickView: QuickView) => {
  if (dome) {
    return dome;
  }

  const node = new DIVENode();
  node.name = 'DemoDome';
  dome = node.addComponent(new GroundProjectionComponent());

  /** on the scene, not the root, so it stays out of the entity tree */
  quickView.scene.add(node);
  return dome;
};

/**
 * light, background and dome all take the url; the same url is loaded once
 * and shared, so awaiting all three waits for that one load
 */
const applySurroundings = async () => {
  const quickView = dive.value;
  if (!quickView || disposed) {
    return;
  }

  const url = selectedHDR.value;
  const rotation = radians();
  const showDome = backgroundMode.value === 'dome';

  const domeComponent = ensureDome(quickView)
    .applySettings({ height: Number(domeHeight.value), radius: Number(domeRadius.value) })
    .setVisibility(showDome);

  /** turned with the light, so light and backdrop agree */
  if (domeComponent.owner) {
    domeComponent.owner.rotation.y = rotation;
  }

  /**
   * the projection only holds near where the image was taken, and the camera
   * has to stay inside the dome either way
   */
  quickView.orbitController.maxDistance = showDome ? Math.min(Number(domeRadius.value) * 0.8, 10) : Infinity;

  const requestId = ++environmentRequestId;
  loadingEnvironment.value = true;
  environmentError.value = null;

  try {
    await Promise.all([
      quickView.scene.setImageBasedLight({ image: url, rotation, intensity: Number(intensity.value) }),
      quickView.scene.setBackground(backgroundMode.value === 'image' ? { image: url, rotation } : null),
      domeComponent.setImage(showDome ? url : null),
    ]);
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

/**
 * QuickView reuses the model node across loads, so a shadow from an earlier
 * load is still there and re-bakes itself for the new content
 */
const applySoftShadow = () => {
  const node = dive.value?.model;
  if (!node) {
    return;
  }

  const shadow = node.getComponent(SoftShadowComponent) ?? node.addComponent(new SoftShadowComponent());
  shadow.setVisibility(softShadow.value);
};

watch([selectedHDR, backgroundMode, rotationY, intensity, domeHeight, domeRadius], () => {
  if (disposed) {
    return;
  }

  void applySurroundings();
});

watch(softShadow, () => {
  if (disposed) {
    return;
  }

  applySoftShadow();
});

const initializeDive = async () => {
  await nextTick();

  const targetCanvas = canvas.value;

  if (!targetCanvas || disposed) {
    return;
  }

  /**
   * the initial surroundings go in as settings, so the first frame is lit by
   * the chosen HDR and the default one is never loaded
   */
  const rotation = radians();
  const quickView = await QuickView('model/sofa_B.glb', {
    canvas: targetCanvas,
    displayGrid: false,
    imageBasedLight: { image: selectedHDR.value, rotation, intensity: Number(intensity.value) },
    background: backgroundMode.value === 'image' ? { image: selectedHDR.value, rotation } : null,
  });

  if (disposed) {
    await quickView.disposeAsync();
    return;
  }

  dive.value = markRaw(quickView);
  applySoftShadow();
  await applySurroundings();
};

const loadFile = async (file: File) => {
  if (!dive.value || disposed) {
    return;
  }

  const url = URL.createObjectURL(file);

  try {
    await dive.value.load(url);
    applySoftShadow();
  } finally {
    URL.revokeObjectURL(url);
  }
};

onMounted(() => {
  void initializeDive().catch(() => undefined);
});

onUnmounted(() => {
  disposed = true;
  const quickView = dive.value;
  dome = null;

  if (quickView) {
    void quickView.disposeAsync();
  }
});
</script>

<template>
  <CanvasFileDropOverlay class="canvasWrapper" @loading="loadFile">
    <canvas ref="canvas"></canvas>

    <div class="controlPanel controlPanel--top controlPanel--row">
      <div class="controlPanel-group">
        <span class="controlPanel-label">HDR Preset</span>
        <select v-model="selectedHDR" class="hdrSelect" aria-label="HDR Preset">
          <option v-for="option in hdrOptions" :key="option.url" :value="option.url">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="controlPanel-group controlPanel-group--wide">
        <span class="controlPanel-label">Rotation Y</span>
        <div class="sliderRow">
          <input v-model="rotationY" type="range" min="-180" max="180" step="1" aria-label="Rotation Y" />
          <span class="sliderValue">{{ rotationY }}&deg;</span>
        </div>
      </div>

      <div class="controlPanel-group controlPanel-group--wide">
        <span class="controlPanel-label">Intensity</span>
        <div class="sliderRow">
          <input v-model="intensity" type="range" min="0" max="3" step="0.05" aria-label="Intensity" />
          <span class="sliderValue">{{ Number(intensity).toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div class="controlPanel controlPanel--bottom controlPanel--row">
      <div class="controlPanel-group">
        <span class="controlPanel-label">Background</span>
        <select v-model="backgroundMode" class="hdrSelect" aria-label="Background">
          <option value="none">None (transparent)</option>
          <option value="image">HDR at infinity</option>
          <option value="dome">HDR on a dome</option>
        </select>
      </div>

      <div class="controlPanel-group controlPanel-group--wide">
        <span class="controlPanel-label">Camera Height</span>
        <div class="sliderRow">
          <input v-model="domeHeight" type="range" min="0.2" max="25" step="0.1" :disabled="backgroundMode !== 'dome'"
            aria-label="Dome Camera Height" />
          <span class="sliderValue">{{ Number(domeHeight).toFixed(1) }} m</span>
        </div>
      </div>

      <div class="controlPanel-group controlPanel-group--wide">
        <span class="controlPanel-label">Dome Radius</span>
        <div class="sliderRow">
          <input v-model="domeRadius" type="range" min="5" max="200" step="1" :disabled="backgroundMode !== 'dome'"
            aria-label="Dome Radius" />
          <span class="sliderValue">{{ domeRadius }} m</span>
        </div>
      </div>

      <div class="controlPanel-group">
        <span class="controlPanel-label">Shadow</span>
        <label class="checkbox-button">
          <input v-model="softShadow" type="checkbox" aria-label="Show soft shadow" />
          Soft shadow
        </label>
      </div>
    </div>

    <div class="infoBadge">
      <span>{{ selectedHDRLabel }}</span>
      <span v-if="loadingEnvironment">Loading HDR…</span>
      <span v-else-if="environmentError">{{ environmentError }}</span>
    </div>
  </CanvasFileDropOverlay>
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
  top: 1rem;
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
