import { describe, expect, it } from 'vitest';
import { BoxGeometry, Mesh, MeshStandardMaterial, Object3D, Texture } from 'three';
import {
    applyDiveMaterialState,
    createDiveMaterialState,
    resolveDiveMaterial,
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

describe('diveMaterialControls', () => {
    it('resolves the current mesh material before a stale model material', () => {
        const staleMaterial = createMaterial();
        const currentMaterial = createMaterial();
        const model = new Object3D() as DiveMaterialModel;
        model.material = staleMaterial;
        model.add(new Mesh(new BoxGeometry(), currentMaterial));

        expect(resolveDiveMaterial(model)).toBe(currentMaterial);
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

    it('resets preview state back to all original maps', () => {
        const material = createMaterial();
        const state = createDiveMaterialState(material);
        const originalMap = material.map;

        state.controls.roughnessMap.use = false;
        setOnlyMaterialMap(state, 'normalMap');
        setUseAsDiffuseMode(state, 'normalMap', true);
        applyDiveMaterialState(material, state);

        resetDiveMaterialState(state);
        applyDiveMaterialState(material, state);

        expect(material.map).toBe(originalMap);
        expect(material.roughnessMap).toBe(state.sourceTextures.roughnessMap);
        expect(state.controls.normalMap.only).toBe(false);
        expect(state.controls.normalMap.useAsDiffuse).toBe(false);
    });
});
