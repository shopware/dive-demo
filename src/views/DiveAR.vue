<script setup lang="ts">
import { ref, onMounted, type Ref, onUnmounted, nextTick, markRaw } from 'vue';
import type { DIVE } from '@shopware-ag/dive';
import { ARSystem } from '@shopware-ag/dive/ar';
import { QuickView } from '@shopware-ag/dive/quickview';

const canvasRef: Ref<HTMLCanvasElement | null> = ref(null);
const placementWrapper: Ref<HTMLElement | null> = ref(null);
const scaleWrapper: Ref<HTMLElement | null> = ref(null);

const placementOptions = ['horizontal', 'vertical'] as const;
const scaleOptions = ['auto', 'fixed'] as const;
const selectedPlacement = ref<typeof placementOptions[number]>('horizontal');
const selectedScale = ref<typeof scaleOptions[number]>('auto');

const showPlacementMenu = ref(false);
const showScaleMenu = ref(false);

let dive: DIVE | null = null;
let arSystem: ARSystem | null = null;
let disposed = false;

async function initializeDive() {
  await nextTick();
  await new Promise((resolve) => window.setTimeout(resolve, 50));

  if (!canvasRef.value) return;

  const quickView = await QuickView('hay_chair.glb', { canvas: canvasRef.value });
  if (disposed) {
    await quickView.disposeAsync();
    return;
  }

  dive = markRaw(quickView);
  arSystem = new ARSystem();
  document.addEventListener('click', onClickOutside);
}

onMounted(() => {
  void initializeDive();
});

onUnmounted(() => {
  disposed = true;
  document.removeEventListener('click', onClickOutside);
  if (!dive) return;
  dive.disposeAsync();
});

function onClickOutside(event: MouseEvent) {
  if (placementWrapper.value && !placementWrapper.value.contains(event.target as Node)) {
    showPlacementMenu.value = false;
  }
  if (scaleWrapper.value && !scaleWrapper.value.contains(event.target as Node)) {
    showScaleMenu.value = false;
  }
}

function selectPlacement(option: typeof placementOptions[number]) {
  selectedPlacement.value = option;
  showPlacementMenu.value = false;
}

function selectScale(option: typeof scaleOptions[number]) {
  selectedScale.value = option;
  showScaleMenu.value = false;
}

function launchAR() {
  arSystem?.launch('hay_chair.glb', { arPlacement: selectedPlacement.value, arScale: selectedScale.value });
}

defineProps<{
  msg: string
}>()
</script>


<template>
  <div class="canvasWrapper">
    <canvas ref="canvasRef"></canvas>
    <div class="controlPanel controlPanel--top controlPanel--row" data-testid="ar-control-panel">
      <div class="controlPanel-group">
        <span class="controlPanel-label">Placement</span>
        <div ref="placementWrapper" class="export-wrapper">
          <button @click="showPlacementMenu = !showPlacementMenu">{{ selectedPlacement }}</button>
          <div v-if="showPlacementMenu" class="export-menu">
            <button v-for="option in placementOptions" :key="option" class="export-option"
              @click="selectPlacement(option)">
              {{ option }}
            </button>
          </div>
        </div>
      </div>
      <div class="controlPanel-group">
        <span class="controlPanel-label">Scale</span>
        <div ref="scaleWrapper" class="export-wrapper">
          <button @click="showScaleMenu = !showScaleMenu">{{ selectedScale }}</button>
          <div v-if="showScaleMenu" class="export-menu">
            <button v-for="option in scaleOptions" :key="option" class="export-option" @click="selectScale(option)">
              {{ option }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <button class="ar-launch" data-testid="ar-launch" @click="launchAR">AR</button>
  </div>
</template>

<style scoped>
.canvasWrapper {
  position: relative;
  display: flex;
  height: 100%;
  min-height: 100vh;
  width: 100%;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.ar-launch {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
}
</style>
