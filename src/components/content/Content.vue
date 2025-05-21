<script setup lang="ts">
import { RouterView } from 'vue-router';
import { ref } from 'vue';
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
</script>

<template>
  <div class="content">
    <RouterView class="router-view" />
    <div class="splitter" @mousedown="onSplitterMouseDown" :class="{ hidden: !showCode }" />
    <div ref="codePane" class="code-view" :style="{ width: showCode ? codeWidth + 'px' : '0px', flex: 'none' }">
      <CodeEditor language="typescript" theme="vs-dark" class="full-editor" />
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
  background-color: #ddd;
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
  background-color: #8aceff;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
