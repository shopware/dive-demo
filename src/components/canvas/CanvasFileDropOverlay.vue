<script setup lang="ts">
import { computed, ref } from 'vue';
import {
    isMimeTypeSupported,
    isURIFileExtensionSupported,
    FILE_TYPES
} from '@shopware-ag/dive';

const props = withDefaults(
    defineProps<{
        disabled?: boolean;
        dropLabel?: string;
        unsupportedDropLabel?: string;
    }>(),
    {
        disabled: false,
        dropLabel: 'Drop model to load',
        unsupportedDropLabel: `Unsupported file type. Supported formats are ${Object.keys(FILE_TYPES).join(', ')}.`,
    },
);

const emit = defineEmits<{
    loading: [file: File];
}>();

const genericFileMimeTypes = new Set([
    '',
    'application/octet-stream',
    'binary/octet-stream',
]);

const isDraggingFile = ref(false);
const isUnsupportedDrag = ref(false);

const showDropPanel = computed(() => !props.disabled && isDraggingFile.value);
const dropPanelLabel = computed(() =>
    isUnsupportedDrag.value ? props.unsupportedDropLabel : props.dropLabel,
);

function hasDraggedFile(event: DragEvent) {
    return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}

function getDraggedFileItem(event: DragEvent) {
    return (
        Array.from(event.dataTransfer?.items ?? []).find(
            (item) => item.kind === 'file',
        ) ?? null
    );
}

function getDraggedFile(event: DragEvent): File | null {
    const file = event.dataTransfer?.files?.[0];
    if (file) {
        return file;
    }

    return getDraggedFileItem(event)?.getAsFile() ?? null;
}

function isGenericMimeType(mimeType: string) {
    return genericFileMimeTypes.has(mimeType.toLowerCase());
}

function isSupportedFile(file: File) {
    return (
        isMimeTypeSupported(file.type) || isURIFileExtensionSupported(file.name)
    );
}

function getDraggedFileSupport(event: DragEvent): boolean | null {
    const file = getDraggedFile(event);
    if (file) {
        return isSupportedFile(file);
    }

    const mimeType = getDraggedFileItem(event)?.type ?? '';
    if (isGenericMimeType(mimeType)) {
        return null;
    }

    return isMimeTypeSupported(mimeType);
}

function updateDropEffect(event: DragEvent, support: boolean | null) {
    if (!event.dataTransfer) {
        return;
    }

    event.dataTransfer.dropEffect = support === false ? 'none' : 'copy';
}

function updateDragState(event: DragEvent) {
    const support = getDraggedFileSupport(event);
    isDraggingFile.value = true;
    isUnsupportedDrag.value = support === false;
    updateDropEffect(event, support);
}

function resetDragState() {
    isDraggingFile.value = false;
    isUnsupportedDrag.value = false;
}

function onDragEnter(event: DragEvent) {
    if (props.disabled || !hasDraggedFile(event)) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    updateDragState(event);
}

function onDragOver(event: DragEvent) {
    if (props.disabled || !hasDraggedFile(event)) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    updateDragState(event);
}

function onDragLeave(event: DragEvent) {
    if (!hasDraggedFile(event)) {
        return;
    }

    const currentTarget = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as Node | null;

    if (relatedTarget && currentTarget.contains(relatedTarget)) {
        return;
    }

    resetDragState();
}

function onDrop(event: DragEvent) {
    if (!hasDraggedFile(event)) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    resetDragState();

    if (props.disabled) {
        return;
    }

    const file = getDraggedFile(event);
    if (!file || !isSupportedFile(file)) {
        return;
    }

    emit('loading', file);
}
</script>

<template>
    <div class="canvasFileDropOverlay" @dragenter="onDragEnter" @dragover="onDragOver" @dragleave="onDragLeave"
        @drop="onDrop">
        <slot />
        <div v-if="showDropPanel" class="canvasFileDropOverlay-dropTarget" aria-hidden="true" @dragover="onDragOver"
            @dragleave="onDragLeave" @drop="onDrop">
            <div class="canvasFileDropOverlay-panel" :class="{
                    'canvasFileDropOverlay-panel--unsupported':
                        isUnsupportedDrag,
                }">
                <div class="canvasFileDropOverlay-content">
                    <div class="canvasFileDropOverlay-icons">
                        <span v-if="isUnsupportedDrag"
                            class="canvasFileDropOverlay-icon canvasFileDropOverlay-icon--times"
                            aria-hidden="true"></span>
                        <span v-else class="canvasFileDropOverlay-icon canvasFileDropOverlay-icon--upload"
                            aria-hidden="true"></span>
                    </div>
                    <span class="canvasFileDropOverlay-label">{{ dropPanelLabel }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.canvasFileDropOverlay {
    position: relative;
    height: 100%;
    width: 100%;
}

.canvasFileDropOverlay-dropTarget {
    position: absolute;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    background: transparent;
}

.canvasFileDropOverlay-panel {
    position: relative;
    width: 20rem;
    height: 20rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--ui-panel-border);
    border-radius: 4rem;
    background-color: var(--ui-panel-bg);
    color: var(--ui-btn-text);
    font-size: 0.875rem;
    line-height: 1.2;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    overflow: hidden;
    pointer-events: none;
    transform-origin: center;
    animation: canvasFileDropOverlay-panelReveal 280ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.canvasFileDropOverlay-content {
    position: absolute;
    inset: 0;
    opacity: 0;
    animation: canvasFileDropOverlay-contentReveal 180ms ease-out 260ms both;
}

.canvasFileDropOverlay-icons {
    position: absolute;
    top: 50%;
    left: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translate(-50%, -50%);
}

.canvasFileDropOverlay-icon {
    display: block;
    width: 6rem;
    aspect-ratio: 24 / 13;
    flex: 0 0 auto;
    background-color: currentColor;
}

.canvasFileDropOverlay-icon--upload {
    mask: url('/icon/upload.svg') center / contain no-repeat;
    -webkit-mask: url('/icon/upload.svg') center / contain no-repeat;
}

.canvasFileDropOverlay-icon--times {
    mask: url('/icon/times.svg') center / contain no-repeat;
    -webkit-mask: url('/icon/times.svg') center / contain no-repeat;
}

.canvasFileDropOverlay-label {
    position: absolute;
    top: calc(50% + 3.25rem);
    right: 1rem;
    left: 1rem;
    display: block;
    text-align: center;
    overflow-wrap: anywhere;
}

.canvasFileDropOverlay-panel--unsupported {
    border-color: rgba(220, 38, 38, 0.45);
    color: #dc2626;
}

@keyframes canvasFileDropOverlay-panelReveal {
    from {
        border-radius: 50%;
        opacity: 0;
        transform: scale(0);
    }

    to {
        border-radius: 4rem;
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes canvasFileDropOverlay-contentReveal {
    from {
        opacity: 0;
        transform: translateY(0.5rem);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
