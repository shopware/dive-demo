<script setup lang="ts">
import { ref, onMounted, type Ref, markRaw } from 'vue';
import { QuickView } from '@shopware-ag/dive/quickview';

const canvas: Ref<HTMLCanvasElement | undefined> = ref(undefined)
const dive: Ref<QuickView | null> = ref(null)
const uploadButton: Ref<HTMLButtonElement | null> = ref(null)
const uploadInput: Ref<HTMLInputElement | null> = ref(null)

onMounted(async () => {
  if (!canvas.value) {
    return;
  }

  dive.value = markRaw(await QuickView('sofa_B.glb', { canvas: canvas.value, displayFloor: true }));
})

const uploadFile = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) {
    return;
  }

  const url = URL.createObjectURL(file);
  dive.value?.dispose();
  dive.value = markRaw(await QuickView(url, { canvas: canvas.value, displayFloor: true }));
}

defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="canvasWrapper">
    <canvas ref="canvas"></canvas>
  </div>
  <button ref="uploadButton" @click="uploadInput?.click()">
    Upload
  </button>
  <input type="file" ref="uploadInput" style="display: none;" @change="uploadFile" accept=".glb,.gltf,.usdz" />
</template>

<style scoped>
.canvasWrapper {
  display: flex;
  height: 100%;
  width: 100%;
}

button {
  position: absolute;
  top: 0;
  right: 0;
  margin: 1rem;
}
</style>