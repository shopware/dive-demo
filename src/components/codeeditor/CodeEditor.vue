<template>
    <div class="code-editor-wrapper">
        <MonacoEditor v-model:value="currentCode" :language="language" :theme="theme" :options="options"
            class="monaco-wrapper" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import router from '@/router';
import MonacoEditor from 'monaco-editor-vue3';

interface Props {
    language?: string;
    theme?: string;
    options?: Record<string, unknown>;
}

const props = defineProps<Props>();

// current code content loaded based on route
const currentCode = ref('');
// get the current route for loading the correct view file
const route = useRoute();

// editor settings
const language = props.language || 'vue';
const theme = props.theme || 'vs-dark';
const options = {
    minimap: { enabled: false },
    automaticLayout: true,
    readOnly: true,
    ...(props.options ?? {})
};

// import all view source files as raw text
const viewFiles = import.meta.glob<boolean, string, string>('/src/views/*.vue', { query: '?raw', import: 'default' });

// watch for route changes and load the matching file using router lookup
watch(() => route.name, async (name) => {
    const record = router.getRoutes().find(r => r.name === name);
    if (!record || !record.components) {
        currentCode.value = '';
        return;
    }
    let fileName = '';
    // dynamic (lazy-loaded) component: parse path from import()
    if (typeof record.components.default === 'function') {
        const fnStr = record.components.default.toString();
        const match = fnStr.match(/import\(['"].*?\/([^/]+\.vue)['"]\)/);
        if (match) fileName = match[1];
    }
    // default component: use __name metadata
    else if ((record.components.default as any).__name) {
        const compFile = (record.components.default as any).__name as string;
        const parts = compFile.split('/');
        fileName = parts[parts.length - 1];
    }
    if (fileName) {
        const key = `/src/views/${fileName}.vue`;
        if (key in viewFiles) {
            currentCode.value = await viewFiles[key]();
            return;
        }
    }
    currentCode.value = '';
}, { immediate: true });
</script>

<style scoped>
.monaco-wrapper {
    width: 100%;
    height: 100%;
}

.code-editor-wrapper {
    height: 100%;
}
</style>