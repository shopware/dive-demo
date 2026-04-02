<script setup lang="ts">
import SidebarNavigation from './navigation/SidebarNavigation.vue';
import SidebarHeader from './header/SidebarHeader.vue';
import ThemeToggle from './theme/ThemeToggle.vue';
import { useThemeStore } from '@/stores/theme';

useThemeStore();
</script>

<template>
  <div class="sidebar">
    <SidebarHeader />
    <SidebarNavigation />
    <ThemeToggle />
  </div>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  line-height: 1.5;
}

@media (min-width: 1024px) {
  .sidebar {
    flex: 0 0 350px;
    height: 100%;
  }
}
</style>
