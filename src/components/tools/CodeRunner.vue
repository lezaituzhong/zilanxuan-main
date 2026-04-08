<script setup lang="ts">
import { ref, computed } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { java } from '@codemirror/lang-java'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'
import { useTheme } from '../../composables/useTheme'
import { VideoPlay, Loading, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const { isDark } = useTheme()

// Language Configuration
const languages = [
  { label: 'Java', value: 'java', ext: 'java', lang: java(), 
    template: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World from Java!");\n    }\n}' },
  { label: 'JavaScript', value: 'javascript', ext: 'js', lang: javascript(), 
    template: 'console.log("Hello World from JavaScript!");' },
  { label: 'Python', value: 'python', ext: 'py', lang: python(), 
    template: 'print("Hello World from Python!")' },
  { label: 'Go', value: 'go', ext: 'go', lang: null, // Go support requires adding lang-go if needed, using text for now or simple
    template: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello World from Go!")\n}' },
  { label: 'C++', value: 'cpp', ext: 'cpp', lang: null,
    template: '#include <iostream>\n\nint main() {\n    std::cout << "Hello World from C++!" << std::endl;\n    return 0;\n}' }
]

const currentLang = ref(languages[0]?.value || 'java')
const code = ref(languages[0]?.template || '')
const output = ref('')
const isRunning = ref(false)

// Computed extensions for CodeMirror
const extensions = computed(() => {
  const langConfig = languages.find(l => l.value === currentLang.value)
  const exts = []
  if (langConfig?.lang) {
    exts.push(langConfig.lang)
  }
  if (isDark.value) {
    exts.push(oneDark)
  }
  return exts
})

// Switch language handler
const handleLangChange = (val: string) => {
  const langConfig = languages.find(l => l.value === val)
  if (langConfig) {
    // Only reset code if it matches the previous template or is empty to avoid losing user work
    // Ideally, we could cache code per language, but for now simple switch
    code.value = langConfig.template
    output.value = ''
  }
}

// Execute Code
const runCode = async () => {
  if (!code.value.trim()) {
    ElMessage.warning('请输入代码')
    return
  }

  isRunning.value = true
  output.value = 'Running...'

  try {
    const langConfig = languages.find(l => l.value === currentLang.value)
    
    // Piston API payload
    const payload = {
      language: currentLang.value,
      version: '*',
      files: [
        {
          name: `Main.${langConfig?.ext || 'txt'}`,
          content: code.value
        }
      ]
    }

    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.run) {
      output.value = result.run.stdout + (result.run.stderr ? '\nError:\n' + result.run.stderr : '')
      if (result.run.signal) {
         output.value += `\nProcess killed by signal: ${result.run.signal}`
      }
    } else {
      output.value = 'No output returned'
    }

  } catch (error: any) {
    output.value = `Error: ${error.message}\n请检查网络连接或稍后重试。`
  } finally {
    isRunning.value = false
  }
}

const clearOutput = () => {
  output.value = ''
}
</script>

<template>
  <div class="h-full flex flex-col gap-4">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-4 p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] shadow-sm">
      <div class="flex items-center gap-4">
        <span class="text-[var(--text-primary)] font-bold">语言:</span>
        <el-select 
          v-model="currentLang" 
          placeholder="Select Language" 
          style="width: 150px"
          @change="handleLangChange"
        >
          <el-option
            v-for="item in languages"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
      
      <div class="flex items-center gap-2">
        <el-button @click="clearOutput" :icon="Delete" circle title="清空输出" />
        <el-button 
          type="primary" 
          @click="runCode" 
          :loading="isRunning"
          :icon="VideoPlay"
        >
          运行 (Run)
        </el-button>
      </div>
    </div>

    <!-- Main Editor Area -->
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
      <!-- Editor -->
      <div class="flex flex-col rounded-lg overflow-hidden border border-[var(--border-color)] shadow-sm bg-[var(--bg-primary)]">
        <div class="bg-[var(--bg-tertiary)] px-4 py-2 text-xs text-[var(--text-secondary)] border-b border-[var(--border-color)]">
          Source Code
        </div>
        <div class="flex-1 overflow-hidden relative">
           <codemirror
            v-model="code"
            placeholder="Write your code here..."
            :style="{ height: '100%', width: '100%', fontSize: '14px' }"
            :autofocus="true"
            :indent-with-tab="true"
            :tab-size="4"
            :extensions="extensions"
          />
        </div>
      </div>

      <!-- Output -->
      <div class="flex flex-col rounded-lg overflow-hidden border border-[var(--border-color)] shadow-sm bg-[#1e1e1e]">
        <div class="bg-[#2d2d2d] px-4 py-2 text-xs text-gray-400 border-b border-[#3d3d3d] flex justify-between items-center">
          <span>Console Output</span>
          <span v-if="isRunning" class="flex items-center gap-1 text-blue-400">
            <el-icon class="is-loading"><Loading /></el-icon> Running...
          </span>
        </div>
        <pre class="flex-1 p-4 font-mono text-sm text-gray-200 overflow-auto whitespace-pre-wrap">{{ output }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.cm-editor) {
  height: 100%;
}
:deep(.cm-scroller) {
  font-family: 'Fira Code', monospace;
}
</style>
