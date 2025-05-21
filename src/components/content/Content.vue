<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="content">
    <RouterView class="router-view" />
  </div>
</template>

<style scoped>
.content {
  flex: 1;
  overflow: auto;
}
</style>
