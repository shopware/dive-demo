<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, type Ref, markRaw, nextTick } from 'vue';
import ResizablePanels from '@/components/layout/ResizablePanels.vue';
import { QuickView, type QuickView as QuickViewType } from '@shopware-ag/dive/quickview';
import { isDiveDebugEnabled, recordDiveDebugEvent, withDiveDebugSpan } from '@/utils/e2eDiagnostics';

const canvas0 = ref<HTMLCanvasElement | null>(null);
const canvas1 = ref<HTMLCanvasElement | null>(null);
const canvas2 = ref<HTMLCanvasElement | null>(null);
const canvases: Ref<HTMLCanvasElement | null>[] = [canvas0, canvas1, canvas2];

const dive: Ref<QuickViewType | null> = ref(null)
const activeCanvas: Ref<number> = ref(0)
const isCompactViewport = ref(false);
const panelOrientation = computed(() => isCompactViewport.value ? 'vertical' : 'horizontal');
let disposed = false;
const initAbortController = new AbortController();
const debugCanvasSwapDelayMs = 250;

const logSwitchCanvas = (
  stage: string,
  details: Record<string, unknown> = {},
) => {
  console.info('[DiveSwitchCanvas]', stage, details);
  recordDiveDebugEvent('DiveSwitchCanvas', stage, details);
};

const getDebugRequestedCanvasIndex = () => {
  if (!isDiveDebugEnabled()) {
    return null;
  }

  const rawIndex = new URLSearchParams(window.location.search).get('switchCanvasTo');
  if (rawIndex === null) {
    return null;
  }

  const index = Number(rawIndex);
  return Number.isInteger(index) && index >= 0 && index < canvases.length
    ? index
    : null;
};

const getErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
    };
  }

  return {
    errorMessage: String(error),
  };
};

const scheduleMainViewCanvasSwap = (
  currentDive: QuickViewType,
  canvas: HTMLCanvasElement,
  index: number,
) => {
  const details = { index, canvasTestId: canvas.dataset.testid ?? null };
  const delayMs = isDiveDebugEnabled() ? debugCanvasSwapDelayMs : 0;

  logSwitchCanvas('set-canvas-call-scheduled', { ...details, delayMs });

  window.setTimeout(() => {
    if (disposed || dive.value !== currentDive || activeCanvas.value !== index) {
      logSwitchCanvas('set-canvas-call-skipped-stale', details);
      return;
    }

    void withDiveDebugSpan(
      'DiveSwitchCanvas',
      'set-canvas-call',
      () => currentDive.mainView.setCanvas(canvas),
      details,
    ).catch((error: unknown) => {
      logSwitchCanvas('set-canvas-call-background-failed', {
        ...details,
        ...getErrorDetails(error),
      });
      console.error('Failed to switch DiveSwitchCanvas canvas', error);
    });
  }, delayMs);
};

const initializeDive = async () => {
  await nextTick();

  if (disposed || initAbortController.signal.aborted) {
    return;
  }

  const initialCanvas = canvas0.value;

  if (!initialCanvas) {
    const error = new Error('Initial switch-canvas canvas ref is missing');
    console.error('Failed to initialize DiveSwitchCanvas', error);
    return;
  }

  try {
    logSwitchCanvas('quick-view-start', {
      canvasTestId: initialCanvas.dataset.testid ?? null,
    });
    const quickView = await withDiveDebugSpan(
      'DiveSwitchCanvas',
      'quick-view-call',
      () => QuickView(
        'sofa_B.glb',
        { canvas: initialCanvas },
      ),
      { uri: 'sofa_B.glb', canvasTestId: initialCanvas.dataset.testid ?? null },
    );
    logSwitchCanvas('quick-view-resolved', {
      rendererInitialized: quickView.mainView.renderer.initialized,
    });
    dive.value = markRaw(quickView);
    logSwitchCanvas('dive-ref-set', {
      rendererInitialized: dive.value.mainView.renderer.initialized,
    });

    if (disposed) {
      await dive.value?.disposeAsync();
      logSwitchCanvas('disposed-after-quick-view');
      return;
    }

    logSwitchCanvas('initialize-complete');

    const requestedCanvasIndex = getDebugRequestedCanvasIndex();
    if (requestedCanvasIndex !== null && requestedCanvasIndex !== activeCanvas.value) {
      void switchCanvasTo(canvases[requestedCanvasIndex].value, requestedCanvasIndex);
    }
  } catch (error) {
    const lastError = error instanceof Error ? error : new Error(String(error));
    logSwitchCanvas('quick-view-failed', {
      errorName: lastError.name,
      errorMessage: lastError.message,
    });
    console.error('Failed to initialize DiveSwitchCanvas', lastError);
  }
};

