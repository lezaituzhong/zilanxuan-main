<script setup lang="ts">
import { ref, computed, shallowRef } from 'vue'
import { marked } from 'marked'
import { Codemirror } from 'vue-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { 
  EditPen, View, Download, Delete, 
  Operation, Link as LinkIcon, Picture 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import 'github-markdown-css/github-markdown.css'

// State
const code = ref(`# Hello Markdown

Welcome to the **Markdown Editor**.

## Features
- Real-time preview
- Syntax highlighting
- Toolbar shortcuts
- GitHub style rendering

\`\`\`javascript
console.log('Hello World');
\`\`\`

> Start editing to see magic happen!
`)

const view = shallowRef<EditorView>()

// Computed
const extensions = [markdown(), oneDark, EditorView.lineWrapping]

const htmlContent = computed(() => {
  return marked(code.value)
})

// Methods
const handleReady = (payload: { view: EditorView }) => {
  view.value = payload.view
}

const insertText = (before: string, after: string = '') => {
  if (!view.value) return
  
  const state = view.value.state
  const selection = state.selection.main
  const selectedText = state.sliceDoc(selection.from, selection.to)
  
  const textToInsert = before + selectedText + after
  
  view.value.dispatch({
    changes: {
      from: selection.from,
      to: selection.to,
      insert: textToInsert
    },
    selection: {
      anchor: selection.from + before.length,
      head: selection.from + before.length + selectedText.length
    }
  })
  
  view.value.focus()
}

// Toolbar Actions
const actions = {
  bold: () => insertText('**', '**'),
  italic: () => insertText('*', '*'),
  h1: () => insertText('# '),
  h2: () => insertText('## '),
  h3: () => insertText('### '),
  quote: () => insertText('> '),
  code: () => insertText('`', '`'),
  codeBlock: () => insertText('```\n', '\n```'),
  link: () => insertText('[', '](url)'),
  image: () => insertText('![alt](', ')'),
  ul: () => insertText('- '),
  ol: () => insertText('1. '),
  task: () => insertText('- [ ] '),
}

const clear = () => {
  code.value = ''
}

