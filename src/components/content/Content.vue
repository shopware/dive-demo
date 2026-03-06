<script setup lang="ts">
import { RouterView } from 'vue-router';
import { ref, onMounted, onUnmounted } from 'vue';
import CodeEditor from '@/components/codeeditor/CodeEditor.vue';

// toggle visibility of code panel
const showCode = ref(false);
// width of the code panel in px
const codeWidth = ref(600);
// dragging state
let startX = 0;
let startWidth = 0;
const codePane = ref<HTMLElement | null>(null);

// function to toggle code panel
function toggleCode() {
  showCode.value = !showCode.value;
}

// drag start
function onSplitterMouseDown(e: MouseEvent) {
  startX = e.clientX;
  startWidth = codePane.value?.offsetWidth ?? codeWidth.value;
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// dragging
function onMouseMove(e: MouseEvent) {
  const dx = startX - e.clientX;
  codeWidth.value = Math.max(100, startWidth + dx);
}

// drag end
function onMouseUp() {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
}

// mobile detection for modal
const isMobile = ref(window.innerWidth <= 768);
function onResize() {
  isMobile.value = window.innerWidth <= 768;
}
onMounted(() => window.addEventListener('resize', onResize));
onUnmounted(() => window.removeEventListener('resize', onResize));
</script>

<template>
  <div class="content">
    <RouterView class="router-view" />
    <div v-if="!isMobile" class="splitter" @mousedown="onSplitterMouseDown" :class="{ hidden: !showCode }" />
    <div v-if="!isMobile" ref="codePane" class="code-view"
      :style="{ width: showCode ? codeWidth + 'px' : '0px', flex: 'none' }">
      <CodeEditor language="typescript" theme="vs-dark" class="full-editor" />
    </div>
    <div v-if="isMobile && showCode" class="code-modal">
      <CodeEditor language="typescript" theme="vs-dark" class="full-editor" />
      <button class="close-modal" @click="toggleCode()">&times;</button>
    </div>
    <button class="code-button" @click="toggleCode()">&lt;/&gt;</button>
  </div>
</template>

<style scoped>
.content {
  position: relative;
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.router-view {
  flex: 1 1 auto;
  min-width: 0;
}

.code-view {
  overflow: hidden;
  transition: width 0.3s ease;
}

/* draggable splitter between panels */
.splitter {
  width: 4px;
  cursor: ew-resize;
  background-color: var(--ui-btn-border);
  height: 100%;
  z-index: 1;
  transition: opacity 0.3s ease;
  opacity: 1;
}

.splitter.hidden {
  opacity: 0;
  pointer-events: none;
}

.full-editor {
  width: 100%;
  height: 100%;
}

.code-button {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: var(--ui-active-bg);
  color: var(--ui-active-text);
  border-color: var(--ui-active-border);
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Modal overlay on mobile */
@media (max-width: 768px) {
  .code-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: var(--color-background);
    z-index: 1000;
    display: flex;
    flex-direction: column;
  }

  .code-modal .full-editor {
    flex: 1;
  }

  .close-modal {
    position: absolute;
    top: 16px;
    right: 16px;
    background: transparent;
    border: none;
    color: white;
    font-size: 2rem;
    cursor: pointer;
    z-index: 1001;
  }
}
</style>
