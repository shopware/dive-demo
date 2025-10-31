<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue';
import { QuickView } from '@shopware-ag/dive/quickview';

const canvas: Ref<HTMLCanvasElement | null> = ref(null)

onMounted(async () => {
  if (!canvas.value) {
    return;
  }

  await QuickView('sofa_B.glb', { canvas: canvas.value, displayFloor: true });
})

defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="canvasWrapper">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<style scoped>
.canvasWrapper {
  display: flex;
  height: 100%;
  width: 100%;
}
</style>