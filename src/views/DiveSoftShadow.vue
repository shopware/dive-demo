<script setup lang="ts">
import { markRaw, nextTick, onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
import { SoftShadowComponent } from '@shopware-ag/dive';
import { QuickView } from '@shopware-ag/dive/quickview';
import CanvasFileDropOverlay from '@/components/canvas/CanvasFileDropOverlay.vue';

/**
 * The floor stays light whatever the page theme is.
 *
 * Deliberately not themed like the other examples: the shadow is black, and a
 * black shadow on a black floor demonstrates nothing. What is on show here is
 * the ground under the model, so the ground is the one thing that cannot move.
 */
const FLOOR_COLOR = '#f2f2f2';

const canvas = ref<HTMLCanvasElement | null>(null);
const dive: Ref<QuickView | null> = ref(null);

const enabled = ref(true);
const softness = ref(0.12);
const darkness = ref(0.9);
const opacity = ref(0.75);
const resolution = ref(512);
const color = ref('#000000');

/**
 * Whether the first bake has landed.
 *
 * Read off the component rather than timed: the shadow needs a renderer and a
 * scene, and those only reach it through `onBeforeRender` on its own plane, so
 * it appears in the second frame rather than when `QuickView` resolves.
 */
const shadowReady = ref(false);

let shadow: SoftShadowComponent | null = null;
let disposed = false;

const applySettings = () => {
    shadow
        ?.setVisibility(enabled.value)
        .setSoftness(softness.value)
        .setDarkness(darkness.value)
        .setOpacity(opacity.value)
        .setResolution(resolution.value)
        .setColor(color.value);
};

const awaitBake = () => {
    if (disposed || !shadow) {
        return;
    }

    if (!shadow.needsBake) {
        shadowReady.value = true;
        return;
    }

    requestAnimationFrame(awaitBake);
};

const attachShadow = () => {
    /**
     * the node, not the mesh component: a shadow encloses whatever its owner
     * carries, and the node is the handle for the whole loaded subtree
     */
    const node = dive.value?.model;

    shadowReady.value = false;
    shadow = null;

    if (!node) {
        return;
    }

    /**
     * QuickView reuses the model node across loads, so the shadow from the
     * last one is still there -- and re-bakes itself, since the new content
     * and the drop arrive as events on its owner
     */
    shadow =
        node.getComponent(SoftShadowComponent) ??
        node.addComponent(new SoftShadowComponent());
    applySettings();
    awaitBake();
};

watch([enabled, softness, darkness, opacity, resolution, color], () => {
    if (disposed) {
        return;
    }

    shadowReady.value = false;
    applySettings();
    awaitBake();
});

const initializeDive = async () => {
    await nextTick();

    const targetCanvas = canvas.value;
    if (!targetCanvas || disposed) {
        return;
    }

    const quickView = await QuickView('model/sofa_B.glb', {
        canvas: targetCanvas,
        displayFloor: true,
        displayGrid: false,
    });

    if (disposed) {
        await quickView.disposeAsync();
        return;
    }

    dive.value = markRaw(quickView);
    quickView.scene.root.floor.setColor(FLOOR_COLOR);

    attachShadow();
};

const loadFile = async (file: File) => {
    const targetDive = dive.value;
    if (!targetDive || disposed) {
        return;
    }

    const url = URL.createObjectURL(file);

    try {
        await targetDive.load(url);
    } finally {
        URL.revokeObjectURL(url);
    }

    attachShadow();
};

onMounted(() => {
    void initializeDive().catch(() => undefined);
});

onUnmounted(() => {
    disposed = true;
    shadow = null;
    void dive.value?.disposeAsync();
    dive.value = null;
});
</script>

<template>
    <CanvasFileDropOverlay class="canvasWrapper" @loading="loadFile">
        <canvas ref="canvas" :data-shadow-ready="shadowReady"></canvas>

        <div class="controlPanel controlPanel--top controlPanel--row">
            <div class="controlPanel-group">
                <span class="controlPanel-label">Shadow</span>
                <label class="checkbox-button">
                    <input
                        v-model="enabled"
                        type="checkbox"
                        aria-label="Show soft shadow"
                    />
                    Show soft shadow
                </label>
            </div>

            <div class="controlPanel-group">
                <span class="controlPanel-label">Softness</span>
                <div class="sliderRow">
                    <input
                        v-model.number="softness"
                        type="range"
                        min="0.01"
                        max="0.5"
                        step="0.01"
                        aria-label="Softness"
                    />
                    <span class="sliderValue">{{ softness.toFixed(2) }} m</span>
                </div>
            </div>

            <div class="controlPanel-group">
                <span class="controlPanel-label">Darkness</span>
                <div class="sliderRow">
                    <input
                        v-model.number="darkness"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        aria-label="Darkness"
                    />
                    <span class="sliderValue">{{ darkness.toFixed(2) }}</span>
                </div>
            </div>

            <div class="controlPanel-group">
                <span class="controlPanel-label">Opacity</span>
                <div class="sliderRow">
                    <input
                        v-model.number="opacity"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        aria-label="Opacity"
                    />
                    <span class="sliderValue">{{ opacity.toFixed(2) }}</span>
                </div>
            </div>

            <div class="controlPanel-group">
                <span class="controlPanel-label">Resolution</span>
                <select
                    v-model.number="resolution"
                    class="resolutionSelect"
                    aria-label="Resolution"
                >
                    <option :value="128">128 px</option>
                    <option :value="256">256 px</option>
                    <option :value="512">512 px</option>
                    <option :value="1024">1024 px</option>
                </select>
            </div>

            <div class="controlPanel-group">
                <span class="controlPanel-label">Color</span>
                <input
                    v-model="color"
                    type="color"
                    class="colorInput"
                    aria-label="Shadow color"
                />
            </div>
        </div>

        <div class="infoBadge">
            <span>Baked contact shadow &mdash; no light, no shadow map</span>
            <span>{{ shadowReady ? 'Baked' : 'Baking…' }}</span>
        </div>
    </CanvasFileDropOverlay>
</template>

<style scoped>
.canvasWrapper {
    position: relative;
    display: flex;
    height: 100%;
    width: 100%;
}

/**
 * Six groups do not fit one row beside the sidebar, and the panel is centred
 * on the canvas, so an overflow disappears under it on both sides.
 */
.controlPanel--row {
    flex-wrap: wrap;
    justify-content: center;
    max-width: calc(100% - 2rem);
    row-gap: 0.85rem;
}

.sliderRow {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.sliderRow input[type='range'] {
    width: 9rem;
}

.sliderValue {
    min-width: 4rem;
    text-align: right;
    color: var(--ui-btn-text);
    font-variant-numeric: tabular-nums;
}

.checkbox-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--ui-btn-text);
}

.resolutionSelect {
    padding: 0.45rem 0.85rem;
    border-radius: 0.35rem;
    border: 1px solid var(--ui-btn-border);
    background-color: var(--ui-btn-bg);
    color: var(--ui-btn-text);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

.colorInput {
    width: 3rem;
    height: 2rem;
    padding: 0;
    border: 1px solid var(--ui-btn-border);
    border-radius: 0.35rem;
    background-color: var(--ui-btn-bg);
}

.infoBadge {
    position: absolute;
    left: 1rem;
    bottom: 1rem;
    display: inline-flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.6rem 0.85rem;
    border-radius: 0.75rem;
    background-color: var(--ui-panel-bg);
    border: 1px solid var(--ui-panel-border);
    color: var(--ui-btn-text);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}
</style>
