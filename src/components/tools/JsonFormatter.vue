<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.min.css'
import { jsonrepair } from 'jsonrepair'
import { ElMessage } from 'element-plus'
import { CopyDocument, Delete, Operation, Grid, Reading, Sort, MagicStick, Warning, Connection, Switch } from '@element-plus/icons-vue'

const container = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
let editor: JSONEditor | null = null

const initEditor = async () => {
  await nextTick()
  if (!container.value) {
    errorMessage.value = '容器元素未找到'
    return
  }

  // Ensure container has dimensions
  if (container.value.clientHeight === 0) {
      container.value.style.height = '600px'
  }

  const options = {
    // Start with 'text' mode as it is safer than 'code' (Ace Editor) which might fail due to worker issues
    mode: 'text' as any,
    modes: ['text', 'code', 'tree', 'form', 'view'] as any[],
    onError: (err: Error) => {
      console.warn('JSON Editor Error:', err)
      // Only show error if it's not a parse error during typing
      if (!err.toString().includes('JSON')) {
          ElMessage.error('编辑器错误: ' + err.message)
      }
    },
    onModeChange: (newMode: string, oldMode: string) => {
      console.log('Mode switched from', oldMode, 'to', newMode)
    },
    // Remove specific Ace theme to avoid loading issues, rely on CSS overrides
    // theme: 'ace/theme/tomorrow_night', 
    mainMenuBar: false,
    navigationBar: false,
    statusBar: true
  }

  try {
    editor = new JSONEditor(container.value, options)
    // Set initial content
    editor.setText('{\n  "message": "如果看不到内容，请尝试切换视图模式或刷新页面",\n  "status": "success"\n}')
    isLoading.value = false
    console.log('JSON Editor initialized successfully')
  } catch (e: any) {
    console.error('Failed to init JSON Editor:', e)
    errorMessage.value = '编辑器初始化失败: ' + (e.message || e)
    isLoading.value = false
  }
}

onMounted(() => {
  // Delay slightly to ensure DOM is fully ready
  setTimeout(initEditor, 200)
})

onUnmounted(() => {
  if (editor) {
    editor.destroy()
    editor = null
  }
})

// --- Actions ---

const getJsonText = (): string => {
  if (!editor) return ''
  try {
    return (editor as any).getText()
  } catch (e) {
    return ''
  }
}

// const setJsonText = (text: string) => {
//   if (!editor) return
//   editor.setText(text)
// }

const formatJson = () => {
  if (!editor) return
  try {
    (editor as any).format()
    ElMessage.success('格式化成功')
  } catch (e) {
    // If format fails, try repair
    try {
        const text = getJsonText()
        const repaired = jsonrepair(text)
        editor.setText(repaired);
        (editor as any).format()
        ElMessage.success('已修复并格式化')
    } catch (repairErr) {
        ElMessage.error('格式化失败：无效的 JSON')
    }
  }
}

const compressJson = () => {
  if (!editor) return
  try {
    (editor as any).compact()
    ElMessage.success('压缩成功')
  } catch (e) {
    ElMessage.error('压缩失败')
  }
}

const sortJson = () => {
  if (!editor) return
  try {
    const json = editor.get()
    const sorted = sortObject(json)
    editor.set(sorted)
    ElMessage.success('内容排序完成')
  } catch (e) {
    ElMessage.error('排序失败：请确保 JSON 格式正确')
  }
}

const sortObject = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) return obj
  if (Array.isArray(obj)) return obj.map(sortObject)
  return Object.keys(obj).sort().reduce((result: any, key) => {
    result[key] = sortObject(obj[key])
    return result
  }, {})
}

const repairJson = () => {
  if (!editor) return
  try {
    let text = getJsonText()
    
    // 1. Remove JSONP padding
    text = text.replace(/^\s*[\w\.]+\s*\(([\s\S]*)\)\s*;?\s*$/, '$1')
    
    // 2. Remove comments
    text = text.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1')

    // 3. Use jsonrepair
    const repaired = jsonrepair(text)
    
    // 4. Update editor
    editor.setText(repaired);
    (editor as any).format()
    ElMessage.success('修复成功')
  } catch (e) {
    console.error(e)
    ElMessage.error('修复失败：无法解析的内容')
  }
}

