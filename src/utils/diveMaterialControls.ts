import type { Material, MeshStandardMaterial, Object3D, Texture } from 'three';

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
    return {
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

    material.needsUpdate = true;
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
