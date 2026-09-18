import { watch } from 'vue';
import { storeToRefs } from 'pinia';
import {
    DIVEGridOnDarkColors,
    DIVEGridOnLightColors,
    type DIVEScene,
} from '@shopware-ag/dive';
import { useThemeStore } from '@/stores/theme';

const FLOOR_ON_DARK = '#000000';
const FLOOR_ON_LIGHT = '#ffffff';

type GridThemeOptions = {
    /**
     * Whether the scene shows a floor.
     *
     * The grid lies on it, so where there is one, the floor is the ground the
     * grid has to read against and the two have to be switched together.
     */
    withFloor?: boolean;
};

/**
 * Keeps a scene's grid readable against whatever the page theme puts behind it.
 *
 * DIVE cannot answer this itself: the canvas is transparent, so what the grid
 * is seen against is the page, and only the app knows what the page is doing.
 *
 * The scene arrives as a getter rather than as a value, because a view builds
 * its DIVE asynchronously -- the watcher has to find the scene at the moment
 * the theme changes, not at the moment this ran. The returned function is for
 * that first application, once the scene exists.
 */
export const useGridTheme = (
    getScene: () => DIVEScene | null | undefined,
    options: GridThemeOptions = {},
) => {
    const { isDark } = storeToRefs(useThemeStore());

    const applyGridTheme = () => {
        const scene = getScene();
        if (!scene) {
            return;
        }

        if (options.withFloor) {
            scene.root.floor.setColor(
                isDark.value ? FLOOR_ON_DARK : FLOOR_ON_LIGHT,
            );
        }

        scene.grid.applySettings(
            isDark.value ? DIVEGridOnDarkColors : DIVEGridOnLightColors,
        );
    };

    watch(isDark, applyGridTheme);

    return { applyGridTheme };
};
