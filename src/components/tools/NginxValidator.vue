<script setup lang="ts">
import { ref } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { StreamLanguage } from '@codemirror/language'
import { nginx } from '@codemirror/legacy-modes/mode/nginx'
import { oneDark } from '@codemirror/theme-one-dark'
import { ElMessage } from 'element-plus'
import { VideoPlay, CopyDocument, Delete, DocumentChecked } from '@element-plus/icons-vue'

const code = ref('')
const validationResults = ref<{ line: number; message: string; type: 'error' | 'warning' }[]>([])

const extensions = [StreamLanguage.define(nginx), oneDark]

const exampleConfig = `user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log notice;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;

    include /etc/nginx/conf.d/*.conf;
    
    server {
        listen       80;
        server_name  localhost;

        location / {
            root   /usr/share/nginx/html;
            index  index.html index.htm;
        }

        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   /usr/share/nginx/html;
        }
    }
}
`

const loadExample = () => {
  code.value = exampleConfig
  validate()
}

const clear = () => {
  code.value = ''
  validationResults.value = []
}

const validate = () => {
  if (!code.value.trim()) {
    validationResults.value = []
    return
  }

  const lines = code.value.split('\n')
  const results: typeof validationResults.value = []
  let openBraces = 0
  
  lines.forEach((line, index) => {
    const trimmed = line.trim()
    const lineNum = index + 1
    
    // Ignore empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) return

    // 1. Brace Counting
    // We remove quoted strings to avoid counting braces inside strings
    const codeWithoutStrings = trimmed.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '')
    // Also remove comments that might be at the end of the line
    const codeClean = codeWithoutStrings.split('#')[0]!.trim()
    
    if (!codeClean) return

    const opens = (codeClean.match(/\{/g) || []).length
    const closes = (codeClean.match(/\}/g) || []).length
    
    openBraces += opens
    openBraces -= closes

    if (openBraces < 0) {
      results.push({
        line: lineNum,
        message: '发现多余的闭合花括号 "}"',
        type: 'error'
      })
      openBraces = 0 // Reset
    }

    // 2. Semicolon Check
    const lastChar = codeClean.slice(-1)
    if (!['{', '}', ';'].includes(lastChar)) {
       results.push({
         line: lineNum,
         message: '可能缺少分号 ";" 或花括号 "{" / "}" (若是多行指令请忽略)',
         type: 'warning'
       })
    }
  })

  if (openBraces > 0) {
    results.push({
      line: lines.length,
      message: `文件末尾缺少 ${openBraces} 个闭合花括号 "}"`,
      type: 'error'
    })
  }

  validationResults.value = results
  
  if (results.length === 0) {
    ElMessage.success('基本语法检查通过')
  } else {
    ElMessage.warning(`发现 ${results.length} 个潜在问题`)
  }
}

const copyResult = async () => {
    if (!code.value) return
    try {
        await navigator.clipboard.writeText(code.value)
        ElMessage.success('已复制配置内容')
    } catch (err) {
        ElMessage.error('复制失败')
    }
}
</script>

<template>
  <div class="h-full flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">Nginx 配置检查</h2>
        <el-tag size="small" type="success">Syntax Check</el-tag>
      </div>
      <div class="flex gap-2">
        <el-button @click="loadExample" :icon="DocumentChecked">加载示例</el-button>
        <el-button @click="clear" :icon="Delete">清空</el-button>
        <el-button type="primary" :icon="VideoPlay" @click="validate">立即检查</el-button>
        <el-button type="success" :icon="CopyDocument" @click="copyResult">复制配置</el-button>
      </div>
    </div>

    <div class="flex-1 flex gap-4 min-h-0">
      <!-- Editor -->
      <div class="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">nginx.conf</span>
        </div>
        <div class="flex-1 overflow-hidden relative">
          <codemirror
            v-model="code"
            placeholder="# 在此粘贴 nginx.conf 内容..."
            :style="{ height: '100%' }"
            :autofocus="true"
            :indent-with-tab="true"
            :tab-size="4"
            :extensions="extensions"
            @change="validate" 
          />
        </div>
      </div>

      <!-- Results -->
      <div class="w-80 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">检查结果</span>
        </div>
        <div class="flex-1 overflow-y-auto p-2">
          <div v-if="validationResults.length === 0 && code" class="flex flex-col items-center justify-center h-full text-green-500">
             <el-icon size="48" class="mb-2"><DocumentChecked /></el-icon>
             <p>语法结构看起来不错</p>
          </div>
          <div v-else-if="!code" class="flex flex-col items-center justify-center h-full text-gray-400">
             <p>请在左侧输入配置</p>
          </div>
          <div v-else class="space-y-2">
            <div 
              v-for="(item, index) in validationResults" 
              :key="index"
              class="p-3 rounded border text-sm"
              :class="item.type === 'error' ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300' : 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300'"
            >
              <div class="font-bold mb-1">Line {{ item.line }}</div>
              <div>{{ item.message }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.cm-editor) {
  height: 100%;
}
</style>
