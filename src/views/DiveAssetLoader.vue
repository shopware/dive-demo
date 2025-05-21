<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue';
import { DIVE } from '@shopware-ag/dive';
import { AssetLoader } from '@shopware-ag/dive/modules/AssetLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// declare a ref to hold the element reference
// the name must match template ref value
const canvasWrapper: Ref<HTMLDivElement | null> = ref(null)

onMounted(async () => {
  if (!canvasWrapper.value) {
    return;
  }


  try {
    const dive = new DIVE();

    // const originalLoader = new GLTFLoader();
    // const dracoLoader = new DRACOLoader();
    // dracoLoader.setDecoderPath('./draco/');
    // originalLoader.setDRACOLoader(dracoLoader);
    // const assetOriginal = await originalLoader.loadAsync('draco_compressed.glb');
    // console.log('loaded original: ', assetOriginal);
    // dive.engine.scene.add(assetOriginal.scene);

    const loader = new AssetLoader();
    console.log('loading... ');
    const asset = await loader.load('draco_compressed.glb');
    console.log('loaded: ', asset);
    dive.engine.scene.add(asset);
    console.log('QuickView instance running: ', dive);
    canvasWrapper.value.appendChild(dive.canvas);
  } catch (error) {
    console.error('error: ', error);
  }
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