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
  .sidebar {
    display: flex;
  }

  .sidebar img {
    display: flex;
  }

  .sidebar nav {
    display: block;
    position: static;
    width: 100%;
    background: none;
    box-shadow: none;
  }

  .sidebar nav a {
    display: block;
    width: 100%;
    box-sizing: border-box;
    padding: 0.75rem 1rem;
    border: none;
    border-top: 1px solid var(--color-border);
    text-align: left;
  }

  .sidebar nav a:first-of-type {
    border-top: none;
  }

  .sidebar nav a.router-link-exact-active {
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

.sidebar nav {
  display: none;
}

.sidebar nav.open {
  display: block;
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: white;
  z-index: 1000;
}

/* Full-width dropdown items */
.sidebar nav.open a {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 0.75rem 1rem;
  border: none;
  border-top: 1px solid var(--color-border);
  text-align: left;
}

/* Highlight the active entry */
.sidebar nav.open a.router-link-exact-active {
  background-color: #e0f2ff;
}

/* Desktop: hide burger button */
@media (min-width: 1024px) {
  .menu-button {
    display: none;
  }
}

/* Desktop layout: sidebar and content split */
@media (min-width: 1024px) {
  .app-container {
    display: flex;
    height: 100vh;
    width: 100%;
    overflow: hidden;
  }
  .sidebar {
    flex: 0 0 350px;
  }
  .content {
    flex: 1;
    overflow: auto;
  }
}
</style>
