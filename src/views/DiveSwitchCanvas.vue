<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue';
import { DIVE } from '@shopware-ag/dive';
import { Color } from 'three';

const canvas0 = ref<HTMLCanvasElement | null>(null);
const canvas1 = ref<HTMLCanvasElement | null>(null);
const canvas2 = ref<HTMLCanvasElement | null>(null);
const canvases: Ref<HTMLCanvasElement | null>[] = [canvas0, canvas1, canvas2];

const dive: Ref<DIVE | null> = ref(null)
const activeCanvas: Ref<number> = ref(0)

onMounted(async () => {
  if (!canvas0.value || !canvas1.value) {
    return;
  }

  dive.value = await DIVE.QuickView('sofa_B.glb', { canvas: canvas0.value });
});

const switchCanvasTo = (canvas: HTMLCanvasElement, index: number) => {
  activeCanvas.value = index;
  dive.value?.setCanvas(canvas);
}

defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="wrapper">
    <div class="canvasWrapper0">
      <div class="overlay" v-if="activeCanvas !== 0">
        <p>Deactivated</p>
      </div>
      <canvas ref="canvas0"></canvas>
      <button :disabled="activeCanvas === 0" @click="switchCanvasTo(canvases[0].value!, 0)">Use this</button>
    </div>
    <div class="canvasWrapper1">
      <div class="overlay" v-if="activeCanvas !== 1">
        <p>Deactivated</p>
      </div>
      <canvas ref="canvas1"></canvas>
      <button :disabled="activeCanvas === 1" @click="switchCanvasTo(canvases[1].value!, 1)">Use this</button>
    </div>
    <div class="canvasWrapper2">
      <div class="overlay" v-if="activeCanvas !== 2">
        <p>Deactivated</p>
      </div>
      <canvas ref="canvas2"></canvas>
      <button :disabled="activeCanvas === 2" @click="switchCanvasTo(canvases[2].value!, 2)">Use this</button>
    </div>
  </div>

</template>

<style scoped lang="scss">
.wrapper {
  display: flex;
  height: 100%;
  width: 100%;
}

.canvasWrapper0 {
  position: relative;
  display: flex;
  height: 100%;
  flex: 1;

  justify-content: center;
  align-items: center;
}

.canvasWrapper1 {
  position: relative;
  display: flex;
  height: 100%;
  flex: 1;

  justify-content: center;
  align-items: center;
}

.canvasWrapper2 {
  position: relative;
  display: flex;
  height: 100%;
  flex: 1;

  justify-content: center;
  align-items: center;
}

canvas {
  width: 100%;
  height: 100%;
}

button {
  position: absolute;
  bottom: 20px;
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

  p {
    color: white;
    font-size: 30px;
    font-weight: bold;
    text-align: center;
  }
}
</style>