const updateViewportMode = () => {
  isCompactViewport.value = window.innerWidth <= 640 || window.innerHeight <= 480;
};

onMounted(() => {
  updateViewportMode();
  window.addEventListener('resize', updateViewportMode);
  void initializeDive();
});

onUnmounted(() => {
  disposed = true;
  initAbortController.abort();
  window.removeEventListener('resize', updateViewportMode);
  void dive.value?.disposeAsync();
  dive.value = null;
});

const switchCanvasTo = async (canvas: HTMLCanvasElement | null, index: number) => {
  if (!canvas || !dive.value) {
    return;
  }

  // set active canvas index
  activeCanvas.value = index;

  // Let Vue commit the new active-state UI before the renderer swaps canvases.
  await nextTick();

  const currentDive = dive.value;

  if (disposed || !currentDive) {
    return;
  }

  // Schedule the renderer swap after the UI/controller handoff so a WebGPU
  // canvas reconfiguration stall cannot block the visible switch state.
  scheduleMainViewCanvasSwap(currentDive, canvas, index);

  // set dom element to orbit controller
  currentDive.orbitController.setDomElements(canvas);
  logSwitchCanvas('orbit-controller-dom-updated', { index });
}

defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="page" data-testid="switch-canvas-page" :data-active-canvas="String(activeCanvas)"
    :data-ready="dive ? 'true' : 'false'">
    <ResizablePanels :initial-sizes="[100 / canvases.length, 100 / canvases.length, 100 / canvases.length]"
      :min-size="10" :orientation="panelOrientation">
      <template #panel-0>
        <div class="canvasWrapper0" data-testid="switch-canvas-panel-0">
          <div class="overlay" v-if="activeCanvas !== 0">
            <p>Deactivated</p>
          </div>
          <canvas ref="canvas0" data-testid="switch-canvas-0"></canvas>
          <button :disabled="!dive || activeCanvas === 0" @click="switchCanvasTo(canvases[0].value, 0)"
            data-testid="switch-canvas-button-0">Use this</button>
        </div>
      </template>
      <template #panel-1>
        <div class="canvasWrapper1" data-testid="switch-canvas-panel-1">
          <div class="overlay" v-if="activeCanvas !== 1">
            <p>Deactivated</p>
          </div>
          <canvas ref="canvas1" data-testid="switch-canvas-1"></canvas>
          <button :disabled="!dive || activeCanvas === 1" @click="switchCanvasTo(canvases[1].value, 1)"
            data-testid="switch-canvas-button-1">Use this</button>
        </div>
      </template>
      <template #panel-2>
        <div class="canvasWrapper2" data-testid="switch-canvas-panel-2">
          <div class="overlay" v-if="activeCanvas !== 2">
            <p>Deactivated</p>
          </div>
          <canvas ref="canvas2" data-testid="switch-canvas-2"></canvas>
          <button :disabled="!dive || activeCanvas === 2" @click="switchCanvasTo(canvases[2].value, 2)"
            data-testid="switch-canvas-button-2">Use this</button>
        </div>
      </template>
    </ResizablePanels>
  </div>
</template>

<style scoped lang="scss">
.wrapper {
  display: flex;
  height: 100%;
  width: 100%;
}

.page {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.canvasWrapper0 {
  position: relative;
  display: flex;
  height: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;

  justify-content: center;
  align-items: center;
}

.canvasWrapper1 {
  position: relative;
  display: flex;
  height: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;

  justify-content: center;
  align-items: center;
}

.canvasWrapper2 {
  position: relative;
  display: flex;
  height: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;

  justify-content: center;
  align-items: center;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

button {
  position: absolute;
  bottom: clamp(0.25rem, 2vh, 1.25rem);
  left: 50%;
  z-index: 2;
  max-width: calc(100% - 0.75rem);
  padding-inline: clamp(0.45rem, 4vw, 0.85rem);
  overflow: hidden;
  text-overflow: ellipsis;
  transform: translateX(-50%);
  white-space: nowrap;
}

.overlay {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  pointer-events: none;
  z-index: 1;
}

.overlay p {
  color: white;
  font-size: clamp(0.85rem, 4vw, 1.875rem);
  font-weight: bold;
  text-align: center;
}
</style>
