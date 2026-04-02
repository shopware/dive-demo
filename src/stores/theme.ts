import { ref, watch, computed } from 'vue';
import { defineStore } from 'pinia';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'dive-demo-theme';

export const useThemeStore = defineStore('theme', () => {
  const preference = ref<ThemePreference>(
    (localStorage.getItem(STORAGE_KEY) as ThemePreference) ?? 'system',
  );

  const systemDark = ref(
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  const isDark = computed(() =>
    preference.value === 'system' ? systemDark.value : preference.value === 'dark',
  );

  function setPreference(value: ThemePreference) {
    preference.value = value;
  }

  function apply() {
    document.documentElement.classList.toggle('dark', isDark.value);
  }

  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', (e) => {
    systemDark.value = e.matches;
  });

  watch(preference, (v) => {
    localStorage.setItem(STORAGE_KEY, v);
  });

  watch(isDark, () => apply(), { immediate: true });

  return { preference, isDark, setPreference };
});
