import type { BindingApi } from '@tweakpane/core';
import { Pane } from 'tweakpane';
import {
    applyDiveMaterialState,
    createDiveMaterialState,
    DIVE_MATERIAL_MAPS,
    resolveDiveMaterial,
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

type DiveMaterialControlsOptions = {
    getModel: () => DiveMaterialModel | null | undefined;
    title?: string;
};

export function useDiveMaterialControls({
    getModel,
    title = 'Material',
}: DiveMaterialControlsOptions) {
    let pane: Pane | null = null;
    let material: DiveInspectableMaterial | null = null;
    let state: DiveMaterialState | null = null;
    const bindings = new Map<DiveMaterialMapKey, BindingSet>();

    function rebuildPane() {
        disposePane();

        material = resolveDiveMaterial(getModel());
        if (!material) return;

        state = createDiveMaterialState(material);
        applyDiveMaterialState(material, state);
        pane = new Pane({ title });

        DIVE_MATERIAL_MAPS.forEach((layer) => {
            if (!pane || !state) return;

            const folder = pane.addFolder({ title: layer.title });
            const control = state.controls[layer.key];
            const use = folder
                .addBinding(control, 'use', {
                    label: 'Use',
                    disabled: !state.sourceTextures[layer.key],
                })
                .on('change', applyAndRefresh);
            const only = folder
                .addBinding(control, 'only', {
                    label: 'Only',
                    disabled: !state.sourceTextures[layer.key],
                })
                .on('change', (event) => {
                    if (!state) return;

                    setOnlyMaterialMap(
                        state,
                        event.value ? layer.key : null,
                    );
                    applyAndRefresh();
                });
            const useAsDiffuse = folder
                .addBinding(control, 'useAsDiffuse', {
                    label: 'Use as diffuse',
                    disabled: true,
                })
                .on('change', (event) => {
                    if (!state) return;

                    setUseAsDiffuseMode(state, layer.key, event.value);
                    applyAndRefresh();
                });

            bindings.set(layer.key, { use, only, useAsDiffuse });
        });

        syncBindings();
        pane.refresh();
    }

    function disposePane() {
        pane?.dispose();
        pane = null;
        material = null;
        state = null;
        bindings.clear();
    }

    function resetMaterial() {
        if (!material || !state) return;

        resetDiveMaterialState(state);
        applyAndRefresh();
    }

    function applyAndRefresh() {
        if (!material || !state) return;

        applyDiveMaterialState(material, state);
        syncBindings();
        pane?.refresh();
    }

    function syncBindings() {
        if (!state) return;

        DIVE_MATERIAL_MAPS.forEach((layer) => {
            const layerBindings = bindings.get(layer.key);
            if (!layerBindings) return;

            const hasTexture = Boolean(state?.sourceTextures[layer.key]);

            layerBindings.use.disabled = !hasTexture;
            layerBindings.only.disabled = !hasTexture;
            layerBindings.useAsDiffuse.disabled = !hasTexture;
        });
    }

    return {
        rebuildPane,
        disposePane,
        resetMaterial,
    };
}
