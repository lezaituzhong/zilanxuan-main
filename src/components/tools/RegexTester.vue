<script setup lang="ts">
import { ref, computed } from 'vue'
import { CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const regexPattern = ref('\\d+')
const regexFlags = ref(['g', 'm'])
const testText = ref('Hello 123 World 456\nTest 789')
const errorMsg = ref('')

const regexFlagsStr = computed(() => regexFlags.value.join(''))

const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

const matchResult = computed(() => {
  errorMsg.value = ''
  if (!regexPattern.value) return escapeHtml(testText.value)

  try {
    const regex = new RegExp(regexPattern.value, regexFlagsStr.value)
    const text = testText.value
    
    // If global flag is not set, match only first
    if (!regex.global) {
      const match = regex.exec(text)
      if (!match) return escapeHtml(text)
      
      const prefix = escapeHtml(text.slice(0, match.index))
      const matched = `<span class="bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 border-b-2 border-yellow-500">${escapeHtml(match[0])}</span>`
      const suffix = escapeHtml(text.slice(match.index + match[0].length))
      return prefix + matched + suffix
    }

    // Global match
    let lastIndex = 0
    let result = ''
    
    const matches = Array.from(text.matchAll(regex))
    
    if (matches.length === 0) return escapeHtml(text)

    matches.forEach((m) => {
      const start = m.index!
      const end = start + m[0].length
      
      result += escapeHtml(text.slice(lastIndex, start))
      result += `<span class="bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 border-b-2 border-yellow-500" title="Match: ${m[0]}">${escapeHtml(m[0])}</span>`
      lastIndex = end
    })
    
    result += escapeHtml(text.slice(lastIndex))
    return result

  } catch (e: any) {
    errorMsg.value = e.message
    return escapeHtml(testText.value)
  }
})

const matchCount = computed(() => {
  try {
    if (!regexPattern.value) return 0
    const regex = new RegExp(regexPattern.value, regexFlagsStr.value)
    if (!regex.global) {
      return regex.test(testText.value) ? 1 : 0
    }
    const matches = testText.value.match(regex)
    return matches ? matches.length : 0
  } catch {
    return 0
  }
})

const copyResult = () => {
  try {
     const regex = new RegExp(regexPattern.value, regexFlagsStr.value)
     const matches = testText.value.match(regex)
     if (matches) {
       navigator.clipboard.writeText(JSON.stringify(matches, null, 2))
       ElMessage.success('匹配结果已复制')
     } else {
       ElMessage.info('无匹配结果')
     }
  } catch (e) {
    ElMessage.error('复制失败')
  }
}
</script>

<template>
  <div class="h-full flex flex-col gap-4 p-4">
    <!-- Header / Controls -->
    <div class="flex flex-col gap-4 bg-[var(--bg-secondary)] p-4 rounded-lg shadow-sm">
      <div class="flex gap-4 items-start">
        <div class="flex-1">
          <div class="mb-2 text-sm text-gray-500">正则表达式 (Regular Expression)</div>
          <el-input 
            v-model="regexPattern" 
            placeholder="例如: \d+" 
            size="large"
            :class="{'is-error': errorMsg}"
          >
            <template #prepend>/</template>
            <template #append>/{{ regexFlags }}</template>
          </el-input>
          <div v-if="errorMsg" class="text-red-500 text-xs mt-1">{{ errorMsg }}</div>
        </div>
        
        <div class="w-48">
          <div class="mb-2 text-sm text-gray-500">修饰符 (Flags)</div>
          <el-select v-model="regexFlags" multiple collapse-tags placeholder="选择修饰符">
            <el-option label="global (g)" value="g" />
            <el-option label="ignore case (i)" value="i" />
            <el-option label="multiline (m)" value="m" />
            <el-option label="dotAll (s)" value="s" />
            <el-option label="unicode (u)" value="u" />
            <el-option label="sticky (y)" value="y" />
          </el-select>
        </div>
      </div>
      
      <div class="flex items-center justify-between text-sm">
        <div class="text-gray-500">
          匹配数量: <span class="font-bold text-primary">{{ matchCount }}</span>
        </div>
        <el-button type="primary" link :icon="CopyDocument" @click="copyResult">复制匹配结果JSON</el-button>
      </div>
    </div>

    <!-- Main Content Split -->
    <div class="flex-1 flex gap-4 min-h-0">
      <!-- Input -->
      <div class="flex-1 flex flex-col min-w-0">
        <div class="mb-2 font-medium text-gray-700 dark:text-gray-300">测试文本</div>
        <el-input
          v-model="testText"
          type="textarea"
          class="flex-1 h-full font-mono text-base !leading-loose"
          input-style="height: 100%; resize: none; font-family: monospace;"
          placeholder="在此输入待测试的文本..."
        />
      </div>

      <!-- Output -->
      <div class="flex-1 flex flex-col min-w-0">
        <div class="mb-2 font-medium text-gray-700 dark:text-gray-300">匹配结果预览</div>
        <div 
          class="flex-1 border border-[var(--border-color)] rounded bg-[var(--bg-primary)] p-[11px] overflow-auto font-mono text-base leading-loose whitespace-pre-wrap break-all"
          v-html="matchResult"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-input-group__prepend), :deep(.el-input-group__append) {
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
}
:deep(.el-textarea__inner) {
  padding: 11px; /* Match the padding of the result div for alignment */
}
</style>