const escapeJson = () => {
  if (!editor) return
  try {
    // 尝试获取 JSON 对象
    const json = editor.get()
    // 将对象转为字符串，然后再转为转义后的字符串
    // 例如 {"a":1} -> "{\"a\":1}"
    const jsonString = JSON.stringify(json)
    editor.set(jsonString)
    ElMessage.success('转义成功')
  } catch (e) {
    // 如果获取 JSON 失败，尝试处理纯文本
    try {
      const text = getJsonText()
      // 将文本内容作为字符串进行转义
      const escaped = JSON.stringify(text)
      
      // 将转义后的字符串设置回编辑器
      // 这样非 JSON 文本也能被转义，例如: abc -> "abc", " -> "\""
      editor.set(escaped) 
      ElMessage.success('转义成功')
    } catch (err) {
      ElMessage.error('转义失败')
    }
  }
}

const unescapeJson = () => {
  if (!editor) return
  try {
    let text = getJsonText().trim()
    
    // 1. 尝试直接解析
    try {
      const parsed = JSON.parse(text)
      // 如果解析出来是字符串，说明原文本是带引号的转义字符串 "{\"a\":1}"
      if (typeof parsed === 'string') {
        try {
          // 再次解析该字符串
          const obj = JSON.parse(parsed)
          editor.set(obj)
          ElMessage.success('去转义成功')
          return
        } catch (e) {
          // 可能是普通字符串，不是JSON字符串
          editor.set(parsed)
          ElMessage.success('去转义成功 (纯文本)')
          return
        }
      } else {
        // 如果解析出来是对象，说明已经是正常JSON
        editor.set(parsed)
        ElMessage.success('内容已是有效 JSON')
        return
      }
    } catch (e) {
      // JSON.parse 失败
    }

    // 2. 尝试包裹引号后解析 (针对缺少外层引号的转义串 {\"a\":1})
    try {
      const wrapped = '"' + text + '"'
      const parsed = JSON.parse(wrapped)
      if (typeof parsed === 'string') {
          const obj = JSON.parse(parsed)
          editor.set(obj)
          ElMessage.success('去转义成功')
          return
      }
    } catch (e) {
       // 失败
    }

    // 3. 尝试手动去转义 (降级处理)
    // 仅处理简单的 \" -> "，避免破坏其他转义字符
    try {
      const unescaped = text.replace(/\\"/g, '"')
      const obj = JSON.parse(unescaped)
      editor.set(obj)
      ElMessage.success('去转义成功 (强制)')
    } catch (e) {
       ElMessage.error('去转义失败：无法解析的内容')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('去转义失败')
  }
}

const copyResult = async () => {
  if (!editor) return
  try {
    const text = getJsonText()
    await navigator.clipboard.writeText(text)
    ElMessage.success('复制成功')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

const clear = () => {
  if (!editor) return
  editor.set({})
  ElMessage.success('已清空')
}

const setMode = (mode: string) => {
  if (editor) {
    editor.setMode(mode as any)
  }
}

</script>

<template>
  <div class="h-full flex flex-col gap-4 text-[var(--text-primary)] relative">
    <!-- Toolbar -->
    <div class="flex gap-2 flex-wrap items-center bg-[var(--bg-secondary)] p-2 rounded-lg border border-[var(--border-color)] z-20 transition-colors duration-300">
      <el-tooltip content="格式化 JSON (Ctrl+I)" placement="top">
        <el-button type="primary" @click="formatJson" :icon="Operation" size="small">格式化</el-button>
      </el-tooltip>
      
      <el-tooltip content="压缩 JSON，去除空格 (Ctrl+Shift+I)" placement="top">
        <el-button type="primary" @click="compressJson" :icon="Operation" size="small">压缩</el-button>
      </el-tooltip>

      <el-tooltip content="按 Key 字母顺序排序" placement="top">
        <el-button type="primary" @click="sortJson" :icon="Sort" size="small">排序</el-button>
      </el-tooltip>

      <div class="w-px h-6 bg-[var(--border-color)] mx-2"></div>

      <el-tooltip content="修复 JSON：引号、转义、注释、JSONP 等" placement="top">
        <el-button type="warning" @click="repairJson" :icon="MagicStick" size="small">修复/净化</el-button>
      </el-tooltip>

      <div class="w-px h-6 bg-[var(--border-color)] mx-2"></div>

      <el-tooltip content="将 JSON 对象转义为字符串" placement="top">
        <el-button type="primary" plain @click="escapeJson" :icon="Connection" size="small">转义</el-button>
      </el-tooltip>

      <el-tooltip content="将转义字符串还原为 JSON 对象" placement="top">
        <el-button type="primary" plain @click="unescapeJson" :icon="Switch" size="small">去转义</el-button>
      </el-tooltip>

      <div class="w-px h-6 bg-[var(--border-color)] mx-2"></div>

      <el-button-group>
         <el-button @click="setMode('tree')" :icon="Grid" size="small">树形</el-button>
         <el-button @click="setMode('text')" :icon="Reading" size="small">文本</el-button>
         <el-button @click="setMode('code')" :icon="Reading" size="small">代码</el-button>
      </el-button-group>

       <div class="w-px h-6 bg-[var(--border-color)] mx-2"></div>

      <el-button type="success" @click="copyResult" :icon="CopyDocument" size="small">复制</el-button>
      <el-button type="danger" @click="clear" :icon="Delete" size="small">清空</el-button>
    </div>

    <!-- Error/Loading State -->
    <div v-if="isLoading || errorMessage" class="absolute inset-0 z-10 flex items-center justify-center bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] top-14">
        <div v-if="errorMessage" class="text-red-500 flex flex-col items-center gap-2">
            <el-icon :size="30"><Warning /></el-icon>
            <span>{{ errorMessage }}</span>
            <el-button type="primary" size="small" @click="initEditor" class="mt-2">重试</el-button>
        </div>
        <div v-else class="text-[var(--accent-color)] flex flex-col items-center gap-2">
            <span class="loading-spinner"></span>
            <span>编辑器加载中...</span>
        </div>
    </div>

    <!-- Editor Container -->
    <div 
        id="jsoneditor-container" 
        class="flex-1 min-h-[600px] border border-[var(--border-color)] rounded-lg overflow-hidden relative bg-[var(--input-bg)] transition-colors duration-300" 
        ref="container"
        :class="{ 'opacity-0': isLoading }"
    ></div>
  </div>
</template>

<style scoped>
.loading-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--border-color);
    border-radius: 50%;
    border-top-color: var(--accent-color);
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* JSONEditor Dark Theme Overrides */
:deep(.jsoneditor) {
  border: none;
  background-color: transparent;
}

:deep(.jsoneditor-menu) {
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

:deep(.jsoneditor-contextmenu .jsoneditor-menu) {
    background-color: var(--bg-tertiary);
}

:deep(.jsoneditor-poweredBy) {
  display: none;
}

:deep(div.jsoneditor-outer.has-main-menu-bar) {
    margin-top: 0 !important;
    padding-top: 0 !important;
}

/* Ensure text is visible in all modes */
:deep(.jsoneditor-text) {
    color: var(--input-text);
    background-color: var(--input-bg);
}

/* Tree Mode Styling */
:deep(.jsoneditor-tree) {
  background-color: var(--json-tree-bg);
  color: var(--json-tree-color);
}

:deep(.jsoneditor-field), :deep(.jsoneditor-value) {
  color: var(--json-tree-color);
}

:deep(.jsoneditor-string) {
  color: var(--json-string);
}

:deep(.jsoneditor-number) {
  color: var(--json-number);
}

:deep(.jsoneditor-boolean) {
  color: var(--json-boolean);
}

:deep(.jsoneditor-null) {
  color: var(--json-null);
}

:deep(.jsoneditor-object), :deep(.jsoneditor-array) {
  color: var(--json-tree-color);
}

:deep(.jsoneditor-contextmenu) {
    background-color: var(--json-menu-bg);
    border: 1px solid var(--json-menu-border);
}
:deep(.jsoneditor-contextmenu ul li button) {
    background-color: var(--json-menu-bg);
    color: var(--json-menu-color);
}
:deep(.jsoneditor-contextmenu ul li button:hover) {
    background-color: var(--json-selected-bg);
    color: var(--text-primary);
}
:deep(.jsoneditor-contextmenu ul li button.jsoneditor-selected) {
    background-color: var(--json-selected-bg);
    color: var(--text-primary);
}

/* Navigation Bar */
:deep(.jsoneditor-navigation-bar) {
    background-color: var(--json-menu-bg);
    border-bottom: 1px solid var(--json-menu-border);
    color: var(--json-menu-color);
}

/* Search Bar */
:deep(.jsoneditor-search) {
    background-color: var(--json-menu-bg);
}
:deep(.jsoneditor-search input) {
    background-color: var(--json-selected-bg);
    color: var(--text-primary);
    border: 1px solid var(--json-menu-border);
}

/* Status Bar */
:deep(.jsoneditor-statusbar) {
    background-color: var(--json-menu-bg);
    color: var(--json-menu-color);
    border-top: 1px solid var(--json-menu-border);
}

/* Ace Editor Overrides - if loaded */
:deep(.ace-jsoneditor) {
  background-color: var(--json-tree-bg);
  color: var(--json-tree-color);
}
:deep(.ace_gutter) {
  background-color: var(--json-menu-bg);
  color: var(--json-menu-color);
}
:deep(.ace_content) {
    background-color: var(--json-tree-bg);
}
</style>
