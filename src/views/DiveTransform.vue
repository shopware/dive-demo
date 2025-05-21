<template>
  <div class="canvasWrapper" ref="canvasWrapper">
    <button ref="showHideButton">Show/Hide Gizmo</button>
    <!-- the canvas will be attached here on mount -->
  </div>
</template>

<style scoped lang="scss">
.canvasWrapper {
  display: flex;
  height: 100%;
  width: 100%;

  button {
    position: absolute;
    bottom: 0px;
    left: 0px;
    margin: 10px
  }
}
</style>

<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue';
import { DIVE, type COMModel, type COMPrimitive } from '@shopware-ag/dive';

// declare a ref to hold the element reference
// the name must match template ref value
const canvasWrapper: Ref<HTMLDivElement | null> = ref(null)
const showHideButton: Ref<HTMLButtonElement | null> = ref(null)

onMounted(() => {
  if (!canvasWrapper.value) {
    return;
  }

  const { Canvas, Communication } = new DIVE();
  canvasWrapper.value.appendChild(Canvas);

  Communication.PerformAction('USE_TOOL', { tool: 'select' });

  Communication.PerformAction('ADD_OBJECT', {
    entityType: 'light',
    type: 'scene',
    name: 'light',
    id: 'SceneLight',
    enabled: true,
    visible: true,
    intensity: 1,
    color: 0xffffff,
  });

  Communication.PerformAction('UPDATE_SCENE', {
    backgroundColor: 0xffffff,
    gridEnabled: true,
    floorEnabled: true,
    floorColor: 0xffffff,
  });

  Communication.PerformAction('SET_CAMERA_TRANSFORM', {
    position: { x: -1, y: 2, z: 2.4 },
    target: { x: 0, y: 0.7, z: 0 },
  });

  // cube
  Communication.PerformAction('ADD_OBJECT', {
    id: 'cube',
    name: 'Cube',
    entityType: 'primitive',
    geometry: {
      name: 'box',
      width: 1,
      height: 1,
      depth: 1,
    },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    visible: true,
    material: {
      color: 0xffffff,
      roughness: 0.6,
      metalness: 0.2,
    }
  } as COMPrimitive);

  if (!showHideButton.value) {
    return;
  }

  let visible = false;

  showHideButton.value.onclick = () => {
    Communication.PerformAction('SET_GIZMO_VISIBILITY', visible);
    visible = !visible;
  }
});

defineProps<{
  msg: string
}>()
</script>
