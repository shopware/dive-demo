<script setup lang="ts">
import { Chunk } from '@shopware-ag/dive/assetcache'
import { DracoLoader } from '@shopware-ag/dive/assetloader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

type DiagnosticMode = 'chunk' | 'parse' | 'both'
type DiagnosticState = 'idle' | 'running' | 'success' | 'error'
type DiagnosticEvent = {
  at: string
  stage: string
  details: Record<string, unknown>
}

const DEFAULT_URI = 'sofa_B.glb'
const DEFAULT_TIMEOUT_MS = 15000

const route = useRoute()

const diagnosticMode = computed<DiagnosticMode>(() => {
  const value = route.query.mode

  if (value === 'chunk' || value === 'parse' || value === 'both') {
    return value
  }

  return 'both'
})

const diagnosticUri = computed(() => {
  const value = route.query.uri
  return typeof value === 'string' && value.length > 0 ? value : DEFAULT_URI
})

const timeoutMs = computed(() => {
  const value = Number(route.query.timeoutMs)
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TIMEOUT_MS
})

const autoRun = computed(() => {
  const value = route.query.autorun
  return value !== '0' && value !== 'false'
})

const isRunning = ref(false)
const chunkState = ref<DiagnosticState>('idle')
const parseState = ref<DiagnosticState>('idle')
const chunkSummary = ref('')
const parseSummary = ref('')
const events = ref<DiagnosticEvent[]>([])
let activeRunId = 0

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const logEvent = (stage: string, details: Record<string, unknown> = {}) => {
  const event = {
    at: new Date().toISOString(),
    stage,
    details
  }

  events.value = [...events.value, event]
  console.info('[AssetLoaderDiagnostics]', stage, details)
}

const withTimeout = async <T>(
  promise: Promise<T>,
  label: string,
  timeout: number
): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    let settled = false

    const finish = (callback: (value: T | Error) => void, value: T | Error) => {
      if (settled) {
        return
      }

      settled = true
      window.clearTimeout(timeoutId)
      callback(value)
    }

    const timeoutId = window.setTimeout(() => {
      finish(reject as (value: T | Error) => void, new Error(`${label} timed out after ${timeout}ms`))
    }, timeout)

    promise.then(
      (value) => finish(resolve as (value: T | Error) => void, value),
      (error: unknown) =>
        finish(reject as (value: T | Error) => void, error instanceof Error ? error : new Error(String(error)))
    )
  })

const resetStates = () => {
  chunkState.value = 'idle'
  parseState.value = 'idle'
  chunkSummary.value = ''
  parseSummary.value = ''
  events.value = []
}

const runChunkDiagnostic = async (runId: number) => {
  chunkState.value = 'running'
  logEvent('chunk-start', {
    uri: diagnosticUri.value,
    timeoutMs: timeoutMs.value
  })

  try {
    const chunk = new Chunk(diagnosticUri.value)
    const arrayBuffer = await withTimeout(
      chunk.load(),
      `Chunk.load(${diagnosticUri.value})`,
      timeoutMs.value
    )

    if (runId !== activeRunId) {
      return
    }

    chunkState.value = 'success'
    chunkSummary.value = `${arrayBuffer.byteLength} bytes`
    logEvent('chunk-success', {
      uri: diagnosticUri.value,
      byteLength: arrayBuffer.byteLength
    })
  } catch (error) {
    if (runId !== activeRunId) {
      return
    }

    const message = toErrorMessage(error)
    chunkState.value = 'error'
    chunkSummary.value = message
    logEvent('chunk-error', {
      uri: diagnosticUri.value,
      error: message
    })
  }
}

const loadArrayBufferForParse = async (): Promise<ArrayBuffer> => {
  logEvent('parse-fetch-start', {
    uri: diagnosticUri.value,
    timeoutMs: timeoutMs.value
  })

  const response = await withTimeout(
    fetch(diagnosticUri.value),
    `fetch(${diagnosticUri.value})`,
    timeoutMs.value
  )

  logEvent('parse-fetch-resolved', {
    uri: diagnosticUri.value,
    status: response.status,
    ok: response.ok
  })

  if (!response.ok) {
    throw new Error(`fetch(${diagnosticUri.value}) failed with status ${response.status}`)
  }

  logEvent('parse-array-buffer-start', {
    uri: diagnosticUri.value,
    timeoutMs: timeoutMs.value
  })

  const arrayBuffer = await withTimeout(
    response.arrayBuffer(),
    `response.arrayBuffer(${diagnosticUri.value})`,
    timeoutMs.value
  )

  logEvent('parse-array-buffer-resolved', {
    uri: diagnosticUri.value,
    byteLength: arrayBuffer.byteLength
  })

  return arrayBuffer
}

