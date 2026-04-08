<script setup lang="ts">
import { ref } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import { ElMessage } from 'element-plus'
import { CopyDocument, Refresh, Document } from '@element-plus/icons-vue'
import Mock from 'mockjs'

const template = ref(`{
  "code": 0,
  "msg": "success",
  "data": {
    "list|5-10": [{
      "id|+1": 1,
      "name": "@cname",
      "age|18-60": 1,
      "gender|1": ["男", "女"],
      "email": "@email",
      "phone": /^1[3-9]\\d{9}$/,
      "address": "@city(true)",
      "avatar": "@image('100x100', '#50B347', '#FFF', 'Mock.js')"
    }],
    "total": 100
  }
}`)

const generatedData = ref('')
const errorMsg = ref('')

const extensions = [json(), oneDark]

const generate = () => {
  try {
    errorMsg.value = ''
    // 使用 new Function 来解析模板字符串，允许使用正则等非标准 JSON 语法
    // 但为了安全起见，我们还是先尝试 JSON.parse，如果包含正则等特殊对象，需要特殊处理
    // Mock.js 的模板通常是 JS 对象，不是严格的 JSON
    // 这里我们允许用户输入 JS 对象字面量格式
    let tplObj
    try {
      // 尝试作为标准 JSON 解析
      tplObj = JSON.parse(template.value)
    } catch (e) {
      // 如果不是 JSON，尝试作为 JS 对象解析 (eval 的替代方案，new Function)
      // 注意：这里为了支持 Mock.js 的完整语法（如正则），必须允许 JS 代码
      // 在生产环境中这可能有安全风险，但作为开发者工具是可接受的
      const fn = new Function('return ' + template.value)
      tplObj = fn()
    }

    const data = Mock.mock(tplObj)
    generatedData.value = JSON.stringify(data, null, 2)
  } catch (e: any) {
    errorMsg.value = e.message
    ElMessage.error('生成失败: ' + e.message)
  }
}

const copyResult = async () => {
  if (!generatedData.value) return
  try {
    await navigator.clipboard.writeText(generatedData.value)
    ElMessage.success('已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败')
  }
}

const applyExample = (type: string) => {
  if (type === 'user') {
    template.value = `{
  "id": "@guid",
  "name": "@cname",
  "title": "@ctitle",
  "content": "@cparagraph",
  "created_at": "@datetime",
  "ip": "@ip",
  "url": "@url"
}`
  } else if (type === 'list') {
    template.value = `{
  "list|5": [{
    "id|+1": 1,
    "username": "@word(5)",
    "price|10-100.2": 1,
    "status|1": true,
    "tags": ["@cword(2)", "@cword(2)"]
  }]
}`
  } else if (type === 'api') {
    template.value = `{
  "code": 200,
  "message": "操作成功",
  "data": {
    "token": "@string('lower', 32)",
    "userInfo": {
      "uid": "@id",
      "name": "@cname",
      "role|1": ["admin", "editor", "guest"]
    }
  }
}`
  }
  generate()
}

// 初始生成一次
generate()
</script>

<template>
  <div class="h-full flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">Mock 数据生成</h2>
        <el-tag size="small" type="info">Based on Mock.js</el-tag>
      </div>
      <div class="flex gap-2">
        <el-button-group>
          <el-button size="small" @click="applyExample('user')">用户示例</el-button>
          <el-button size="small" @click="applyExample('list')">列表示例</el-button>
          <el-button size="small" @click="applyExample('api')">接口示例</el-button>
        </el-button-group>
        <el-button type="primary" :icon="Refresh" @click="generate">生成数据</el-button>
        <el-button type="success" :icon="CopyDocument" @click="copyResult">复制结果</el-button>
      </div>
    </div>

    <div class="flex-1 flex gap-4 min-h-0">
      <!-- 模板编辑器 -->
      <div class="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">数据模板 (支持 JSON/JS 对象)</span>
          <el-tooltip content="支持 Mock.js 模板语法，如 @cname, @city, 'list|1-10' 等" placement="top">
            <el-icon class="text-gray-400 cursor-help"><Document /></el-icon>
          </el-tooltip>
        </div>
        <div class="flex-1 overflow-hidden relative">
          <codemirror
            v-model="template"
            placeholder="输入 Mock 模板..."
            :style="{ height: '100%' }"
            :autofocus="true"
            :indent-with-tab="true"
            :tab-size="2"
            :extensions="extensions"
          />
        </div>
      </div>

      <!-- 生成结果 -->
      <div class="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">生成结果</span>
        </div>
        <div class="flex-1 overflow-hidden relative">
          <codemirror
            v-model="generatedData"
            placeholder="生成结果将显示在这里..."
            :style="{ height: '100%' }"
            :indent-with-tab="true"
            :tab-size="2"
            :extensions="extensions"
            :disabled="true"
            :editable="false"
          />
        </div>
      </div>
    </div>
    
    <div v-if="errorMsg" class="text-red-500 text-sm px-2">
      {{ errorMsg }}
    </div>
  </div>
</template>

<style scoped>
:deep(.cm-editor) {
  height: 100%;
}
</style>
