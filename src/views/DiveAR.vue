<script setup lang="ts">
import { ref, onMounted, type Ref, onUnmounted } from 'vue';
import { DIVE } from '@shopware-ag/dive';
import { ARSystem } from '@shopware-ag/dive/modules/ARSystem';

const canvasRef: Ref<HTMLCanvasElement | null> = ref(null);
const arbuttonRef: Ref<HTMLButtonElement | null> = ref(null);

// Add placement and scale options and selected values
const placementOptions = ['horizontal', 'vertical'] as const;
const scaleOptions = ['auto', 'fixed'] as const;
const selectedPlacement = ref<typeof placementOptions[number]>('horizontal');
const selectedScale = ref<typeof scaleOptions[number]>('auto');

let dive: DIVE | null = null;

onMounted(async () => {
  if (!canvasRef.value) return;

  dive = await DIVE.QuickView('hay_chair.glb', { canvas: canvasRef.value });

  if (!arbuttonRef.value) return;

  const arSystem = new ARSystem();

  arbuttonRef.value.addEventListener('click', () => {
    arSystem.launch('hay_chair.glb', { arPlacement: selectedPlacement.value, arScale: selectedScale.value });
  });
})

onUnmounted(() => {
  if (!dive) return;
  dive.dispose();
})

defineProps<{
  msg: string
}>()
</script>


<template>
  <div class="canvasWrapper">
    <canvas ref="canvasRef"></canvas>
    <!-- Dropdown controls for placement and scale -->
    <div class="controls">
      <label>
        Placement:
        <select v-model="selectedPlacement">
          <option v-for="option in placementOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>
      <label>
        Scale:
        <select v-model="selectedScale">
          <option v-for="option in scaleOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>
    </div>
    <button class="arbutton" ref="arbuttonRef">
      AR
    </button>
  </div>
</template>

<style scoped>
.canvasWrapper {
  position: relative;
  display: flex;
  height: 100%;
  width: 100%;
}

.controls {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 0.5rem;
  border-radius: 0.5rem;
  z-index: 10;
}

.controls label {
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  color: var(--color-text);
  font-weight: 600;
}

.controls select {
  margin-top: 0.25rem;
  padding: 0.5rem 1rem;
  height: 50px;
  border: none;
  border-radius: 0.5rem;
  background-color: #e0f2ff;
  color: var(--color-text);
  font-size: 1rem;
  cursor: pointer;
  min-width: 120px;
  appearance: none;
}

.arbutton {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  margin: 1rem;
  padding: 0.5rem 1rem;
  background-color: #e0f2ff;
  color: var(--color-text);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;

  width: 100px;
  height: 50px;
}
</style>