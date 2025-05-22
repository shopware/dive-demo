<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue';
import { DIVE } from '@shopware-ag/dive';

const canvas: Ref<HTMLCanvasElement | null> = ref(null)

onMounted(async () => {
  if (!canvas.value) {
    return;
  }

  await DIVE.QuickView('sofa_B.glb', { canvas: canvas.value });
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