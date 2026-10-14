<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref, markRaw } from 'vue';
import { QuickView, type QuickViewController } from '@shopware-ag/dive/quickview';

const canvas: Ref<HTMLCanvasElement | null> = ref(null);

const dive: Ref<QuickView | null> = ref(null);

const activeController: Ref<QuickViewController> = ref('orbit');
const error: Ref<string | null> = ref(null);

onMounted(async () => {
    if (!canvas.value) {
        return;
    }

    dive.value = markRaw(await QuickView('model/sofa_B.glb', { canvas: canvas.value }));
});

onUnmounted(() => {
    void dive.value?.disposeAsync();
    dive.value = null;
});

/** Called straight from the click: iOS grants the sensor only inside the gesture. */
const useController = async (kind: QuickViewController) => {
    if (!dive.value) {
        return;
    }

    error.value = null;

    try {
        await dive.value.useController(kind);
    } catch (reason) {
        error.value = reason instanceof Error ? reason.message : String(reason);
    }

    activeController.value = dive.value.activeController;
};
</script>

<template>
    <div class="canvasWrapper">
        <canvas ref="canvas"></canvas>
    </div>
    <div class="controlPanel">
        <div class="controlPanel-buttons">
            <button :disabled="activeController === 'orbit'" @click="useController('orbit')">Orbit</button>
            <button :disabled="activeController === 'gyro'" @click="useController('gyro')">Gyro</button>
        </div>
    </div>
    <div class="infoPanel">
        <span class="controlPanel-label">Controller</span>
        <span>{{ activeController }}</span>
        <span v-if="error" class="infoPanel-error">{{ error }}</span>
    </div>
</template>

<style scoped>
.canvasWrapper {
    display: flex;
    height: 100%;
    width: 100%;
}

.infoPanel-error {
    color: var(--ui-error-text, #d33);
    font-size: 0.8rem;
}
</style>
