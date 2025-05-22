import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { resolve } from 'path'; // Import resolve
import fs from 'fs'; // Import fs
import { createRequire } from 'module';

// Helper to find the real path if a package is symlinked
function findLinkedPackagePath(packageName: string, projectRoot: string) {
  try {
    const packageNodeModulesPath = resolve(projectRoot, 'node_modules', packageName);
    if (fs.existsSync(packageNodeModulesPath)) {
      return fs.realpathSync(packageNodeModulesPath);
    }
  } catch (e) {
    // console.warn(`Error checking symlink for ${packageName}:`, e);
  }
  return null;
}

export default defineConfig(() => {
  const projectRoot = __dirname;
  const divePath = findLinkedPackagePath('@shopware-ag/dive', projectRoot);

  console.log(`Project Root: ${projectRoot}`);
  if (divePath) {
    console.log(`Found linked @shopware-ag/dive at: ${divePath}`);
  } else {
    console.log('@shopware-ag/dive is not linked or not found.');
  }

  const require = createRequire(import.meta.url);
  const monacoEditorPlugin = require('vite-plugin-monaco-editor').default;

  return {
    base: '/',
    plugins: [
      nodePolyfills(),
      vue(),
      monacoEditorPlugin({
        languageWorkers: ['editorWorkerService', 'typescript', 'css', 'html', 'json'],
      }),
    ],
    resolve: {
      // *** ESSENTIAL for npm link to work correctly ***
      preserveSymlinks: true,
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      fs: {
        // Allow serving files from the workspace root, node_modules
        // AND the actual directory of the linked package if found
        allow: [
          projectRoot,
          resolve(projectRoot, 'node_modules'),
          ...(divePath ? [divePath] : []), // Conditionally add linked path
        ],
      },
    },
    optimizeDeps: {
      // Might still be needed to prevent pre-bundling issues with linked deps
      exclude: ['@shopware-ag/dive']
    },
    build: {
      sourcemap: true,
    },

    assetsInclude: ['**/*.glb'],
  };
});

