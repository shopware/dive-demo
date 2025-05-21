<script setup lang="ts">
import pkgjson from '../../../../node_modules/@shopware-ag/dive/package.json';

const diveVersion = pkgjson.version;
</script>

<template>
  <div class="logo-wrapper">
    <img alt="Dive logo" class="logo" src="@/assets/dive.svg" width="125" height="125" />
    <div class="info">
      <p class="info_title"> DIVE Demo</p>
      <p class="info_using"> using DIVE v{{ diveVersion }}</p>
    </div>
  </div>
</template>

<style scoped>
.logo-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-evenly;
  width: 100%;
}

.logo {
  display: block;
  text-align: center;
}

.info {
  display: flex;
  flex-direction: column;
  text-align: center;
}

.info_title {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
}

.info_using {
  font-size: 0.75rem;
  color: rgb(121, 121, 121);
}
</style>
