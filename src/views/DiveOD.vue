<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref, markRaw } from 'vue';
import { QuickView } from '@shopware-ag/dive/quickview';

const canvas: Ref<HTMLCanvasElement | null> = ref(null);
const dive: Ref<QuickView | null> = ref(null);

onMounted(async () => {
  if (!canvas.value) {
    return;
  }

  dive.value = markRaw(
    await QuickView('sofa_B.glb', {
      canvas: canvas.value,
      displayAxes: true,
    }),
  );
});

onUnmounted(() => {
  void dive.value?.disposeAsync();
  dive.value = null;
});

defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="page">
    <div class="canvasWrapper">
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
