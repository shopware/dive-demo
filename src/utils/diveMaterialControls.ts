import type { Material, MeshStandardMaterial, Object3D, Texture } from 'three';

export type DiveMaterialNormalScale = {
    x: number;
    y: number;
};

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
    only: boolean;
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
    envMapIntensity: number;
    sourceEnvMapIntensity: number;
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
        envMapIntensity: material.envMapIntensity,
        sourceEnvMapIntensity: material.envMapIntensity,
        sourceTransparent: material.transparent,
        controls: createMapRecord(() => ({
            use: true,
            only: false,
            useAsDiffuse: false,
        })),
        sourceTextures: createMapRecord((key) => material[key] ?? null),
    };
}

export function getOnlyMaterialMap(state: DiveMaterialState) {
    return DIVE_MATERIAL_MAPS.find((layer) => state.controls[layer.key].only)
        ?.key ?? null;
}

export function getDiffuseMaterialMap(state: DiveMaterialState) {
    return DIVE_MATERIAL_MAPS.find(
        (layer) => state.controls[layer.key].useAsDiffuse,
    )?.key ?? null;
}

export function setOnlyMaterialMap(
    state: DiveMaterialState,
    selectedKey: DiveMaterialMapKey | null,
) {
    DIVE_MATERIAL_MAPS.forEach((layer) => {
        const control = state.controls[layer.key];
        control.only = layer.key === selectedKey;
    });
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
    state.envMapIntensity = state.sourceEnvMapIntensity;

    DIVE_MATERIAL_MAPS.forEach((layer) => {
        const control = state.controls[layer.key];
        control.use = true;
        control.only = false;
        control.useAsDiffuse = false;
    });
}

export function applyDiveMaterialState(
    material: DiveInspectableMaterial,
    state: DiveMaterialState,
) {
    const onlyKey = getOnlyMaterialMap(state);
    const diffuseOverrideKey = getDiffuseMaterialMap(state);

    material.color.setStyle(state.baseColor);
    material.roughness = state.roughness;
    material.metalness = state.metalness;
    material.opacity = state.alpha;
    material.alphaTest = state.alphaTest;
    material.normalScale.set(state.normalScale.x, state.normalScale.y);
    material.aoMapIntensity = state.aoIntensity;
    material.emissive.setStyle(state.emissiveColor);
    material.emissiveIntensity = state.emissiveIntensity;
    material.envMapIntensity = state.envMapIntensity;

    DIVE_MATERIAL_MAPS.forEach((layer) => {
        const control = state.controls[layer.key];
        const layerIsActive = !onlyKey || onlyKey === layer.key;
        material[layer.key] =
            control.use && layerIsActive
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
