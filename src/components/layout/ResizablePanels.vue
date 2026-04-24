<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';

type Orientation = 'horizontal' | 'vertical';

const props = defineProps<{
    initialSizes?: number[]
    minSize?: number | number[]
    orientation?: Orientation
    gutterSize?: number
}>();

const emit = defineEmits<{
    (e: 'update:sizes', sizes: number[]): void
    (e: 'resize-start', index: number): void
    (e: 'resizing', sizes: number[]): void
    (e: 'resize-end', sizes: number[]): void
}>();

const containerEl: Ref<HTMLDivElement | null> = ref(null);

const orientation = computed<Orientation>(() => props.orientation ?? 'horizontal');
const gutterSize = props.gutterSize ?? 6;

const panelCount = computed<number>(() => {
    // Number of panels equals number of provided slots named panel-<index>.
    // Fallback to length of initialSizes if provided.
    const fromSizes = props.initialSizes?.length ?? 0;
    return Math.max(fromSizes, 2);
});

const sizes = ref<number[]>([]);

function normalizeInitialSizes(): number[] {
    if (props.initialSizes && props.initialSizes.length >= 2) {
        const sum = props.initialSizes.reduce((acc, v) => acc + v, 0);
        if (sum === 100) return [...props.initialSizes];
        if (sum > 0) return props.initialSizes.map(v => (v / sum) * 100);
    }
    const equal = 100 / panelCount.value;
    return Array.from({ length: panelCount.value }, () => equal);
}

function getMinSize(index: number): number {
    if (Array.isArray(props.minSize)) {
        return props.minSize[index] ?? 5;
    }
    return typeof props.minSize === 'number' ? props.minSize : 5;
}

let dragIndex = -1;
let startPos = 0;
let startSizes: number[] = [];

function onGutterDown(index: number, event: MouseEvent | TouchEvent) {
    dragIndex = index;
    startPos = getPosition(event);
    startSizes = [...sizes.value];
    emit('resize-start', index);
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp, { passive: false });
    document.body.style.userSelect = 'none';
    document.body.style.cursor = orientation.value === 'horizontal' ? 'col-resize' : 'row-resize';
}

function getPosition(event: MouseEvent | TouchEvent): number {
    if ('touches' in event && event.touches[0]) {
        return orientation.value === 'horizontal' ? event.touches[0].clientX : event.touches[0].clientY;
    }
    const e = event as MouseEvent;
    return orientation.value === 'horizontal' ? e.clientX : e.clientY;
}

function onMove(event: MouseEvent | TouchEvent) {
    if (dragIndex < 0 || !containerEl.value) return;
    event.preventDefault();

    const currentPos = getPosition(event);
    const delta = currentPos - startPos;

    const containerRect = containerEl.value.getBoundingClientRect();
    const containerSize = orientation.value === 'horizontal' ? containerRect.width : containerRect.height;
    const deltaPercent = (delta / containerSize) * 100;

    const leftIndex = dragIndex;
    const rightIndex = dragIndex + 1;

    let leftNew = startSizes[leftIndex] + deltaPercent;
    let rightNew = startSizes[rightIndex] - deltaPercent;

    const leftMin = getMinSize(leftIndex);
    const rightMin = getMinSize(rightIndex);

    if (leftNew < leftMin) {
        rightNew -= (leftMin - leftNew);
        leftNew = leftMin;
    }
    if (rightNew < rightMin) {
        leftNew -= (rightMin - rightNew);
        rightNew = rightMin;
    }

    const next = [...sizes.value];
    next[leftIndex] = Math.max(leftMin, Math.min(100 - rightMin, leftNew));
    next[rightIndex] = Math.max(rightMin, Math.min(100 - leftMin, rightNew));
    sizes.value = next;
    emit('resizing', next);
    emit('update:sizes', next);
}

function onUp() {
    if (dragIndex < 0) return;
    dragIndex = -1;
    emit('resize-end', sizes.value);
    window.removeEventListener('mousemove', onMove as any);
    window.removeEventListener('mouseup', onUp as any);
    window.removeEventListener('touchmove', onMove as any);
    window.removeEventListener('touchend', onUp as any);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
}

onMounted(() => {
    sizes.value = normalizeInitialSizes();
});

watch(() => props.initialSizes, (v) => {
    if (!v || v.length < 2) return;
    sizes.value = normalizeInitialSizes();
});

onBeforeUnmount(() => {
    onUp();
});
</script>

<template>
    <div ref="containerEl" class="resizable-panels" :class="{ vertical: orientation === 'vertical' }" role="group">
        <template v-for="(_, i) in panelCount" :key="`panel-${i}`">
            <div class="panel"
                :style="orientation === 'horizontal' ? { width: sizes[i] + '%' } : { height: sizes[i] + '%' }">
                <slot :name="`panel-${i}`"></slot>
            </div>
            <div v-if="i < panelCount - 1" class="gutter"
                :class="orientation === 'horizontal' ? 'gutter-x' : 'gutter-y'"
                :style="orientation === 'horizontal' ? { width: gutterSize + 'px' } : { height: gutterSize + 'px' }"
                @mousedown.prevent="onGutterDown(i, $event)" @touchstart.prevent="onGutterDown(i, $event)"
                role="separator" :aria-orientation="orientation === 'horizontal' ? 'vertical' : 'horizontal'"
                aria-label="Resize panels" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="sizes[i]" />
        </template>
    </div>

</template>

<style scoped>
.resizable-panels {
    display: flex;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
}

.resizable-panels.vertical {
    flex-direction: column;
}

.panel {
    position: relative;
    display: flex;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
}

.gutter {
    background-color: rgba(0, 0, 0, 0.1);
    flex: 0 0 auto;
    z-index: 10;
    position: relative;
    transition: background-color 0.15s ease-in-out;
}

.gutter:hover,
.gutter:active {
    background-color: rgba(0, 0, 0, 0.2);
}

.gutter.gutter-x {
    cursor: col-resize;
}

.gutter.gutter-y {
    cursor: row-resize;
}
</style>
