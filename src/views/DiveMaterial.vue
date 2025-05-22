<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue';
import { DIVE } from '@shopware-ag/dive';
import { Color, Mesh, MeshStandardMaterial } from 'three';
import type { DIVEModel } from 'node_modules/@shopware-ag/dive/build/src/components/model/Model';

const canvas: Ref<HTMLCanvasElement | null> = ref(null);

onMounted(async () => {
  if (!canvas.value) {
    return;
  }

  const dive = await DIVE.QuickView('suzanne.glb', { canvas: canvas.value });

  setInterval(() => {
    const sceneChildren = dive.engine.scene.root.children;
    const index = sceneChildren.length - 1;
    const suzanne = sceneChildren[index] as DIVEModel;
    suzanne.setMaterial({
      color: '#' + new Color(Math.random(), Math.random(), Math.random()).getHexString(),
      roughness: Math.random(),
      metalness: Math.random(),
    });
  }, 1000);
})

defineProps<{
  msg: string
}>()
</script>


<template>
  <div class="canvasWrapper">
    <canvas ref="canvas" />
  </div>
</template>

<style scoped>
.canvasWrapper {
  display: flex;
  height: 100%;
  width: 100%;
}
</style>