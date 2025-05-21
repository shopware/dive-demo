<template>
  <div class="canvasWrapper">
    <canvas id="canvas" ref="canvas"></canvas>
  </div>
</template>

<style scoped>
.canvasWrapper {
  display: flex;
  height: 100%;
  width: 100%;
}
</style>

<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue';
import { DIVE } from '@shopware-ag/dive';

// declare a ref to hold the element reference
// the name must match template ref value
const canvas: Ref<HTMLCanvasElement | null> = ref(null)

onMounted(async () => {
  if (!canvas.value) {
    return;
  }

  const dive = await DIVE.QuickView('sofa_B.glb', { canvas: canvas.value });
})

defineProps<{
  msg: string
}>()
</script>
