<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref, markRaw } from 'vue';
import { QuickView } from '@shopware-ag/dive/quickview';

const canvas: Ref<HTMLCanvasElement | null> = ref(null);
const dive: Ref<QuickView | null> = ref(null);
const ready = ref(false);

const logInit = (stage: string, details: Record<string, unknown> = {}) => {
  console.info('[DiveOD]', stage, details);
};

const waitForPresentationFrames = async (frames = 2) => {
  for (let index = 0; index < frames; index += 1) {
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }
};

onMounted(async () => {
  ready.value = false;
  logInit('init-start', { hasCanvas: Boolean(canvas.value) });
  if (!canvas.value) {
    logInit('init-skip', { reason: 'missing-canvas' });
    return;
  }

  logInit('quick-view-start', { uri: 'sofa_B.glb' });
  dive.value = markRaw(
    await QuickView('sofa_B.glb', {
      canvas: canvas.value,
      displayAxes: true,
    }),
  );
  logInit('quick-view-resolved', { uri: 'sofa_B.glb' });

  await waitForPresentationFrames();
  logInit('presentation-frames-complete');
  ready.value = true;
  logInit('ready-true');
});

onUnmounted(() => {
  ready.value = false;
  logInit('unmounted');
  void dive.value?.disposeAsync();
  dive.value = null;
});

defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="page" data-testid="od-page" :data-ready="ready ? 'true' : 'false'">
    <div class="canvasWrapper" data-testid="od-with-axes">
      <canvas ref="canvas"></canvas>
    </div>
  </div>
</template>
<style scoped>
.page {
  width: 100%;
  height: 100%;
  min-height: 100vh;
}

.canvasWrapper {
  display: flex;
  height: 100%;
  width: 100%;
}
</style>
