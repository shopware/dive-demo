import { describe, expect, it } from 'vitest';
import { BoxGeometry, Mesh, MeshStandardMaterial, Object3D, Texture } from 'three';
import {
    applyDiveMaterialState,
    createDiveMaterialState,
    resolveDiveMaterial,
    resolveDiveMaterials,
    resetDiveMaterialState,
    setOnlyMaterialMap,
    setUseAsDiffuseMode,
    type DiveMaterialModel,
    type DiveInspectableMaterial,
} from './diveMaterialControls';

function createMaterial() {
    const material = new MeshStandardMaterial() as DiveInspectableMaterial;

    material.map = new Texture();
    material.normalMap = new Texture();
    material.roughnessMap = new Texture();
    material.metalnessMap = new Texture();
    material.alphaMap = new Texture();
    material.aoMap = new Texture();

    return material;
}

function createMaterialWithoutMaps() {
    return new MeshStandardMaterial() as DiveInspectableMaterial;
}

describe('diveMaterialControls', () => {
    it('resolves the current mesh material before a stale model material', () => {
        const staleMaterial = createMaterial();
        const currentMaterial = createMaterial();
        const model = new Object3D() as DiveMaterialModel;
        model.material = staleMaterial;
        model.add(new Mesh(new BoxGeometry(), currentMaterial));

        expect(resolveDiveMaterial(model)).toBe(currentMaterial);
    });

    it('resolves every unique mesh material in the model', () => {
        const firstMaterial = createMaterial();
        const secondMaterial = createMaterial();
        const materialWithoutMaps = createMaterialWithoutMaps();
        const model = new Object3D() as DiveMaterialModel;

        model.add(new Mesh(new BoxGeometry(), firstMaterial));
        model.add(
            new Mesh(new BoxGeometry(), [firstMaterial, secondMaterial]),
        );
        model.add(new Mesh(new BoxGeometry(), materialWithoutMaps));

        expect(resolveDiveMaterials(model)).toEqual([
            firstMaterial,
            secondMaterial,
        ]);
    });

    it('ignores stale fallback material when the current model has mesh materials without maps', () => {
        const staleMaterial = createMaterial();
        const materialWithoutMaps = createMaterialWithoutMaps();
        const model = new Object3D() as DiveMaterialModel;
        model.material = staleMaterial;
        model.add(new Mesh(new BoxGeometry(), materialWithoutMaps));

        expect(resolveDiveMaterials(model)).toEqual([]);
    });

    it('disables every other map when one map is used exclusively', () => {
        const material = createMaterial();
        const state = createDiveMaterialState(material);
        const originalNormalMap = material.normalMap;

        setOnlyMaterialMap(state, 'normalMap');
        applyDiveMaterialState(material, state);

        expect(material.map).toBeNull();
        expect(material.normalMap).toBe(originalNormalMap);
        expect(material.roughnessMap).toBeNull();
        expect(material.metalnessMap).toBeNull();
        expect(material.alphaMap).toBeNull();
        expect(material.aoMap).toBeNull();
    });

    it('uses any selected map as diffuse preview without only mode', () => {
        const material = createMaterial();
        const state = createDiveMaterialState(material);
        const originalNormalMap = material.normalMap;

        setUseAsDiffuseMode(state, 'normalMap', true);
        applyDiveMaterialState(material, state);

        expect(material.map).toBe(originalNormalMap);
        expect(material.normalMap).toBe(originalNormalMap);
    });

    it('keeps the diffuse replacement when exclusive mode is cleared', () => {
        const material = createMaterial();
        const state = createDiveMaterialState(material);
        const originalNormalMap = material.normalMap;

        setOnlyMaterialMap(state, 'normalMap');
        setUseAsDiffuseMode(state, 'normalMap', true);
        applyDiveMaterialState(material, state);

        setOnlyMaterialMap(state, null);
        applyDiveMaterialState(material, state);

        expect(material.map).toBe(originalNormalMap);
        expect(material.normalMap).toBe(state.sourceTextures.normalMap);
    });

    it('only allows one diffuse replacement at a time', () => {
        const material = createMaterial();
        const state = createDiveMaterialState(material);
        const originalRoughnessMap = material.roughnessMap;

        setUseAsDiffuseMode(state, 'normalMap', true);
        setUseAsDiffuseMode(state, 'roughnessMap', true);
        applyDiveMaterialState(material, state);

        expect(material.map).toBe(originalRoughnessMap);
        expect(state.controls.normalMap.useAsDiffuse).toBe(false);
        expect(state.controls.roughnessMap.useAsDiffuse).toBe(true);
    });

    it('applies the configured base color to the material', () => {
        const material = createMaterial();
        const state = createDiveMaterialState(material);

        state.baseColor = '#336699';
        applyDiveMaterialState(material, state);

        expect(material.color.getHexString()).toBe('336699');
    });

    it('resets preview state back to all original maps', () => {
        const material = createMaterial();
        material.color.setStyle('#884422');
        const state = createDiveMaterialState(material);
        const originalMap = material.map;

        state.baseColor = '#336699';
        state.controls.roughnessMap.use = false;
        setOnlyMaterialMap(state, 'normalMap');
        setUseAsDiffuseMode(state, 'normalMap', true);
        applyDiveMaterialState(material, state);

        resetDiveMaterialState(state);
        applyDiveMaterialState(material, state);

        expect(material.map).toBe(originalMap);
        expect(material.color.getHexString()).toBe('884422');
        expect(state.baseColor).toBe('#884422');
        expect(material.roughnessMap).toBe(state.sourceTextures.roughnessMap);
        expect(state.controls.normalMap.only).toBe(false);
        expect(state.controls.normalMap.useAsDiffuse).toBe(false);
    });
});