const runParseDiagnostic = async (runId: number) => {
  parseState.value = 'running'
  logEvent('parse-start', {
    uri: diagnosticUri.value,
    timeoutMs: timeoutMs.value
  })

  const dracoLoader = new DracoLoader()
  dracoLoader.setDecoderConfig({ type: 'wasm' })

  const gltfLoader = new GLTFLoader()
  gltfLoader.setDRACOLoader(dracoLoader)

  try {
    const arrayBuffer = await loadArrayBufferForParse()
    const gltf = await withTimeout(
      gltfLoader.parseAsync(arrayBuffer, ''),
      `GLTFLoader.parseAsync(${diagnosticUri.value})`,
      timeoutMs.value
    )

    if (runId !== activeRunId) {
      return
    }

    const childCount = Array.isArray(gltf.scene.children) ? gltf.scene.children.length : 0
    const animationCount = Array.isArray(gltf.animations) ? gltf.animations.length : 0

    parseState.value = 'success'
    parseSummary.value = `${childCount} children, ${animationCount} animations`
    logEvent('parse-success', {
      uri: diagnosticUri.value,
      childCount,
      animationCount
    })
  } catch (error) {
    if (runId !== activeRunId) {
      return
    }

    const message = toErrorMessage(error)
    parseState.value = 'error'
    parseSummary.value = message
    logEvent('parse-error', {
      uri: diagnosticUri.value,
      error: message
    })
  } finally {
    dracoLoader.dispose()
  }
}

const runDiagnostics = async () => {
  const runId = activeRunId + 1
  activeRunId = runId
  resetStates()
  isRunning.value = true

  logEvent('run-start', {
    mode: diagnosticMode.value,
    uri: diagnosticUri.value,
    timeoutMs: timeoutMs.value
  })

  if (diagnosticMode.value === 'chunk' || diagnosticMode.value === 'both') {
    await runChunkDiagnostic(runId)
  }

  if (runId !== activeRunId) {
    return
  }

  if (diagnosticMode.value === 'parse' || diagnosticMode.value === 'both') {
    await runParseDiagnostic(runId)
  }

  if (runId !== activeRunId) {
    return
  }

  isRunning.value = false
  logEvent('run-complete', {
    chunkState: chunkState.value,
    parseState: parseState.value
  })
}

onMounted(() => {
  if (autoRun.value) {
    void runDiagnostics()
  }
})

watch(
  () => route.fullPath,
  () => {
    if (autoRun.value) {
      void runDiagnostics()
    }
  }
)
</script>

<template>
  <section class="page" data-testid="asset-loader-diagnostics-page">
    <header class="header">
      <div>
        <h1>Asset Loader Diagnostics</h1>
        <p>
          Isoliert <code>Chunk.load()</code> und <code>GLTFLoader.parseAsync()</code>
          im selben Browser-Kontext wie die Demo.
        </p>
      </div>
      <button
        data-testid="asset-loader-diagnostics-run"
        :disabled="isRunning"
        @click="runDiagnostics"
      >
        {{ isRunning ? 'Running...' : 'Run diagnostics' }}
      </button>
    </header>

    <dl class="meta">
      <div>
        <dt>Mode</dt>
        <dd data-testid="asset-loader-diagnostics-mode">{{ diagnosticMode }}</dd>
      </div>
      <div>
        <dt>URI</dt>
        <dd data-testid="asset-loader-diagnostics-uri">{{ diagnosticUri }}</dd>
      </div>
      <div>
        <dt>Timeout</dt>
        <dd data-testid="asset-loader-diagnostics-timeout">{{ timeoutMs }}ms</dd>
      </div>
    </dl>

    <div class="cards">
      <article class="card">
        <h2>Chunk</h2>
        <p
          class="state"
          :data-state="chunkState"
          data-testid="asset-loader-diagnostics-chunk-state"
        >
          {{ chunkState }}
        </p>
        <pre data-testid="asset-loader-diagnostics-chunk-summary">{{ chunkSummary || 'n/a' }}</pre>
      </article>

      <article class="card">
        <h2>Parse</h2>
        <p
          class="state"
          :data-state="parseState"
          data-testid="asset-loader-diagnostics-parse-state"
        >
          {{ parseState }}
        </p>
        <pre data-testid="asset-loader-diagnostics-parse-summary">{{ parseSummary || 'n/a' }}</pre>
      </article>
    </div>

    <section class="logSection">
      <h2>Event log</h2>
      <pre data-testid="asset-loader-diagnostics-log">{{ JSON.stringify(events, null, 2) }}</pre>
    </section>
  </section>
</template>

<style scoped lang="scss">
.page {
  box-sizing: border-box;
  min-height: 100%;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.header h1 {
  margin: 0 0 0.5rem;
}

.header p {
  margin: 0;
}

.meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 1rem;
  margin: 0;
}

.meta div,
.card,
.logSection {
  border: 1px solid var(--color-border);
  padding: 1rem;
  background: var(--color-background-soft);
}

.meta dt {
  font-weight: 600;
}

.meta dd {
  margin: 0.25rem 0 0;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1rem;
}

.card h2,
.logSection h2 {
  margin-top: 0;
}

.state {
  text-transform: uppercase;
  font-weight: 700;
}

.state[data-state='success'] {
  color: #0a7a29;
}

.state[data-state='error'] {
  color: #b42318;
}

.state[data-state='running'] {
  color: #155eef;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

button {
  white-space: nowrap;
}
</style>
