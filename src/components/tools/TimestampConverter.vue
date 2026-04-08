<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument, Refresh } from '@element-plus/icons-vue'

const currentTimestamp = ref(Math.floor(Date.now() / 1000))
const currentTimestampMs = ref(Date.now())
const inputDate = ref('')
const inputTimestamp = ref('')
const outputTimestamp = ref('')
const outputDate = ref('')

let timer: number

const startTimer = () => {
  timer = window.setInterval(() => {
    currentTimestamp.value = Math.floor(Date.now() / 1000)
    currentTimestampMs.value = Date.now()
  }, 1000)
}

startTimer()

onUnmounted(() => {
  clearInterval(timer)
})

const dateToTimestamp = () => {
  if (!inputDate.value) return
  const date = new Date(inputDate.value)
  if (isNaN(date.getTime())) {
    ElMessage.error('无效的日期格式')
    return
  }
  outputTimestamp.value = (date.getTime() / 1000).toString()
}

const timestampToDate = () => {
  if (!inputTimestamp.value) return
  let ts = parseInt(inputTimestamp.value)
  // Check if it's seconds or milliseconds (simple heuristic: if < 10000000000 it's likely seconds)
  if (ts < 10000000000) {
    ts *= 1000
  }
  const date = new Date(ts)
  if (isNaN(date.getTime())) {
    ElMessage.error('无效的时间戳')
    return
  }
  outputDate.value = date.toLocaleString()
}

const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('复制成功')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}
</script>

<template>
  <div class="h-full flex flex-col gap-6 text-[var(--text-primary)] p-4">
    <!-- Current Timestamp -->
    <div class="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)] transition-colors duration-300">
      <div class="text-[var(--text-tertiary)] mb-2 flex items-center gap-2">
        当前时间戳
        <el-icon class="cursor-pointer hover:text-[var(--accent-color)]" @click="currentTimestamp = Math.floor(Date.now() / 1000)"><Refresh /></el-icon>
      </div>
      <div class="flex gap-8 items-end">
        <div>
          <div class="text-3xl font-mono text-[var(--accent-color)] font-bold">{{ currentTimestamp }}</div>
          <div class="text-xs text-[var(--text-tertiary)]">秒 (s)</div>
        </div>
        <div>
          <div class="text-xl font-mono text-emerald-500">{{ currentTimestampMs }}</div>
          <div class="text-xs text-[var(--text-tertiary)]">毫秒 (ms)</div>
        </div>
      </div>
    </div>

    <!-- Date -> Timestamp -->
    <div class="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
      <div class="flex flex-col gap-2">
        <span class="text-sm text-[var(--text-tertiary)]">日期时间 (YYYY-MM-DD HH:mm:ss)</span>
        <el-input v-model="inputDate" placeholder="例如: 2024-01-01 12:00:00" />
      </div>
      <el-button type="primary" @click="dateToTimestamp">转换 &gt;</el-button>
      <div class="flex flex-col gap-2 relative">
        <span class="text-sm text-[var(--text-tertiary)]">时间戳 (秒)</span>
        <el-input v-model="outputTimestamp" readonly placeholder="结果...">
            <template #append>
                <el-button :icon="CopyDocument" @click="copy(outputTimestamp)" />
            </template>
        </el-input>
      </div>
    </div>

    <!-- Timestamp -> Date -->
    <div class="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-center border-t border-[var(--border-color)] pt-6">
      <div class="flex flex-col gap-2">
        <span class="text-sm text-[var(--text-tertiary)]">时间戳</span>
        <el-input v-model="inputTimestamp" placeholder="请输入时间戳..." />
      </div>
      <el-button type="primary" @click="timestampToDate">转换 &gt;</el-button>
      <div class="flex flex-col gap-2">
        <span class="text-sm text-[var(--text-tertiary)]">北京时间</span>
        <el-input v-model="outputDate" readonly placeholder="结果...">
             <template #append>
                <el-button :icon="CopyDocument" @click="copy(outputDate)" />
            </template>
        </el-input>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-input__wrapper) {
  background-color: var(--input-bg);
  box-shadow: 0 0 0 1px var(--input-border) inset;
}
:deep(.el-input__inner) {
  color: var(--input-text);
}
:deep(.el-input-group__append) {
  background-color: var(--bg-tertiary);
  border-color: var(--input-border);
  color: var(--text-secondary);
}
</style>
