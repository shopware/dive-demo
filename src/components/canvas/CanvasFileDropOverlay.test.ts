import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import CanvasFileDropOverlay from './CanvasFileDropOverlay.vue';

vi.mock('@shopware-ag/dive', () => {
    const supportedExtensions = new Set([
        'glb',
        'gltf',
        'usdz',
        'step',
        'stp',
        'iges',
        'igs',
    ]);
    const supportedMimeTypes = new Set([
        'application/iges',
        'application/step',
        'model/gltf+json',
        'model/gltf-binary',
        'model/iges',
        'model/step',
        'model/step+zip',
        'model/step+xml',
        'model/vnd.usdz+zip',
    ]);

    return {
        isMimeTypeSupported: (mimeType: string) =>
            supportedMimeTypes.has(mimeType.toLowerCase()),
        isURIFileExtensionSupported: (uri: string) => {
            const filename = (uri.split('/').pop() ?? '').split(/[?#]/)[0];
            const extension =
                filename.includes('.') && !filename.endsWith('.')
                    ? filename.split('.').pop()
                    : '';

            return supportedExtensions.has(extension?.toLowerCase() ?? '');
        },
    };
});

function createDragEvent(
    type: string,
    fileName = 'model.glb',
    options: {
        fileAvailable?: boolean;
        itemType?: string;
        types?: string[];
    } = {},
) {
    const { fileAvailable = true, itemType = '', types = ['Files'] } = options;
    const file = new File(['model'], fileName, { type: itemType });
    const dataTransfer = {
        dropEffect: 'none',
        files: fileAvailable ? [file] : [],
        items: [
            {
                kind: 'file',
                type: itemType,
                getAsFile: () => (fileAvailable ? file : null),
            },
        ],
        types,
    };
    const event = new Event(type, {
        bubbles: true,
        cancelable: true,
    }) as DragEvent;

    Object.defineProperty(event, 'dataTransfer', {
        configurable: true,
        value: dataTransfer,
    });

    return { dataTransfer, event, file };
}

describe('CanvasFileDropOverlay', () => {
    it('shows the drop panel while a supported model MIME type is dragged over it', async () => {
        const wrapper = mount(CanvasFileDropOverlay, {
            slots: {
                default: '<canvas />',
            },
        });
        const { dataTransfer, event } = createDragEvent(
            'dragenter',
            'model.glb',
            {
                fileAvailable: false,
                itemType: 'model/gltf-binary',
            },
        );

        wrapper.element.dispatchEvent(event);
        await nextTick();

        const panel = wrapper.find('.canvasFileDropOverlay-panel');
        expect(panel.text()).toBe('Drop model to load');
        expect(panel.classes()).not.toContain(
            'canvasFileDropOverlay-panel--unsupported',
        );
        expect(dataTransfer.dropEffect).toBe('copy');
    });

    it('shows the unsupported text when an unsupported MIME type is dragged over it', async () => {
        const wrapper = mount(CanvasFileDropOverlay, {
            props: {
                unsupportedDropLabel: 'This file type is not supported',
            },
            slots: {
                default: '<canvas />',
            },
        });
        const { dataTransfer, event } = createDragEvent(
            'dragenter',
            'model.txt',
            {
                fileAvailable: false,
                itemType: 'text/plain',
            },
        );

        wrapper.element.dispatchEvent(event);
        await nextTick();

        const panel = wrapper.find('.canvasFileDropOverlay-panel');
        expect(panel.text()).toBe('This file type is not supported');
        expect(panel.classes()).toContain(
            'canvasFileDropOverlay-panel--unsupported',
        );
        expect(dataTransfer.dropEffect).toBe('none');
    });

    it('keeps the regular drop text while support cannot be known during drag', async () => {
        const wrapper = mount(CanvasFileDropOverlay, {
            slots: {
                default: '<canvas />',
            },
        });
        const { dataTransfer, event } = createDragEvent(
            'dragenter',
            'model.glb',
            {
                fileAvailable: false,
                itemType: 'application/octet-stream',
            },
        );

        wrapper.element.dispatchEvent(event);
        await nextTick();

        const panel = wrapper.find('.canvasFileDropOverlay-panel');
        expect(panel.text()).toBe('Drop model to load');
        expect(panel.classes()).not.toContain(
            'canvasFileDropOverlay-panel--unsupported',
        );
        expect(dataTransfer.dropEffect).toBe('copy');
    });

    it('does not show the drop panel for non-file drags', async () => {
        const wrapper = mount(CanvasFileDropOverlay, {
            slots: {
                default: '<canvas />',
            },
        });

        wrapper.element.dispatchEvent(
            createDragEvent('dragenter', 'model.glb', {
                fileAvailable: false,
                itemType: 'model/gltf-binary',
                types: ['text/plain'],
            }).event,
        );
        await nextTick();

        expect(wrapper.find('.canvasFileDropOverlay-panel').exists()).toBe(
            false,
        );
    });

    it('emits loading with supported drops by file extension', () => {
        const wrapper = mount(CanvasFileDropOverlay, {
            slots: {
                default: '<canvas />',
            },
        });
        const { event, file } = createDragEvent('drop', 'model.step', {
            itemType: 'text/plain',
        });

        wrapper.element.dispatchEvent(event);

        expect(wrapper.emitted('loading')).toEqual([[file]]);
    });

    it('emits loading with supported drops by MIME type', () => {
        const wrapper = mount(CanvasFileDropOverlay, {
            slots: {
                default: '<canvas />',
            },
        });
        const { event, file } = createDragEvent(
            'drop',
            'model-without-extension',
            {
                itemType: 'model/gltf-binary',
            },
        );

        wrapper.element.dispatchEvent(event);

        expect(wrapper.emitted('loading')).toEqual([[file]]);
    });

    it('does not emit loading for unsupported drops', () => {
        const wrapper = mount(CanvasFileDropOverlay, {
            slots: {
                default: '<canvas />',
            },
        });

        wrapper.element.dispatchEvent(
            createDragEvent('drop', 'model.txt', {
                itemType: 'text/plain',
            }).event,
        );

        expect(wrapper.emitted('loading')).toBeUndefined();
    });

    it('does not emit loading while disabled', async () => {
        const wrapper = mount(CanvasFileDropOverlay, {
            props: {
                disabled: true,
            },
            slots: {
                default: '<canvas />',
            },
        });

        wrapper.element.dispatchEvent(
            createDragEvent('dragenter', 'model.glb', {
                itemType: 'model/gltf-binary',
            }).event,
        );
        wrapper.element.dispatchEvent(
            createDragEvent('drop', 'model.glb', {
                itemType: 'model/gltf-binary',
            }).event,
        );
        await nextTick();

        expect(wrapper.find('.canvasFileDropOverlay-panel').exists()).toBe(
            false,
        );
        expect(wrapper.emitted('loading')).toBeUndefined();
    });
});
