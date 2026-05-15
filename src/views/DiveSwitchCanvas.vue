<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, type Ref, markRaw, nextTick } from 'vue';
import ResizablePanels from '@/components/layout/ResizablePanels.vue';
import { QuickView } from '@shopware-ag/dive/quickview';

const canvas0 = ref<HTMLCanvasElement | null>(null);
const canvas1 = ref<HTMLCanvasElement | null>(null);
const canvas2 = ref<HTMLCanvasElement | null>(null);
const canvases: Ref<HTMLCanvasElement | null>[] = [canvas0, canvas1, canvas2];
const canvasKeys = ref([0, 0, 0]);

const activeCanvas: Ref<number> = ref(0);
const isSwitchingCanvas = ref(false);
const isCompactViewport = ref(false);
const panelOrientation = computed(() => isCompactViewport.value ? 'vertical' : 'horizontal');

const DEFAULT_URL = 'sofa_B.glb';
const quickView = ref<QuickView | null>(null);
let disposed = false;

onMounted(async () => {
  updateViewportMode();
  window.addEventListener('resize', updateViewportMode);

  if (!canvas0.value || disposed) {
    return;
  }

  const view = await QuickView(DEFAULT_URL, { canvas: canvas0.value });
  if (disposed) {
    await view.disposeAsync();
    return;
  }

  quickView.value = markRaw(view);
});

onUnmounted(() => {
  disposed = true;
  window.removeEventListener('resize', updateViewportMode);

  if (quickView.value) {
    void quickView.value.disposeAsync();
    quickView.value = null;
  }
});

const canUseCanvas = (index: number) =>
  Boolean(canvases[index]?.value) &&
  Boolean(quickView.value) &&
  !isSwitchingCanvas.value &&
  activeCanvas.value !== index;

const switchCanvasTo = async (index: number) => {
  const targetQuickView = quickView.value;

  if (!targetQuickView || isSwitchingCanvas.value || activeCanvas.value === index) {
    return;
  }

  await nextTick();

  const canvas = canvases[index]?.value ?? null;
  if (!canvas) {
    return;
  }

  const previousIndex = activeCanvas.value;
  isSwitchingCanvas.value = true;
  await nextTick();

  try {
    if (disposed) {
      return;
    }

    await targetQuickView.mainView.setCanvas(canvas);
    targetQuickView.orbitController.setDomElements(canvas);
    activeCanvas.value = index;
    canvasKeys.value[previousIndex] += 1;
    await nextTick();
  } finally {
    isSwitchingCanvas.value = false;
  }
}

const updateViewportMode = () => {
  isCompactViewport.value = window.innerWidth <= 640 || window.innerHeight <= 480;
};

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
          <canvas :key="canvasKeys[0]" ref="canvas0"></canvas>
          <button :disabled="!canUseCanvas(0)" @click="switchCanvasTo(0)">Use
            this</button>
        </div>
      </template>
      <template #panel-1>
        <div class="canvasWrapper1">
          <div class="overlay" v-if="activeCanvas !== 1">
            <p>Deactivated</p>
          </div>
          <canvas :key="canvasKeys[1]" ref="canvas1"></canvas>
          <button :disabled="!canUseCanvas(1)" @click="switchCanvasTo(1)">Use
            this</button>
        </div>
      </template>
      <template #panel-2>
        <div class="canvasWrapper2">
          <div class="overlay" v-if="activeCanvas !== 2">
            <p>Deactivated</p>
          </div>
          <canvas :key="canvasKeys[2]" ref="canvas2"></canvas>
          <button :disabled="!canUseCanvas(2)" @click="switchCanvasTo(2)">Use
            this</button>
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
