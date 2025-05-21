<template>
  <div class="canvasWrapper" id="canvasWrapper">
    <canvas ref="canvasRef"></canvas>
    <button class="arbutton" ref="arbuttonRef">
      AR
    </button>
  </div>
</template>

<style scoped>
.canvasWrapper {
  height: 100%;
  width: 100%;
}

.arbutton {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  margin: 1rem;
  padding: 0.5rem 1rem;
  background-color: hsl(199, 100%, 37%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;

  width: 100px;
  height: 50px;
}
</style>

<script setup lang="ts">
import { ref, onMounted, type Ref, onUnmounted } from 'vue';
import { DIVE } from '@shopware-ag/dive';

const canvasRef: Ref<HTMLCanvasElement | null> = ref(null);
const arbuttonRef: Ref<HTMLButtonElement | null> = ref(null);

let dive: DIVE | null = null;

onMounted(async () => {
  if (!canvasRef.value) return;

  dive = await DIVE.QuickView('hay_chair.glb', { canvas: canvasRef.value });

  if (!arbuttonRef.value) return;

  // arbuttonRef.value.addEventListener('click', () => {
  //   if (!dive) return;
  //   dive.Communication.PerformAction('LAUNCH_AR' as keyof Actions, {});
  // });
})

onUnmounted(() => {
  if (!dive) return;
  dive.dispose();
})

defineProps<{
  msg: string
}>()
</script>
