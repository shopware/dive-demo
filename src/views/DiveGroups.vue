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
import { DIVE, type COMModel, type COMPrimitive } from '@shopware-ag/dive';

// declare a ref to hold the element reference.
// the name must match template ref value
const canvasWrapper: Ref<HTMLDivElement | null> = ref(null)

onMounted(() => {
    if (!canvasWrapper.value) {
        return;
    }

    const { Canvas, Communication } = new DIVE();
    canvasWrapper.value.appendChild(Canvas);

    Communication.PerformAction('USE_TOOL', { tool: 'select' });

    Communication.PerformAction('SET_GIZMO_MODE', { mode: 'scale' });

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
        backgroundColor: 0xffffff,
        gridEnabled: false,
        floorEnabled: false,
        floorColor: 0xffffff,
    });



    // stage setup
    Communication.PerformAction('ADD_OBJECT', {
        id: 'group_stage',
        name: 'GroupStage',
        entityType: 'group',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
        bbVisible: true,
    });
    Communication.PerformAction('ADD_OBJECT', {
        id: 'wall',
        name: 'SolidWall',
        entityType: 'primitive',
        geometry: {
            name: 'wall',
            width: 16,
            depth: 0.05,
            height: 4,
        },
        position: { x: 0, y: 0, z: -1 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
        material: {
            color: 0xaaccff,
            roughness: 0.8,
            metalness: 0.1,
        },
        parent: {
            id: 'group_stage'
        }
    } as COMPrimitive);

    Communication.PerformAction('ADD_OBJECT', {
        id: 'plane',
        name: 'ChillFloor',
        entityType: 'primitive',
        geometry: {
            name: 'plane',
            width: 16,
            depth: 8,
            height: 0.05,
        },
        position: { x: 0, y: 0, z: 3 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
        material: {
            color: 0xffaaaa,
            roughness: 0.8,
            metalness: 0.1,
        },
        parent: {
            id: 'group_stage'
        }
    } as COMPrimitive);



    // sofa
    Communication.PerformAction('ADD_OBJECT', {
        id: 'sofa',
        name: 'sofa',
        entityType: 'model',
        uri: 'sofa_B.glb',
        position: { x: 0, y: 0, z: -0.25 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
    } as COMModel);



    // plant
    Communication.PerformAction('ADD_OBJECT', {
        id: 'group_plant',
        name: 'GroupPlant',
        entityType: 'group',
        position: { x: 0, y: 0, z: -0.25 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
        bbVisible: true,
    });

    Communication.PerformAction('ADD_OBJECT', {
        id: 'cylinderPot',
        name: 'PlainCyliner',
        entityType: 'primitive',
        geometry: {
            name: 'cylinder',
            width: 0.6,
            height: 0.4,
        },
        position: { x: -2.4, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
        material: {
            color: 0xdddddd,
            roughness: 0.2,
            metalness: 0.0,
        },
        parent: {
            id: 'group_plant'
        },
    } as COMPrimitive);

    Communication.PerformAction('ADD_OBJECT', {
        id: 'cone',
        name: 'PlasticCone',
        entityType: 'primitive',
        geometry: {
            name: 'cone',
            width: 0.2,
            depth: 0.2,
            height: 1.5,
        },
        position: { x: -2.4, y: 0.4, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
        material: {
            color: 0x774400,
            roughness: 0.4,
            metalness: 0.0,
        },
        parent: {
            id: 'group_plant'
        },
    } as COMPrimitive);

    Communication.PerformAction('ADD_OBJECT', {
        id: 'sphere1',
        name: 'RoughSphere',
        entityType: 'primitive',
        geometry: {
            name: 'sphere',
            width: 0.4,
        },
        position: { x: -2.2, y: 1.8, z: 0.1 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
        material: {
            color: 0x008800,
            roughness: 1.0,
            metalness: 0.0,
        },
        parent: {
            id: 'group_plant'
        },
    } as COMPrimitive);

    Communication.PerformAction('ADD_OBJECT', {
        id: 'sphere2',
        name: 'RoughSphere',
        entityType: 'primitive',
        geometry: {
            name: 'sphere',
            width: 0.3,
        },
        position: { x: -2.4, y: 1.6, z: -0.2 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
        material: {
            color: 0x008800,
            roughness: 1.0,
            metalness: 0.0,
        },
        parent: {
            id: 'group_plant'
        },
    } as COMPrimitive);

    Communication.PerformAction('ADD_OBJECT', {
        id: 'sphere3',
        name: 'RoughSphere',
        entityType: 'primitive',
        geometry: {
            name: 'sphere',
            width: 0.35,
        },
        position: { x: -2.5, y: 1.5, z: 0.2 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
        material: {
            color: 0x008800,
            roughness: 1.0,
            metalness: 0.0,
        },
        parent: {
            id: 'group_plant'
        },
    } as COMPrimitive);



    // lamp
    Communication.PerformAction('ADD_OBJECT', {
        id: 'group_lamp',
        name: 'GroupLamp',
        entityType: 'group',
        position: { x: 0, y: 0, z: 1 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
        bbVisible: true,
    });

    Communication.PerformAction('ADD_OBJECT', {
        id: 'pyramid',
        name: 'ShinyPyramid',
        entityType: 'primitive',
        geometry: {
            name: 'pyramid',
            width: 0.3,
            height: 1.8,
        },
        position: { x: 2, y: 0, z: -0.2 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
        material: {
            color: 0xcc9999,
            roughness: 0.1,
            metalness: 0.5,
        },
        parent: {
            id: 'group_lamp'
        }
    } as COMPrimitive);

    Communication.PerformAction('ADD_OBJECT', {
        id: 'cylinder',
        name: 'PlainCyliner',
        entityType: 'primitive',
        geometry: {
            name: 'cylinder',
            width: 0.8,
            height: 0.4,
        },
        position: { x: 2, y: 1.6, z: -0.2 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
        material: {
            color: 0xcc9999,
            roughness: 0.6,
            metalness: 0.2,
        },
        parent: {
            id: 'group_lamp'
        }
    } as COMPrimitive);

    Communication.PerformAction('SELECT_OBJECT', {
        id: 'group_plant'
    });

    const groups = Communication.PerformAction('GET_OBJECTS', {
        ids: ['group_stage', 'group_plant', 'group_lamp']
    });

    console.log(groups);

    window.addEventListener('keypress', (event) => {
        if (event.key === 'g') {
            console.log('GROUP!');
            Communication.PerformAction('UPDATE_OBJECT', {
                id: 'cylinder',
                parent: {
                    id: 'group_lamp'
                }
            });
        }
        if (event.key === 'u') {
            console.log('UNGROUP!');
            Communication.PerformAction('UPDATE_OBJECT', {
                id: 'cylinder',
                parent: null
            });
        }

    });
});

defineProps<{
    msg: string
}>()
</script>
