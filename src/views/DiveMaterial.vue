<template>
  <div class="canvasWrapper" ref="canvasWrapper">
    <!-- the canvas will be attached here on mount -->
  </div>
</template>

<style scoped>
.canvasWrapper {
  height: 100%;
  width: 100%;
}
</style>

<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue';
import { DIVE, type COMEntity } from '@shopware-ag/dive';
import { Color } from 'three';

// declare a ref to hold the element reference
// the name must match template ref value
const canvasWrapper: Ref<HTMLDivElement | null> = ref(null)

onMounted(() => {
  if (!canvasWrapper.value) {
    return;
  }

  const { Canvas, Communication } = DIVE.QuickView('suzanne.glb');
  canvasWrapper.value.appendChild(Canvas);

  let map = new Map<string, COMEntity>();
  map = Communication.PerformAction('GET_ALL_OBJECTS', map);

  const [light, suzanne] = map.values();

  setInterval(() => {
    Communication.PerformAction('UPDATE_OBJECT', {
      id: suzanne.id,
      material: {
        color: '#' + new Color(Math.random(), Math.random(), Math.random()).getHexString(),
        roughness: Math.random(),
        metalness: Math.random(),
      }
    });
  }, 1000);
})

defineProps<{
  msg: string
}>()
</script>
