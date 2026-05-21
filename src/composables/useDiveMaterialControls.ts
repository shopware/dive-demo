import type { BindingApi, FolderApi } from '@tweakpane/core';
import { Pane } from 'tweakpane';
import {
    applyDiveMaterialState,
    createDiveMaterialState,
    DIVE_MATERIAL_MAPS,
    resolveDiveMaterials,
    resetDiveMaterialState,
    setMaterialMapUse,
    setUseAsDiffuseMode,
    type DiveInspectableMaterial,
    type DiveMaterialMapKey,
    type DiveMaterialModel,
    type DiveMaterialState,
} from '@/utils/diveMaterialControls';

type BindingSet = {
    use: BindingApi<unknown, boolean>;
    useAsDiffuse: BindingApi<unknown, boolean>;
};

type MaterialPane = {
    pane: Pane;
    material: DiveInspectableMaterial;
    state: DiveMaterialState;
    bindings: Map<DiveMaterialMapKey, BindingSet>;
};

type DiveMaterialControlsOptions = {
    getModel: () => DiveMaterialModel | null | undefined;
    title?: string;
};

export function useDiveMaterialControls({
    getModel,
    title = 'Material',
}: DiveMaterialControlsOptions) {
    let paneContainer: HTMLDivElement | null = null;
    let materialPanes: MaterialPane[] = [];
    let paneScrollbarHideTimeout: number | null = null;

    function rebuildPane() {
        disposePane();

        const materials = resolveDiveMaterials(getModel());
        if (!materials.length) return;

        paneContainer = createPaneContainer();
        materials.forEach((material, index) => {
            if (!paneContainer) return;

            const state = createDiveMaterialState(material);
            applyDiveMaterialState(material, state);

            const pane = new Pane({
                title: getPaneTitle(material, index, materials.length),
                container: paneContainer,
            });
            pane.element.style.width = '100%';
            pane.element.style.flex = '0 0 auto';

            const materialPane = {
                pane,
                material,
                state,
                bindings: new Map<DiveMaterialMapKey, BindingSet>(),
            };

            materialPanes.push(materialPane);
            bindMaterialPane(materialPane);
            syncBindings(materialPane);
            pane.refresh();
        });
    }

    function disposePane() {
        materialPanes.forEach((materialPane) => materialPane.pane.dispose());
        materialPanes = [];
        if (paneScrollbarHideTimeout !== null) {
            window.clearTimeout(paneScrollbarHideTimeout);
            paneScrollbarHideTimeout = null;
        }
        paneContainer?.remove();
        paneContainer = null;
    }

    function resetMaterial() {
        materialPanes.forEach((materialPane) => {
            resetDiveMaterialState(materialPane.state);
            applyAndRefresh(materialPane);
        });
    }

    function bindMaterialPane(materialPane: MaterialPane) {
        DIVE_MATERIAL_MAPS.forEach((layer) => {
            const hasTexture = Boolean(
                materialPane.state.sourceTextures[layer.key],
            );
            const folder = materialPane.pane.addFolder({
                title: layer.title,
            });
            const control = materialPane.state.controls[layer.key];

            bindLayerMaterialProperties(folder, materialPane, layer.key);

            const use = folder
                .addBinding(control, 'use', {
                    label: 'Use Map',
                    disabled: !hasTexture,
                })
                .on('change', (event) => {
                    setMaterialMapUse(
                        materialPane.state,
                        layer.key,
                        event.value,
                    );
                    applyAndRefresh(materialPane);
                });
            const useAsDiffuse = folder
                .addBinding(control, 'useAsDiffuse', {
                    label: 'Use as diffuse',
                    disabled: true,
                })
                .on('change', (event) => {
                    setUseAsDiffuseMode(
                        materialPane.state,
                        layer.key,
                        event.value,
                    );
                    applyAndRefresh(materialPane);
                });

            materialPane.bindings.set(layer.key, {
                use,
                useAsDiffuse,
            });
        });
    }

    function bindLayerMaterialProperties(
        folder: FolderApi,
        materialPane: MaterialPane,
        key: DiveMaterialMapKey,
    ) {
        switch (key) {
            case 'map':
                folder
                    .addBinding(materialPane.state, 'baseColor', {
                        label: 'Color',
                    })
                    .on('change', () => applyAndRefresh(materialPane));
                break;

            case 'normalMap':
                folder
                    .addBinding(materialPane.state, 'normalScale', {
                        label: 'Intensity',
                        x: {
                            min: -2,
                            max: 2,
                            step: 0.01,
                        },
                        y: {
                            min: -2,
                            max: 2,
                            step: 0.01,
                        },
                    })
                    .on('change', () => applyAndRefresh(materialPane));
                break;

            case 'roughnessMap':
                folder
                    .addBinding(materialPane.state, 'roughness', {
                        label: 'Roughness',
                        min: 0,
                        max: 1,
                        step: 0.01,
                    })
                    .on('change', () => applyAndRefresh(materialPane));
                break;

            case 'metalnessMap':
                folder
                    .addBinding(materialPane.state, 'metalness', {
                        label: 'Metalness',
                        min: 0,
                        max: 1,
                        step: 0.01,
                    })
                    .on('change', () => applyAndRefresh(materialPane));
                break;

            case 'alphaMap':
                folder
                    .addBinding(materialPane.state, 'alpha', {
                        label: 'Alpha',
                        min: 0,
                        max: 1,
                        step: 0.01,
                    })
                    .on('change', () => applyAndRefresh(materialPane));
                folder
                    .addBinding(materialPane.state, 'alphaTest', {
                        label: 'Alpha Test',
                        min: 0,
                        max: 1,
                        step: 0.01,
                    })
                    .on('change', () => applyAndRefresh(materialPane));
                break;

            case 'aoMap':
                folder
                    .addBinding(materialPane.state, 'aoIntensity', {
                        label: 'Intensity',
                        min: 0,
                        max: 1,
                        step: 0.01,
                    })
                    .on('change', () => applyAndRefresh(materialPane));
                break;

            case 'emissiveMap':
                folder
                    .addBinding(materialPane.state, 'emissiveColor', {
                        label: 'Color',
                    })
                    .on('change', () => applyAndRefresh(materialPane));
                folder
                    .addBinding(materialPane.state, 'emissiveIntensity', {
                        label: 'Intensity',
                        min: 0,
                        max: 5,
                        step: 0.01,
                    })
                    .on('change', () => applyAndRefresh(materialPane));
                break;
        }
    }

    function applyAndRefresh(materialPane: MaterialPane) {
        applyDiveMaterialState(materialPane.material, materialPane.state);
        syncBindings(materialPane);
        materialPane.pane.refresh();
    }

    function syncBindings(materialPane: MaterialPane) {
        DIVE_MATERIAL_MAPS.forEach((layer) => {
            const layerBindings = materialPane.bindings.get(layer.key);
            if (!layerBindings) return;

            const hasTexture = Boolean(
                materialPane.state.sourceTextures[layer.key],
            );

            layerBindings.use.disabled = !hasTexture;
            layerBindings.useAsDiffuse.disabled = !hasTexture;
        });
    }

    function createPaneContainer() {
        const container = document.createElement('div');
        container.className = 'dive-material-panes';
        container.style.position = 'fixed';
        container.style.top = '8px';
        container.style.right = '8px';
        container.style.bottom = '8px';
        container.style.zIndex = '20';
        container.style.width = 'min(320px, calc(100vw - 16px))';
        container.style.minHeight = '0';
        container.style.overflowY = 'auto';
        container.style.overflowX = 'hidden';
        container.style.overscrollBehavior = 'contain';
        container.style.scrollbarGutter = 'auto';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '8px';
        container.style.pointerEvents = 'auto';
        container.style.setProperty('-webkit-overflow-scrolling', 'touch');
        container.addEventListener('scroll', revealPaneScrollbar, {
            passive: true,
        });
        container.addEventListener('wheel', stopPaneScrollPropagation, {
            passive: true,
        });
        container.addEventListener('touchmove', stopPaneScrollPropagation, {
            passive: true,
        });
        document.body.appendChild(container);

        return container;
    }

    function stopPaneScrollPropagation(event: Event) {
        event.stopPropagation();
    }

    function revealPaneScrollbar() {
        if (!paneContainer) return;

        paneContainer.classList.add('is-scrolling');

        if (paneScrollbarHideTimeout !== null) {
            window.clearTimeout(paneScrollbarHideTimeout);
        }

        paneScrollbarHideTimeout = window.setTimeout(() => {
            paneContainer?.classList.remove('is-scrolling');
            paneScrollbarHideTimeout = null;
        }, 800);
    }

    function getPaneTitle(
        material: DiveInspectableMaterial,
        index: number,
        materialCount: number,
    ) {
        const baseTitle =
            materialCount > 1 ? `${title} ${index + 1}` : title;

        return material.name ? `${baseTitle}: ${material.name}` : baseTitle;
    }

    return {
        rebuildPane,
        disposePane,
        resetMaterial,
    };
}
