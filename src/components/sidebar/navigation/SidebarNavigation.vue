<script setup lang="ts">
import { ref } from 'vue';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { RouterLink } from 'vue-router';

const isMenuOpen = ref(false);
function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

const route = useRoute();
const menuItems = [
  { label: 'Home', to: '/' },
  { label: 'AR', to: '/ar' },
  { label: 'Material', to: '/material' },
  { label: 'Primitives', to: '/primitives' },
  { label: 'Groups', to: '/groups' },
  { label: 'Transform', to: '/transform' },
  { label: 'Asset Loader', to: '/asset-loader' },
  { label: 'Asset Exporter', to: '/asset-exporter' }
];
const currentItem = computed(() => menuItems.find(item => item.to === route.path) ?? menuItems[0]);

watch(route, () => {
  isMenuOpen.value = false;
});

</script>
<template>
    <div class="sidebar-navigation">
        <button class="menu-button" @click="toggleMenu">{{ currentItem.label }}</button>
        <nav :class="{ open: isMenuOpen }">
            <RouterLink
                v-for="item in menuItems"
                :key="item.to"
                :to="item.to"
                @click="toggleMenu">
                {{ item.label }}
            </RouterLink>
        </nav>
    </div>
</template>

<style scoped>

.sidebar-navigation {
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    line-height: 1.5;
    padding: 0 2rem 0 2rem;
}

.logo-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.logo {
  display: block;
  text-align: center;
  margin-right: 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

.info {
  display: flex;
  flex-direction: column;
  text-align: center;
  margin-right: 2rem;

  .info_title {
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0;
  }

  .info_using {
    font-size: 0.75rem;
    color: rgb(121, 121, 121)
  }
}

@media (min-width: 1024px) {
  .sidebar-navigation {
    display: flex;
  }

  .sidebar-navigation img {
    display: flex;
  }

  .sidebar-navigation nav {
    display: block;
    position: static;
    width: 100%;
    background: none;
    box-shadow: none;
  }

  .sidebar-navigation nav a {
    display: block;
    width: 100%;
    box-sizing: border-box;
    padding: 0.75rem 1rem;
    border: none;
    border-top: 1px solid var(--color-border);
    text-align: left;
  }

  .sidebar-navigation nav a:first-of-type {
    border-top: none;
  }

  .sidebar-navigation nav a.router-link-exact-active {
    background-color: #e0f2ff;
  }

  .logo {
    margin: 0;
  }

  .info {
    margin: 0;
  }
}

/* Mobile: hide nav and show burger button */
.menu-button {
  display: block;
  width: 100%;
  background: none;
  border: none;
  padding: 0.5rem;
  font-size: 1.5rem;
  cursor: pointer;
}

.sidebar-navigation nav {
  display: none;
}

.sidebar-navigation nav.open {
  display: block;
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: white;
  z-index: 1000;
}

/* Full-width dropdown items */
.sidebar-navigation nav.open a {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 0.75rem 1rem;
  border: none;
  border-top: 1px solid var(--color-border);
  text-align: left;
}

/* Highlight the active entry */
.sidebar-navigation nav.open a.router-link-exact-active {
  background-color: #e0f2ff;
}

/* Desktop: hide burger button */
@media (min-width: 1024px) {
  .menu-button {
    display: none;
  }
}

/* Desktop layout: sidebar-navigation and content split */
@media (min-width: 1024px) {
  .app-container {
    display: flex;
    height: 100vh;
    width: 100%;
    overflow: hidden;
  }
  .sidebar-navigation {
    flex: 0 0 350px;
  }
  .content {
    flex: 1;
    overflow: auto;
  }
}
</style>
