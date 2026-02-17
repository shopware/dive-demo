<script setup lang="ts">
import { ref, onMounted, type Ref, markRaw } from 'vue';
import ResizablePanels from '@/components/layout/ResizablePanels.vue';
import { QuickView } from '@shopware-ag/dive/quickview';
import { OrientationDisplay } from '@shopware-ag/dive/orientationdisplay';

const canvas0: Ref<HTMLCanvasElement | null> = ref(null)
const canvas1: Ref<HTMLCanvasElement | null> = ref(null)
const canvases: Ref<HTMLCanvasElement | null>[] = [canvas0, canvas1];

const dive0: Ref<QuickView | null> = ref(null)
const dive1: Ref<QuickView | null> = ref(null)

onMounted(async () => {
  if (!canvas0.value || !canvas1.value) {
    return;
  }

  // with displayAxes
  dive0.value = markRaw(await QuickView('sofa_B.glb', { canvas: canvas0.value, displayAxes: true }));

  // OR

  // without displayAxes
  dive1.value = markRaw(await QuickView('sofa_B.glb', { canvas: canvas1.value }));

  const orientationDisplay = new OrientationDisplay(dive1.value.mainView.renderer, dive1.value.scene, dive1.value.mainView.camera);
  dive1.value.clock.addTicker(orientationDisplay);
})

defineProps<{
  msg: string
}>()
</script>

<template>
  <ResizablePanels :initial-sizes="[100 / canvases.length, 100 / canvases.length]" :min-size="10"
    orientation="horizontal">
    <template #panel-0>
      <div class="canvasWrapper">
        <canvas ref="canvas0"></canvas>
      </div>
    </template>
    <template #panel-1>
      <div class="canvasWrapper">
        <canvas ref="canvas1"></canvas>
      </div>
    </template>
  </ResizablePanels>
</template>
<style scoped>
.canvasWrapper {
  display: flex;
  height: 100%;
  width: 100%;
}
</style>