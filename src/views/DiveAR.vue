<script setup lang="ts">
import { ref, onMounted, type Ref, onUnmounted } from 'vue';
import { ARSystem, ARError } from '@shopware-ag/dive/ar';
import { QuickView } from '@shopware-ag/dive/quickview';
import CanvasFileDropOverlay from '@/components/canvas/CanvasFileDropOverlay.vue';

const canvasRef: Ref<HTMLCanvasElement | null> = ref(null);
const placementWrapper: Ref<HTMLElement | null> = ref(null);
const scaleWrapper: Ref<HTMLElement | null> = ref(null);

const placementOptions = ['horizontal', 'vertical'] as const;
const scaleOptions = ['auto', 'fixed'] as const;
const selectedPlacement = ref<typeof placementOptions[number]>('horizontal');
const selectedScale = ref<typeof scaleOptions[number]>('auto');

const showPlacementMenu = ref(false);
const showScaleMenu = ref(false);
const arErrorMessage = ref<string | null>(null);

const DEFAULT_MODEL_URL = 'model/hay_chair.glb';

let quickView: QuickView | null = null;
let arSystem: ARSystem | null = null;
let disposed = false;
let currentModelUrl = DEFAULT_MODEL_URL;
let droppedModelUrl: string | null = null;

onMounted(async () => {
    if (!canvasRef.value) {
    return;
  }

  quickView = await QuickView(DEFAULT_MODEL_URL, { canvas: canvasRef.value });

  if (disposed) {
    await quickView.disposeAsync();
    return;
  }

  arSystem = new ARSystem();
  document.addEventListener('click', onClickOutside);
});

onUnmounted(() => {
  disposed = true;
  document.removeEventListener('click', onClickOutside);

  if (droppedModelUrl) {
    URL.revokeObjectURL(droppedModelUrl);
    droppedModelUrl = null;
  }

  if (!quickView) return;

  void quickView.disposeAsync();
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

async function loadFile(file: File) {
  if (!quickView) {
    return;
  }

  const nextModelUrl = URL.createObjectURL(file);

  try {
    await quickView.load(nextModelUrl);
  } catch (error) {
    URL.revokeObjectURL(nextModelUrl);
    throw error;
  }

  if (droppedModelUrl) {
    URL.revokeObjectURL(droppedModelUrl);
  }

  droppedModelUrl = nextModelUrl;
  currentModelUrl = nextModelUrl;
}

async function launchAR() {
  if (!arSystem) return;

  arErrorMessage.value = null;

  try {
    await arSystem.launch(currentModelUrl, { arPlacement: selectedPlacement.value, arScale: selectedScale.value });
  } catch (error) {
    arErrorMessage.value = getARErrorMessage(error);
  }
}

function getARErrorMessage(error: unknown): string {
  if (error instanceof ARError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Failed to launch AR.';
}

defineProps<{
  msg: string
}>()
</script>

<template>
    <CanvasFileDropOverlay class="canvasWrapper" @loading="loadFile">
        <canvas ref="canvasRef"></canvas>
        <div class="controlPanel controlPanel--top controlPanel--row">
            <div class="controlPanel-group">
                <span class="controlPanel-label">Placement</span>
                <div ref="placementWrapper" class="export-wrapper">
                    <button @click="showPlacementMenu = !showPlacementMenu">
                        {{ selectedPlacement }}
                    </button>
                    <div v-if="showPlacementMenu" class="export-menu">
                        <button
                            v-for="option in placementOptions"
                            :key="option"
                            class="export-option"
                            @click="selectPlacement(option)"
                        >
                            {{ option }}
                        </button>
                    </div>
                </div>
            </div>
            <div class="controlPanel-group">
                <span class="controlPanel-label">Scale</span>
                <div ref="scaleWrapper" class="export-wrapper">
                    <button @click="showScaleMenu = !showScaleMenu">
                        {{ selectedScale }}
                    </button>
                    <div v-if="showScaleMenu" class="export-menu">
                        <button
                            v-for="option in scaleOptions"
                            :key="option"
                            class="export-option"
                            @click="selectScale(option)"
                        >
                            {{ option }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <button class="ar-launch" @click="launchAR">AR</button>
        <div v-if="arErrorMessage" class="ar-error" role="alert">
            <span>{{ arErrorMessage }}</span>
            <button class="ar-error-close" aria-label="Close" @click="arErrorMessage = null">&times;</button>
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

canvas {
    display: block;
    width: 100%;
    height: 100%;
}

.ar-launch {
    position: absolute;
    bottom: calc(1rem + env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
}

.ar-error {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 10;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    max-width: min(20rem, calc(100% - 2rem));
    padding: 0.5rem 0.5rem 0.5rem 1rem;
    border: 1px solid rgba(200, 50, 50, 0.5);
    border-radius: 0.35rem;
    background: rgba(200, 50, 50, 0.85);
    color: white;
    font-size: 0.875rem;
    line-height: 1.4;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

.ar-error-close {
    flex: none;
    padding: 0 0.35rem;
    border: none;
    background: transparent;
    color: inherit;
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
}
</style>
