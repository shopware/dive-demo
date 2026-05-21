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
    material.emissiveMap = new Texture();

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
        expect(material.emissiveMap).toBeNull();
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

    it('uses the emissive map as a diffuse preview', () => {
        const material = createMaterial();
        const state = createDiveMaterialState(material);
        const originalEmissiveMap = material.emissiveMap;

        setUseAsDiffuseMode(state, 'emissiveMap', true);
        applyDiveMaterialState(material, state);

        expect(material.map).toBe(originalEmissiveMap);
        expect(material.emissiveMap).toBe(originalEmissiveMap);
    });

    it('does not remove every map when the exclusive map is disabled', () => {
        const material = createMaterial();
        const state = createDiveMaterialState(material);
        const originalMap = material.map;
        const originalNormalMap = material.normalMap;

        setOnlyMaterialMap(state, 'emissiveMap');
        state.controls.emissiveMap.use = false;
        applyDiveMaterialState(material, state);

        expect(material.map).toBe(originalMap);
        expect(material.normalMap).toBe(originalNormalMap);
        expect(material.emissiveMap).toBeNull();
    });

    it('does not use a disabled map as a diffuse preview', () => {
        const material = createMaterial();
        const state = createDiveMaterialState(material);
        const originalMap = material.map;

        setUseAsDiffuseMode(state, 'emissiveMap', true);
        state.controls.emissiveMap.use = false;
        applyDiveMaterialState(material, state);

        expect(material.map).toBe(originalMap);
        expect(material.emissiveMap).toBeNull();
    });

    it('applies the configured base color to the material', () => {
        const material = createMaterial();
        const state = createDiveMaterialState(material);

        state.baseColor = '#336699';
        applyDiveMaterialState(material, state);

        expect(material.color.getHexString()).toBe('336699');
    });

    it('applies configured base material values to the material', () => {
        const material = createMaterial();
        const state = createDiveMaterialState(material);

        state.roughness = 0.25;
        state.metalness = 0.75;
        state.alpha = 0.4;
        state.alphaTest = 0.1;
        state.normalScale = {
            x: 0.5,
            y: -0.75,
        };
        state.aoIntensity = 0.35;
        state.emissiveColor = '#445566';
        state.emissiveIntensity = 2.5;
        state.envMapIntensity = 1.5;
        applyDiveMaterialState(material, state);

        expect(material.roughness).toBe(0.25);
        expect(material.metalness).toBe(0.75);
        expect(material.opacity).toBe(0.4);
        expect(material.transparent).toBe(true);
        expect(material.alphaTest).toBe(0.1);
        expect(material.normalScale.x).toBe(0.5);
        expect(material.normalScale.y).toBe(-0.75);
        expect(material.aoMapIntensity).toBe(0.35);
        expect(material.emissive.getHexString()).toBe('445566');
        expect(material.emissiveIntensity).toBe(2.5);
        expect(material.envMapIntensity).toBe(1.5);
    });

    it('resets preview state back to all original maps', () => {
        const material = createMaterial();
        material.color.setStyle('#884422');
        material.roughness = 0.35;
        material.metalness = 0.65;
        material.opacity = 0.8;
        material.alphaTest = 0.2;
        material.normalScale.set(0.75, -0.5);
        material.aoMapIntensity = 0.45;
        material.emissive.setStyle('#223344');
        material.emissiveIntensity = 1.5;
        material.envMapIntensity = 0.7;
        const state = createDiveMaterialState(material);
        const originalMap = material.map;
        const originalEmissiveMap = material.emissiveMap;

        state.baseColor = '#336699';
        state.roughness = 0.9;
        state.metalness = 0.1;
        state.alpha = 0.3;
        state.alphaTest = 0.05;
        state.normalScale = {
            x: 1.25,
            y: 1.5,
        };
        state.aoIntensity = 0.9;
        state.emissiveColor = '#778899';
        state.emissiveIntensity = 3;
        state.envMapIntensity = 2;
        state.controls.roughnessMap.use = false;
        setOnlyMaterialMap(state, 'normalMap');
        setUseAsDiffuseMode(state, 'normalMap', true);
        applyDiveMaterialState(material, state);

        resetDiveMaterialState(state);
        applyDiveMaterialState(material, state);

        expect(material.map).toBe(originalMap);
        expect(material.color.getHexString()).toBe('884422');
        expect(state.baseColor).toBe('#884422');
        expect(material.roughness).toBe(0.35);
        expect(material.metalness).toBe(0.65);
        expect(material.opacity).toBe(0.8);
        expect(material.alphaTest).toBe(0.2);
        expect(material.normalScale.x).toBe(0.75);
        expect(material.normalScale.y).toBe(-0.5);
        expect(material.aoMapIntensity).toBe(0.45);
        expect(material.emissive.getHexString()).toBe('223344');
        expect(material.emissiveIntensity).toBe(1.5);
        expect(material.envMapIntensity).toBe(0.7);
        expect(material.roughnessMap).toBe(state.sourceTextures.roughnessMap);
        expect(material.emissiveMap).toBe(originalEmissiveMap);
        expect(state.controls.normalMap.only).toBe(false);
        expect(state.controls.normalMap.useAsDiffuse).toBe(false);
    });
});
