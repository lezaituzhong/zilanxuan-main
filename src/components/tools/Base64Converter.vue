<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument, Delete, Operation } from '@element-plus/icons-vue'

const input = ref('')
const output = ref('')

const encode = () => {
  try {
    output.value = btoa(unescape(encodeURIComponent(input.value)))
    ElMessage.success('Base64 编码成功')
  } catch (e) {
    ElMessage.error('编码失败：请输入有效的文本')
  }
}

const decode = () => {
  try {
    output.value = decodeURIComponent(escape(atob(input.value)))
    ElMessage.success('Base64 解码成功')
  } catch (e) {
    ElMessage.error('解码失败：无效的 Base64 字符串')
  }
}

const copyResult = async () => {
  if (!output.value) return
  try {
    await navigator.clipboard.writeText(output.value)
    ElMessage.success('复制成功')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

const clear = () => {
  input.value = ''
  output.value = ''
}
</script>

<template>
  <div class="h-full flex flex-col gap-4 text-[var(--text-primary)]">
    <div class="flex gap-2 flex-wrap">
      <el-button type="primary" @click="encode" :icon="Operation">Base64 编码</el-button>
      <el-button type="success" @click="decode" :icon="Operation">Base64 解码</el-button>
      <el-button type="warning" @click="copyResult" :icon="CopyDocument">复制结果</el-button>
      <el-button type="danger" @click="clear" :icon="Delete">清空</el-button>
    </div>
    <div class="flex flex-col gap-4 flex-1 min-h-[400px]">
      <div class="flex flex-col gap-2">
        <span class="text-sm text-[var(--text-secondary)]">输入</span>
        <el-input
          v-model="input"
          type="textarea"
          :rows="8"
          placeholder="请输入文本..."
          class="font-mono"
          resize="none"
        />
      </div>
      <div class="flex flex-col gap-2">
        <span class="text-sm text-[var(--text-secondary)]">结果</span>
        <el-input
          v-model="output"
          type="textarea"
          :rows="8"
          readonly
          placeholder="转换结果..."
          class="font-mono"
          resize="none"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-textarea__inner) {
  background-color: var(--input-bg);
  border-color: var(--input-border);
  color: var(--input-text);
  transition: all 0.3s;
}
:deep(.el-textarea__inner:hover), :deep(.el-textarea__inner:focus) {
  border-color: var(--accent-color);
}
</style>
