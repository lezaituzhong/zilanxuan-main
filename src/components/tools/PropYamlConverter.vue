<script setup lang="ts">
import { ref, watch } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { yaml as yamlLang } from '@codemirror/lang-yaml'
import { StreamLanguage } from '@codemirror/language'
import { properties } from '@codemirror/legacy-modes/mode/properties'
import jsyaml from 'js-yaml'
import { ElMessage } from 'element-plus'
import { Switch, CopyDocument, Refresh } from '@element-plus/icons-vue'

// --- State ---
const direction = ref<'props2yaml' | 'yaml2props'>('props2yaml')
const inputContent = ref('')
const outputContent = ref('')
const errorMsg = ref('')

// --- Extensions ---
const extensionsProps = [StreamLanguage.define(properties), oneDark]
const extensionsYaml = [yamlLang(), oneDark]

// --- Logic ---

// Flatten Object to Properties (Dot Notation)
const flattenObject = (obj: any, prefix = ''): string => {
  let result = ''
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key]
      const newKey = prefix ? `${prefix}.${key}` : key
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result += flattenObject(value, newKey)
      } else {
        // Handle value formatting
        let valStr = String(value)
        // If empty string, keep it empty
        // If null/undefined, maybe skip or empty? Spring allows empty values
        if (value === null || value === undefined) valStr = ''
        
        result += `${newKey}=${valStr}\n`
      }
    }
  }
  return result
}

// Expand Properties to Object
const expandProperties = (text: string): any => {
  const result: any = {}
  const lines = text.split(/\r?\n/)
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) continue
    
    // Split by first = or :
    const match = trimmed.match(/^([^=:]+)[=:](.*)$/)
    if (match) {
      const key = match[1]!.trim()
      const value = match[2]!.trim()
      
      // Set value in nested object
      const parts = key.split('.')
      let current = result
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]!
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {}
        }
        current = current[part]
      }
      const lastPart = parts[parts.length - 1]!
      
      // Try to infer type? Spring props are strings usually, but YAML supports types.
      // Let's keep as string for safety or try simple inference?
      // For YAML output, numbers/booleans are good.
      if (value === 'true') current[lastPart] = true
      else if (value === 'false') current[lastPart] = false
      else if (!isNaN(Number(value)) && value !== '') current[lastPart] = Number(value)
      else current[lastPart] = value
    }
  }
  return result
}

const convert = () => {
  errorMsg.value = ''
  if (!inputContent.value.trim()) {
    outputContent.value = ''
    return
  }

  try {
    if (direction.value === 'props2yaml') {
      const obj = expandProperties(inputContent.value)
      outputContent.value = jsyaml.dump(obj, { indent: 2, lineWidth: -1 })
    } else {
      const obj = jsyaml.load(inputContent.value)
      if (typeof obj === 'object' && obj !== null) {
        outputContent.value = flattenObject(obj)
      } else if (typeof obj === 'string') {
          // Maybe scalar?
          outputContent.value = String(obj)
      } else {
          outputContent.value = ''
      }
    }
  } catch (e: any) {
    errorMsg.value = e.message
    // Don't clear output on error, maybe? Or show error.
  }
}

const swap = () => {
  direction.value = direction.value === 'props2yaml' ? 'yaml2props' : 'props2yaml'
  inputContent.value = outputContent.value
  outputContent.value = ''
  convert()
}

const copyOutput = () => {
  if (outputContent.value) {
    navigator.clipboard.writeText(outputContent.value)
    ElMessage.success('已复制到剪贴板')
  }
}

// Watch input changes
watch(inputContent, () => {
  convert()
})

// Watch direction to trigger convert (if input preserved? No, swap handles it)
// But if user manually changes toggle without swap?
watch(direction, () => {
  convert()
})

// Initial example
inputContent.value = `server.port=8080
server.servlet.context-path=/api
spring.datasource.url=jdbc:mysql://localhost:3306/db
spring.datasource.username=root
spring.datasource.password=123456
logging.level.root=INFO
app.features.enabled=true
app.max-items=50`

convert()

</script>

<template>
  <div class="h-full flex flex-col gap-4 p-4">
    <!-- Header -->
    <div class="flex items-center justify-between bg-[var(--bg-secondary)] p-4 rounded-lg shadow-sm">
      <div class="flex items-center gap-4">
        <div class="font-bold text-[var(--text-primary)]">
          {{ direction === 'props2yaml' ? 'Properties' : 'YAML' }}
        </div>
        <el-button circle :icon="Switch" @click="swap" title="交换源与目标" />
        <div class="font-bold text-[var(--text-primary)]">
          {{ direction === 'props2yaml' ? 'YAML' : 'Properties' }}
        </div>
      </div>
      
      <div class="flex gap-2">
        <el-button type="primary" link :icon="CopyDocument" @click="copyOutput">复制结果</el-button>
        <el-button link :icon="Refresh" @click="convert">刷新</el-button>
      </div>
    </div>

    <!-- Error Msg -->
    <div v-if="errorMsg" class="bg-red-100 text-red-600 px-4 py-2 rounded text-sm dark:bg-red-900/30 dark:text-red-400">
      {{ errorMsg }}
    </div>

    <!-- Editors -->
    <div class="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
      <!-- Input -->
      <div class="flex-1 flex flex-col min-h-0 border border-[var(--border-color)] rounded overflow-hidden">
        <div class="bg-[var(--bg-tertiary)] px-3 py-1 text-xs text-[var(--text-secondary)] border-b border-[var(--border-color)]">
          输入 ({{ direction === 'props2yaml' ? 'Properties' : 'YAML' }})
        </div>
        <div class="flex-1 overflow-hidden relative">
          <codemirror
            v-model="inputContent"
            :extensions="direction === 'props2yaml' ? extensionsProps : extensionsYaml"
            :style="{ height: '100%' }"
            :autofocus="true"
            :indent-with-tab="true"
            :tab-size="2"
          />
        </div>
      </div>

      <!-- Output -->
      <div class="flex-1 flex flex-col min-h-0 border border-[var(--border-color)] rounded overflow-hidden">
        <div class="bg-[var(--bg-tertiary)] px-3 py-1 text-xs text-[var(--text-secondary)] border-b border-[var(--border-color)]">
          输出 ({{ direction === 'props2yaml' ? 'YAML' : 'Properties' }})
        </div>
        <div class="flex-1 overflow-hidden relative bg-[var(--bg-primary)]">
           <codemirror
            v-model="outputContent"
            :extensions="direction === 'props2yaml' ? extensionsYaml : extensionsProps"
            :style="{ height: '100%' }"
            :indent-with-tab="true"
            :tab-size="2"
            :disabled="false" 
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.cm-editor) {
  height: 100%;
}
:deep(.cm-scroller) {
  overflow: auto;
}
</style>