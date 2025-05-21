<script setup lang="ts">
import SidebarNavigation from './navigation/SidebarNavigation.vue';
import SidebarHeader from './header/SidebarHeader.vue';
</script>

<template>
  <div class="sidebar">
    <SidebarHeader />
    <SidebarNavigation />
  </div>
</template>

<style scoped>
.sidebar {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  line-height: 1.5;
}

@media (min-width: 1024px) {
  .sidebar {
    flex: 0 0 350px;
  }
}
</style>
