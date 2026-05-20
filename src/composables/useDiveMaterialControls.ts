import type { BindingApi } from '@tweakpane/core';
import { Pane } from 'tweakpane';
import {
    applyDiveMaterialState,
    createDiveMaterialState,
    DIVE_MATERIAL_MAPS,
    resolveDiveMaterials,
    resetDiveMaterialState,
    setOnlyMaterialMap,
    setUseAsDiffuseMode,
    type DiveInspectableMaterial,
    type DiveMaterialMapKey,
    type DiveMaterialModel,
    type DiveMaterialState,
} from '@/utils/diveMaterialControls';

type BindingSet = {
    use: BindingApi<unknown, boolean>;
    only: BindingApi<unknown, boolean>;
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
                expanded: hasTexture,
            });
            const control = materialPane.state.controls[layer.key];
            const use = folder
                .addBinding(control, 'use', {
                    label: 'Use',
                    disabled: !hasTexture,
                })
                .on('change', () => applyAndRefresh(materialPane));
            const only = folder
                .addBinding(control, 'only', {
                    label: 'Only',
                    disabled: !hasTexture,
                })
                .on('change', (event) => {
                    setOnlyMaterialMap(
                        materialPane.state,
                        event.value ? layer.key : null,
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
                only,
                useAsDiffuse,
            });
        });
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
            layerBindings.only.disabled = !hasTexture;
            layerBindings.useAsDiffuse.disabled = !hasTexture;
        });
    }

    function createPaneContainer() {
        const container = document.createElement('div');
        container.className = 'dive-material-panes';
        container.style.position = 'absolute';
        container.style.top = '8px';
        container.style.right = '8px';
        container.style.zIndex = '10';
        container.style.width = '300px';
        container.style.maxHeight = 'calc(100% - 16px)';
        container.style.overflowY = 'auto';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '8px';
        document.body.appendChild(container);

        return container;
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
