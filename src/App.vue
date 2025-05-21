<script setup lang="ts">
import Sidebar from '@/components/sidebar/Sidebar.vue';
import Content from '@/components/content/Content.vue';
</script>

<template>
  <div class="app-container">
    <Sidebar />
    <Content />
  </div>
</template>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

@media (min-width: 1024px) {
  .app-container {
    flex-direction: row;

    width: 100%;
  }
}
</style>
