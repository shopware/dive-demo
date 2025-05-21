<script setup lang="ts">
import { ref } from 'vue';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { RouterLink } from 'vue-router';

const isMenuOpen = ref(false);
function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

// Close mobile menu when any link is clicked (only on mobile)
function handleNavClick(event: MouseEvent) {
  if (window.innerWidth < 1024) {
    const link = (event.target as HTMLElement).closest('a');
    if (link) {
      isMenuOpen.value = false;
    }
  }
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
    <nav :class="{ open: isMenuOpen }" @click="handleNavClick">
      <RouterLink v-for="item in menuItems" :key="item.to" :to="item.to">
        {{ item.label }}
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
/* Base sidebar styles */
.sidebar-navigation {
  display: flex;
  position: relative;
  align-items: flex-start;
  flex-direction: column;
  line-height: 1.5;
  width: 100%;
}

/* Base nav styles */
nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
}

/* Nav link states */
nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: none;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

/* Mobile: menu button and dropdown */
.menu-button {
  display: block;
  width: 100%;
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  color: var(--color-text);
  background-color: #e0f2ff;
  text-align: left;
  line-height: 1.5;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
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

.sidebar-navigation nav.open a {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 0.75rem 1rem;
  border: none;
  border-top: 1px solid var(--color-border);
  text-align: left;
  font-size: 1rem;
}

.sidebar-navigation nav.open a.router-link-exact-active {
  background-color: #e0f2ff;
}

/* Desktop styles */
@media (min-width: 1024px) {

  /* Hide mobile menu button */
  .menu-button {
    display: none;
  }

  /* Sidebar layout */
  .sidebar-navigation {
    display: flex;
    flex: 1;
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
    font-size: 1rem;
  }

  .sidebar-navigation nav a:first-of-type {
    border-top: none;
  }

  .sidebar-navigation nav a.router-link-exact-active {
    background-color: #e0f2ff;
  }
}
</style>
