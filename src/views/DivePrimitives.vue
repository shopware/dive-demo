<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue';
import { DIVE, type COMModel, type COMPrimitive } from '@shopware-ag/dive';

// declare a ref to hold the element reference
// the name must match template ref value
const canvasWrapper: Ref<HTMLDivElement | null> = ref(null)

onMounted(() => {
  if (!canvasWrapper.value) {
    return;
  }

  const { Canvas, Communication } = new DIVE();
  canvasWrapper.value.appendChild(Canvas);

  Communication.PerformAction('ADD_OBJECT', {
    entityType: 'light',
    type: 'scene',
    name: 'light',
    id: 'SceneLight',
    enabled: true,
    visible: true,
    intensity: 1,
    color: 0xffffff,
    position: { x: 0, y: 0, z: 0 },
  });

  Communication.PerformAction('UPDATE_SCENE', {
    backgroundColor: 0xfc3588,
    gridEnabled: false,
    floorEnabled: true,
    floorColor: 0xdc87a1,
  });

  Communication.PerformAction('SET_CAMERA_TRANSFORM', {
    position: { x: 0, y: 1, z: 1.4 },
    target: { x: 0, y: 0.7, z: 0 },
  });

  // object
  Communication.PerformAction('ADD_OBJECT', {
    id: 'chair',
    name: 'chair',
    entityType: 'model',
    uri: 'hay_chair.glb',
    position: { x: 0, y: 0, z: -0.7 },
    rotation: { x: 0, y: Math.PI * 0.15, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    visible: true,
  } as COMModel);

  Communication.PerformAction('ADD_OBJECT', {
    id: 'cylinder0',
    name: 'PlainCyliner',
    entityType: 'primitive',
    geometry: {
      name: 'cylinder',
      width: 8,
      height: 0.2,
    },
    position: { x: -3, y: 0.5, z: -3 },
    rotation: { x: Math.PI / 2, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    visible: true,
    material: {
      color: 0xfcbdcf,
      roughness: 0.6,
      metalness: 0.2,
    }
  } as COMPrimitive);

  Communication.PerformAction('ADD_OBJECT', {
    id: 'cylinder1',
    name: 'PlainCyliner',
    entityType: 'primitive',
    geometry: {
      name: 'cylinder',
      width: 6.5,
      height: 0.2,
    },
    position: { x: -3, y: 0.5, z: -2.8 },
    rotation: { x: Math.PI / 2, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    visible: true,
    material: {
      color: 0xf476a1,
      roughness: 0.6,
      metalness: 0.2,
    }
  } as COMPrimitive);

  Communication.PerformAction('ADD_OBJECT', {
    id: 'cylinder2',
    name: 'PlainCyliner',
    entityType: 'primitive',
    geometry: {
      name: 'cylinder',
      width: 4,
      height: 0.2,
    },
    position: { x: -3, y: 0.5, z: -2.6 },
    rotation: { x: Math.PI / 2, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    visible: true,
    material: {
      color: 0xfc3588,
      roughness: 0.6,
      metalness: 0.2,
    }
  } as COMPrimitive);

  Communication.PerformAction('ADD_OBJECT', {
    id: 'cylinder3',
    name: 'PlainCyliner',
    entityType: 'primitive',
    geometry: {
      name: 'cylinder',
      width: 4,
      height: 0.4,
    },
    position: { x: 4, y: 0, z: -6 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    visible: true,
    material: {
      color: 0xdc87a1,
      roughness: 0.6,
      metalness: 0.2,
    }
  } as COMPrimitive);

  Communication.PerformAction('ADD_OBJECT', {
    id: 'cylinder4',
    name: 'PlainCyliner',
    entityType: 'primitive',
    geometry: {
      name: 'cylinder',
      width: 4,
      height: 0.05,
    },
    position: { x: 4, y: 0.4, z: -6 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    visible: true,
    material: {
      color: 0xffc9d8,
      roughness: 0.6,
      metalness: 0.2,
    }
  } as COMPrimitive);
});

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