import type { Material, MeshStandardMaterial, Object3D, Texture } from 'three';

export type DiveMaterialNormalScale = {
    x: number;
    y: number;
};

const DISABLED_EMISSIVE_COLOR = '#000000';
const DISABLED_EMISSIVE_INTENSITY = 0;

export const DIVE_MATERIAL_MAPS = [
    {
        key: 'map',
        title: 'Diffuse / Albedo',
    },
    {
        key: 'normalMap',
        title: 'Normal',
    },
    {
        key: 'roughnessMap',
        title: 'Roughness',
    },
    {
        key: 'metalnessMap',
        title: 'Metalness',
    },
    {
        key: 'alphaMap',
        title: 'Alpha',
    },
    {
        key: 'aoMap',
        title: 'Ambient Occlusion',
    },
    {
        key: 'emissiveMap',
        title: 'Emissive',
    },
] as const;

export type DiveMaterialMapKey = (typeof DIVE_MATERIAL_MAPS)[number]['key'];

export type DiveInspectableMaterial = MeshStandardMaterial & {
    [Key in DiveMaterialMapKey]: Texture | null;
};

export type DiveMaterialModel = Object3D & {
    material?: DiveInspectableMaterial | null;
};

export type DiveMaterialMapControl = {
    use: boolean;
    useAsDiffuse: boolean;
};

export type DiveMaterialMapControls = Record<
    DiveMaterialMapKey,
    DiveMaterialMapControl
>;

export type DiveMaterialTextureStore = Record<DiveMaterialMapKey, Texture | null>;

export type DiveMaterialState = {
    baseColor: string;
    sourceBaseColor: string;
    roughness: number;
    sourceRoughness: number;
    metalness: number;
    sourceMetalness: number;
    alpha: number;
    sourceAlpha: number;
    alphaTest: number;
    sourceAlphaTest: number;
    normalScale: DiveMaterialNormalScale;
    sourceNormalScale: DiveMaterialNormalScale;
    aoIntensity: number;
    sourceAoIntensity: number;
    emissiveColor: string;
    sourceEmissiveColor: string;
    emissiveIntensity: number;
    sourceEmissiveIntensity: number;
    storedEmissiveColor: string;
    restoreEmissiveColorOnMapEnable: boolean;
    storedEmissiveIntensity: number;
    restoreEmissiveIntensityOnMapEnable: boolean;
    sourceTransparent: boolean;
    controls: DiveMaterialMapControls;
    sourceTextures: DiveMaterialTextureStore;
};

export function resolveDiveMaterial(
    model: DiveMaterialModel | null | undefined,
) {
    return resolveDiveMaterials(model)[0] ?? null;
}

export function resolveDiveMaterials(
    model: DiveMaterialModel | null | undefined,
) {
    if (!model) return [];

    const materials = findMeshMaterials(model);
    if (materials.length) return materials.filter(hasDiveMaterialMap);

    const fallbackMaterial = model.material ?? null;

    return fallbackMaterial &&
        isInspectableMaterial(fallbackMaterial) &&
        hasDiveMaterialMap(fallbackMaterial)
        ? [fallbackMaterial]
        : [];
}

export function createDiveMaterialState(
    material: DiveInspectableMaterial,
): DiveMaterialState {
    const baseColor = getMaterialBaseColor(material);
    const emissiveColor = getMaterialEmissiveColor(material);
    const normalScale = getMaterialNormalScale(material);

    return {
        baseColor,
        sourceBaseColor: baseColor,
        roughness: material.roughness,
        sourceRoughness: material.roughness,
        metalness: material.metalness,
        sourceMetalness: material.metalness,
        alpha: material.opacity,
        sourceAlpha: material.opacity,
        alphaTest: material.alphaTest,
        sourceAlphaTest: material.alphaTest,
        normalScale: { ...normalScale },
        sourceNormalScale: normalScale,
        aoIntensity: material.aoMapIntensity,
        sourceAoIntensity: material.aoMapIntensity,
        emissiveColor,
        sourceEmissiveColor: emissiveColor,
        emissiveIntensity: material.emissiveIntensity,
        sourceEmissiveIntensity: material.emissiveIntensity,
        storedEmissiveColor: emissiveColor,
        restoreEmissiveColorOnMapEnable: false,
        storedEmissiveIntensity: material.emissiveIntensity,
        restoreEmissiveIntensityOnMapEnable: false,
        sourceTransparent: material.transparent,
        controls: createMapRecord(() => ({
            use: true,
            useAsDiffuse: false,
        })),
        sourceTextures: createMapRecord((key) => material[key] ?? null),
    };
}

export function getDiffuseMaterialMap(state: DiveMaterialState) {
    return DIVE_MATERIAL_MAPS.find((layer) => {
        const control = state.controls[layer.key];

        return (
            control.useAsDiffuse &&
            control.use &&
            Boolean(state.sourceTextures[layer.key])
        );
    })?.key ?? null;
}

export function setUseAsDiffuseMode(
    state: DiveMaterialState,
    key: DiveMaterialMapKey,
    enabled: boolean,
) {
    DIVE_MATERIAL_MAPS.forEach((layer) => {
        state.controls[layer.key].useAsDiffuse =
            enabled && layer.key === key;
    });
}