const downloadMd = () => {
  const blob = new Blob([code.value], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'document.md'
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('下载开始')
}

const copyHtml = async () => {
  try {
    await navigator.clipboard.writeText(htmlContent.value as string)
    ElMessage.success('HTML 已复制')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

</script>

<template>
  <div class="h-full flex flex-col gap-4 text-[var(--text-primary)]">
    <!-- Toolbar -->
    <div class="flex gap-2 flex-wrap items-center bg-[var(--bg-secondary)] p-2 rounded-lg border border-[var(--border-color)] z-20">
      <div class="flex gap-1">
        <el-tooltip content="Bold" placement="top">
          <button class="tool-btn font-bold" @click="actions.bold">B</button>
        </el-tooltip>
        <el-tooltip content="Italic" placement="top">
          <button class="tool-btn italic" @click="actions.italic">I</button>
        </el-tooltip>
        <el-tooltip content="Strike" placement="top">
          <button class="tool-btn line-through" @click="() => insertText('~~', '~~')">S</button>
        </el-tooltip>
      </div>

      <div class="w-px h-6 bg-[var(--border-color)] mx-1"></div>

      <div class="flex gap-1">
        <el-tooltip content="H1" placement="top">
          <button class="tool-btn font-bold" @click="actions.h1">H1</button>
        </el-tooltip>
        <el-tooltip content="H2" placement="top">
          <button class="tool-btn font-bold" @click="actions.h2">H2</button>
        </el-tooltip>
        <el-tooltip content="H3" placement="top">
          <button class="tool-btn font-bold" @click="actions.h3">H3</button>
        </el-tooltip>
      </div>

      <div class="w-px h-6 bg-[var(--border-color)] mx-1"></div>

      <div class="flex gap-1">
        <el-tooltip content="List" placement="top">
          <button class="tool-btn" @click="actions.ul">•</button>
        </el-tooltip>
        <el-tooltip content="Ordered List" placement="top">
          <button class="tool-btn" @click="actions.ol">1.</button>
        </el-tooltip>
        <el-tooltip content="Task List" placement="top">
          <button class="tool-btn" @click="actions.task">☑</button>
        </el-tooltip>
        <el-tooltip content="Quote" placement="top">
          <button class="tool-btn font-serif text-lg" @click="actions.quote">”</button>
        </el-tooltip>
      </div>

      <div class="w-px h-6 bg-[var(--border-color)] mx-1"></div>

      <div class="flex gap-1">
        <el-tooltip content="Code" placement="top">
          <button class="tool-btn font-mono" @click="actions.code">&lt;/&gt;</button>
        </el-tooltip>
        <el-tooltip content="Code Block" placement="top">
          <button class="tool-btn font-mono" @click="actions.codeBlock">```</button>
        </el-tooltip>
        <el-tooltip content="Link" placement="top">
          <button class="tool-btn" @click="actions.link">
            <el-icon><LinkIcon /></el-icon>
          </button>
        </el-tooltip>
        <el-tooltip content="Image" placement="top">
          <button class="tool-btn" @click="actions.image">
            <el-icon><Picture /></el-icon>
          </button>
        </el-tooltip>
      </div>

      <div class="flex-1"></div>

      <el-tooltip content="Copy HTML" placement="top">
        <el-button type="primary" plain @click="copyHtml" :icon="Operation" size="small">HTML</el-button>
      </el-tooltip>

      <el-tooltip content="Download .md" placement="top">
        <el-button type="success" plain @click="downloadMd" :icon="Download" size="small">下载</el-button>
      </el-tooltip>
      
      <el-tooltip content="Clear" placement="top">
        <el-button type="danger" plain @click="clear" :icon="Delete" size="small">清空</el-button>
      </el-tooltip>
    </div>

    <!-- Editor & Preview -->
    <div class="flex-1 flex gap-4 min-h-0">
      <!-- Editor -->
      <div class="w-1/2 h-full rounded-lg overflow-hidden border border-[var(--border-color)] flex flex-col">
        <div class="bg-[var(--bg-tertiary)] px-4 py-2 text-sm font-bold border-b border-[var(--border-color)] flex justify-between items-center">
          <span>Editor</span>
          <el-icon><EditPen /></el-icon>
        </div>
        <div class="flex-1 overflow-hidden">
          <Codemirror
            v-model="code"
            placeholder="Write markdown here..."
            :style="{ height: '100%' }"
            :autofocus="true"
            :indent-with-tab="true"
            :tab-size="2"
            :extensions="extensions"
            @ready="handleReady"
          />
        </div>
      </div>

      <!-- Preview -->
      <div class="w-1/2 h-full rounded-lg overflow-hidden border border-[var(--border-color)] flex flex-col bg-white dark:bg-[#0d1117]">
        <div class="bg-gray-100 dark:bg-[#161b22] px-4 py-2 text-sm font-bold border-b border-[var(--border-color)] text-gray-700 dark:text-gray-200 flex justify-between items-center">
          <span>Preview</span>
          <el-icon><View /></el-icon>
        </div>
        <div class="flex-1 overflow-auto p-8 custom-scrollbar">
           <div class="markdown-body" v-html="htmlContent"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--text-primary);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

/* Custom Scrollbar for Preview */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #475569;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Markdown Body Overrides for Dark Mode Compatibility */
.markdown-body {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 980px;
  margin: 0 auto;
  padding: 0;
  background-color: transparent !important; 
}

/* In dark mode, github-markdown-css needs help if not using the .markdown-body-dark class correctly or if we want auto-switching */
@media (prefers-color-scheme: dark) {
  .markdown-body {
    color-scheme: dark;
    /* We can force dark theme variables if needed, but github-markdown-css usually handles it via media query */
  }
}

/* Explicit Dark Mode Support (if app has .dark class) */
:global(.dark) .markdown-body {
  color: #c9d1d9;
}
:global(.dark) .markdown-body a {
  color: #58a6ff;
}
:global(.dark) .markdown-body h1,
:global(.dark) .markdown-body h2, 
:global(.dark) .markdown-body h3, 
:global(.dark) .markdown-body h4, 
:global(.dark) .markdown-body h5, 
:global(.dark) .markdown-body h6 {
  color: #c9d1d9;
  border-bottom-color: #21262d;
}
:global(.dark) .markdown-body blockquote {
  color: #8b949e;
  border-left-color: #30363d;
}
:global(.dark) .markdown-body table tr {
  background-color: #0d1117;
  border-color: #30363d;
}
:global(.dark) .markdown-body table tr:nth-child(2n) {
  background-color: #161b22;
}
:global(.dark) .markdown-body code {
    background-color: rgba(110,118,129,0.4);
}
:global(.dark) .markdown-body pre {
    background-color: #161b22;
}
</style>