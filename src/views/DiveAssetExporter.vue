<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue';
import { DIVE } from '@shopware-ag/dive';
import { AssetExporter } from '@shopware-ag/dive/modules/AssetExporter';

// declare a ref to hold the element reference
// the name must match template ref value
const canvasWrapper: Ref<HTMLDivElement | null> = ref(null)

onMounted(async () => {
  if (!canvasWrapper.value) {
    return;
  }

  const dive = await DIVE.QuickView('sofa_B.glb');
  console.log('QuickView instance running: ', dive);
  const exporter = new AssetExporter();
  console.log('exporting... ');
  const glb = await exporter.export(dive.engine.scene, 'glb');
  console.log('exported: ', glb);
  const blob = new Blob([glb], { type: 'model/gltf-binary' });
  console.log('blob: ', blob);
  const url = URL.createObjectURL(blob);
  console.log('url: ', url);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'exported.glb';
  a.click();
  canvasWrapper.value.appendChild(dive.canvas);
})

defineProps<{
  msg: string
}>()
</script>


<template>
  <div class="canvasWrapper" ref="canvasWrapper">
    <!-- the canvas will be attached here on mount -->
  </div>
</template>

<style scoped>
.canvasWrapper {
  display: flex;
  height: 100%;
  width: 100%;
}
</style>