export function setMaterialMapUse(
    state: DiveMaterialState,
    key: DiveMaterialMapKey,
    enabled: boolean,
) {
    const control = state.controls[key];

    control.use = enabled;

    if (!enabled) {
        control.useAsDiffuse = false;
    }

    if (key !== 'emissiveMap') return;

    if (enabled) {
        if (state.restoreEmissiveColorOnMapEnable || state.restoreEmissiveIntensityOnMapEnable) {
            state.emissiveColor = state.storedEmissiveColor;
            state.restoreEmissiveColorOnMapEnable = false;
            state.emissiveIntensity = state.storedEmissiveIntensity;
            state.restoreEmissiveIntensityOnMapEnable = false;
        }
        return;
    }

    if (!state.restoreEmissiveColorOnMapEnable && !state.restoreEmissiveIntensityOnMapEnable) {
        state.storedEmissiveColor = state.emissiveColor;
        state.restoreEmissiveColorOnMapEnable = true;
        state.storedEmissiveIntensity = state.emissiveIntensity;
        state.restoreEmissiveIntensityOnMapEnable = true;
    }

    state.emissiveColor = DISABLED_EMISSIVE_COLOR;
    state.emissiveIntensity = DISABLED_EMISSIVE_INTENSITY;
}

export function markEmissiveColorChangedManually(
    state: DiveMaterialState,
) {
    if (state.controls.emissiveMap.use) return;

    state.storedEmissiveColor = state.emissiveColor;
    state.restoreEmissiveColorOnMapEnable = false;
}

export function markEmissiveIntensityChangedManually(
    state: DiveMaterialState,
) {
    if (state.controls.emissiveMap.use) return;

    state.storedEmissiveIntensity = state.emissiveIntensity;
    state.restoreEmissiveIntensityOnMapEnable = false;
}

export function resetDiveMaterialState(state: DiveMaterialState) {
    state.baseColor = state.sourceBaseColor;
    state.roughness = state.sourceRoughness;
    state.metalness = state.sourceMetalness;
    state.alpha = state.sourceAlpha;
    state.alphaTest = state.sourceAlphaTest;
    state.normalScale = { ...state.sourceNormalScale };
    state.aoIntensity = state.sourceAoIntensity;
    state.emissiveColor = state.sourceEmissiveColor;
    state.emissiveIntensity = state.sourceEmissiveIntensity;
    state.storedEmissiveColor = state.sourceEmissiveColor;
    state.restoreEmissiveColorOnMapEnable = false;
    state.storedEmissiveIntensity = state.sourceEmissiveIntensity;
    state.restoreEmissiveIntensityOnMapEnable = false;

    DIVE_MATERIAL_MAPS.forEach((layer) => {
        const control = state.controls[layer.key];
        control.use = true;
        control.useAsDiffuse = false;
    });
}

export function applyDiveMaterialState(
    material: DiveInspectableMaterial,
    state: DiveMaterialState,
) {
    const diffuseOverrideKey = getDiffuseMaterialMap(state);

    material.color.setStyle(state.baseColor);
    material.roughness = state.roughness;
    material.metalness = state.metalness;
    material.opacity = state.alpha;
    material.alphaTest = state.alphaTest;
    material.normalScale.set(state.normalScale.x, state.normalScale.y);
    material.aoMapIntensity = state.aoIntensity;

    if (diffuseOverrideKey || state.restoreEmissiveColorOnMapEnable) {
        material.emissive.setStyle(DISABLED_EMISSIVE_COLOR);
        material.emissiveIntensity = DISABLED_EMISSIVE_INTENSITY;
    } else {
        material.emissive.setStyle(state.emissiveColor);
        material.emissiveIntensity = state.emissiveIntensity;
    }

    DIVE_MATERIAL_MAPS.forEach((layer) => {
        const control = state.controls[layer.key];
        const layerIsDiffusePreview = diffuseOverrideKey === layer.key;
        const layerIsMutedForDiffusePreview =
            Boolean(diffuseOverrideKey) &&
            (layerIsDiffusePreview || layer.key === 'emissiveMap');
        material[layer.key] =
            control.use && !layerIsMutedForDiffusePreview
                ? state.sourceTextures[layer.key]
                : null;
    });

    if (diffuseOverrideKey) {
        material.map = state.sourceTextures[diffuseOverrideKey];
    }

    material.transparent =
        state.sourceTransparent ||
        state.alpha < 1 ||
        Boolean(material.alphaMap);
    material.needsUpdate = true;
}

function getMaterialBaseColor(material: DiveInspectableMaterial) {
    return `#${material.color.getHexString()}`;
}

function getMaterialEmissiveColor(material: DiveInspectableMaterial) {
    return `#${material.emissive.getHexString()}`;
}

function getMaterialNormalScale(
    material: DiveInspectableMaterial,
): DiveMaterialNormalScale {
    return {
        x: material.normalScale.x,
        y: material.normalScale.y,
    };
}

function createMapRecord<Value>(
    factory: (key: DiveMaterialMapKey) => Value,
) {
    return DIVE_MATERIAL_MAPS.reduce(
        (record, layer) => {
            record[layer.key] = factory(layer.key);
            return record;
        },
        {} as Record<DiveMaterialMapKey, Value>,
    );
}

function findMeshMaterials(model: Object3D) {
    const materials: DiveInspectableMaterial[] = [];

    model.traverse((child) => {
        if (!isMaterialMesh(child)) return;

        const childMaterials = Array.isArray(child.material)
            ? child.material
            : [child.material];

        childMaterials.forEach((material) => {
            if (
                isInspectableMaterial(material) &&
                !materials.includes(material)
            ) {
                materials.push(material);
            }
        });
    });

    return materials;
}

function isMaterialMesh(
    object: Object3D,
): object is Object3D & { material?: Material | Material[] } {
    return 'isMesh' in object && object.isMesh === true;
}

function isInspectableMaterial(
    material: Material | undefined,
): material is DiveInspectableMaterial {
    if (!material) return false;

    return DIVE_MATERIAL_MAPS.every((layer) => layer.key in material);
}

function hasDiveMaterialMap(material: DiveInspectableMaterial) {
    return DIVE_MATERIAL_MAPS.some((layer) => Boolean(material[layer.key]));
}
