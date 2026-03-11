<script setup lang="ts">
import { useThemeStore, type ThemePreference } from '@/stores/theme';

const theme = useThemeStore();

const options: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];
</script>

<template>
  <div class="theme-toggle">
    <button v-for="opt in options" :key="opt.value" :class="{ active: theme.preference === opt.value }"
      :title="opt.value" @click="theme.setPreference(opt.value)">
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.theme-toggle {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  flex-shrink: 0;
  margin-top: auto;
  border-top: 1px solid var(--color-border);
}

.theme-toggle button {
  flex: 1;
  justify-content: center;
  font-size: 0.95rem;
  padding: 0.35rem 0;
}
</style>
