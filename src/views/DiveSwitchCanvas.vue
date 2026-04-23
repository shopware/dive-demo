<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref, markRaw, nextTick } from 'vue';
import ResizablePanels from '@/components/layout/ResizablePanels.vue';
import { QuickView, type QuickView as QuickViewType } from '@shopware-ag/dive/quickview';

const canvas0 = ref<HTMLCanvasElement | null>(null);
const canvas1 = ref<HTMLCanvasElement | null>(null);
const canvas2 = ref<HTMLCanvasElement | null>(null);
const canvases: Ref<HTMLCanvasElement | null>[] = [canvas0, canvas1, canvas2];

const dive: Ref<QuickViewType | null> = ref(null)
const activeCanvas: Ref<number> = ref(0)
let disposed = false;
const initAbortController = new AbortController();

const logSwitchCanvas = (
  stage: string,
  details: Record<string, unknown> = {},
) => {
  console.info('[DiveSwitchCanvas]', stage, details);
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
    const quickView = await QuickView(
      'sofa_B.glb',
      { canvas: initialCanvas },
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
  } catch (error) {
    const lastError = error instanceof Error ? error : new Error(String(error));
    logSwitchCanvas('quick-view-failed', {
      errorName: lastError.name,
      errorMessage: lastError.message,
    });
    console.error('Failed to initialize DiveSwitchCanvas', lastError);
  }
};

onMounted(() => {
  void initializeDive();
});

onUnmounted(() => {
  disposed = true;
  initAbortController.abort();
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

  if (disposed || !dive.value) {
    return;
  }

  // Give the browser one more frame to present the new panel state before
  // moving the heavy renderer work onto the new canvas.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  // replace canvas in main view
  dive.value.mainView.setCanvas(canvas);

  // set dom element to orbit controller
  dive.value.orbitController.setDomElements(canvas);
}

defineProps<{
  msg: string
}>()
</script>

<template>
  <div
    class="page"
    data-testid="switch-canvas-page"
    :data-active-canvas="String(activeCanvas)"
    :data-ready="dive ? 'true' : 'false'"
  >
    <ResizablePanels :initial-sizes="[100 / canvases.length, 100 / canvases.length, 100 / canvases.length]"
      :min-size="10" orientation="horizontal">
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
  min-height: 100vh;
}

.canvasWrapper0 {
  position: relative;
  display: flex;
  height: 100%;
  min-height: 24rem;
  flex: 1;

  justify-content: center;
  align-items: center;
}

.canvasWrapper1 {
  position: relative;
  display: flex;
  height: 100%;
  min-height: 24rem;
  flex: 1;

  justify-content: center;
  align-items: center;
}

.canvasWrapper2 {
  position: relative;
  display: flex;
  height: 100%;
  min-height: 24rem;
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
  bottom: 20px;
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
}

.overlay p {
  color: white;
  font-size: 30px;
  font-weight: bold;
  text-align: center;
}
</style>
