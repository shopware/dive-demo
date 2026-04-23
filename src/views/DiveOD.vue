<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref, markRaw } from 'vue';
import { QuickView } from '@shopware-ag/dive/quickview';

const canvas: Ref<HTMLCanvasElement | null> = ref(null);
const dive: Ref<QuickView | null> = ref(null);
const ready = ref(false);

const waitForPresentationFrames = async (frames = 2) => {
  for (let index = 0; index < frames; index += 1) {
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }
};

onMounted(async () => {
  ready.value = false;
  if (!canvas.value) {
    return;
  }

  dive.value = markRaw(
    await QuickView('sofa_B.glb', {
      canvas: canvas.value,
      displayAxes: true,
    }),
  );

  await waitForPresentationFrames();
  ready.value = true;
});

onUnmounted(() => {
  ready.value = false;
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
