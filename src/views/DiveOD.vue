<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref, markRaw } from 'vue';
import { QuickView } from '@shopware-ag/dive/quickview';
import CanvasFileDropOverlay from '@/components/canvas/CanvasFileDropOverlay.vue';

const canvas: Ref<HTMLCanvasElement | null> = ref(null);
const dive: Ref<QuickView | null> = ref(null);

onMounted(async () => {
  if (!canvas.value) {
    return;
  }

  dive.value = markRaw(
    await QuickView('model/sofa_B.glb', {
      canvas: canvas.value,
      displayAxes: true,
    }),
  );
});

onUnmounted(() => {
  void dive.value?.disposeAsync();
  dive.value = null;
});

async function loadFile(file: File) {
  if (!dive.value) {
    return;
  }

  const url = URL.createObjectURL(file);

  try {
    await dive.value.model.setFromURL(url);
    dive.value.model.placeOnFloor();
    dive.value.orbitController.focusObject(dive.value.model);
  } finally {
    URL.revokeObjectURL(url);
  }
}

defineProps<{
  msg: string
}>()
</script>

<template>
    <div class="page">
        <CanvasFileDropOverlay class="canvasWrapper" @loading="loadFile">
            <canvas ref="canvas"></canvas>
        </CanvasFileDropOverlay>
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
