<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, type Ref, markRaw, nextTick } from 'vue';
import ResizablePanels from '@/components/layout/ResizablePanels.vue';
import { QuickView, type QuickView as QuickViewType } from '@shopware-ag/dive/quickview';

const canvas0 = ref<HTMLCanvasElement | null>(null);
const canvas1 = ref<HTMLCanvasElement | null>(null);
const canvas2 = ref<HTMLCanvasElement | null>(null);
const canvases: Ref<HTMLCanvasElement | null>[] = [canvas0, canvas1, canvas2];

const dive: Ref<QuickViewType | null> = ref(null)
const activeCanvas: Ref<number> = ref(0)
const isCompactViewport = ref(false);
const panelOrientation = computed(() => isCompactViewport.value ? 'vertical' : 'horizontal');
let disposed = false;

const scheduleMainViewCanvasSwap = (
  currentDive: QuickViewType,
  canvas: HTMLCanvasElement,
  index: number,
) => {
  window.setTimeout(() => {
    if (disposed || dive.value !== currentDive || activeCanvas.value !== index) {
      return;
    }

    void Promise.resolve(currentDive.mainView.setCanvas(canvas)).catch(() => undefined);
  }, 0);
};

const initializeDive = async () => {
  await nextTick();

  if (disposed) {
    return;
  }

  const initialCanvas = canvas0.value;

  if (!initialCanvas) {
    return;
  }

  const quickView = await QuickView(
    'sofa_B.glb',
    { canvas: initialCanvas },
  );

  if (disposed) {
    await quickView.disposeAsync();
    return;
  }

  dive.value = markRaw(quickView);
};

const updateViewportMode = () => {
  isCompactViewport.value = window.innerWidth <= 640 || window.innerHeight <= 480;
};

onMounted(() => {
  updateViewportMode();
  window.addEventListener('resize', updateViewportMode);
  void initializeDive().catch(() => undefined);
});

onUnmounted(() => {
  disposed = true;
  window.removeEventListener('resize', updateViewportMode);
  void dive.value?.disposeAsync();
  dive.value = null;
});

const switchCanvasTo = async (canvas: HTMLCanvasElement | null, index: number) => {
  if (!canvas || !dive.value) {
    return;
  }

  activeCanvas.value = index;

  await nextTick();

  const currentDive = dive.value;

  if (disposed || !currentDive) {
    return;
  }

  scheduleMainViewCanvasSwap(currentDive, canvas, index);

  currentDive.orbitController.setDomElements(canvas);
}

defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="page">
    <ResizablePanels :initial-sizes="[100 / canvases.length, 100 / canvases.length, 100 / canvases.length]"
      :min-size="10" :orientation="panelOrientation">
      <template #panel-0>
        <div class="canvasWrapper0">
          <div class="overlay" v-if="activeCanvas !== 0">
            <p>Deactivated</p>
          </div>
          <canvas ref="canvas0"></canvas>
          <button :disabled="!dive || activeCanvas === 0" @click="switchCanvasTo(canvases[0].value, 0)">Use this</button>
        </div>
      </template>
      <template #panel-1>
        <div class="canvasWrapper1">
          <div class="overlay" v-if="activeCanvas !== 1">
            <p>Deactivated</p>
          </div>
          <canvas ref="canvas1"></canvas>
          <button :disabled="!dive || activeCanvas === 1" @click="switchCanvasTo(canvases[1].value, 1)">Use this</button>
        </div>
      </template>
      <template #panel-2>
        <div class="canvasWrapper2">
          <div class="overlay" v-if="activeCanvas !== 2">
            <p>Deactivated</p>
          </div>
          <canvas ref="canvas2"></canvas>
          <button :disabled="!dive || activeCanvas === 2" @click="switchCanvasTo(canvases[2].value, 2)">Use this</button>
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
