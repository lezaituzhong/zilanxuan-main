<script setup lang="ts">
import { ref, computed } from 'vue'
import { Delete, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const text = ref('')

const stats = computed(() => {
  const content = text.value
  const len = content.length
  
  // 汉字统计 (CJK Unified Ideographs range)
  const chinese = (content.match(/[\u4e00-\u9fa5]/g) || []).length
  
  // 数字统计
  const numbers = (content.match(/[0-9]/g) || []).length
  
  // 字母统计
  const letters = (content.match(/[a-zA-Z]/g) || []).length
  
  // 标点符号 (粗略统计，非空白且非汉字字母数字)
  const punctuation = len - chinese - numbers - letters - (content.match(/\s/g) || []).length

  // 行数
  const lines = content ? content.split(/\r\n|\r|\n/).length : 0

  // 单词数 (按空白分割，仅作英文单词参考)
  const words = content.trim() ? content.trim().split(/\s+/).length : 0

  return [
    { label: '总字符数', value: len, color: 'text-blue-400' },
    { label: '汉字数', value: chinese, color: 'text-green-400' },
    { label: '英文/字母', value: letters, color: 'text-yellow-400' },
    { label: '数字', value: numbers, color: 'text-purple-400' },
    { label: '标点符号', value: Math.max(0, punctuation), color: 'text-pink-400' },
    { label: '行数', value: lines, color: 'text-cyan-400' },
    { label: '单词数 (En)', value: words, color: 'text-orange-400' },
  ]
})

const clear = () => {
  text.value = ''
  ElMessage.success('已清空')
}
</script>

<template>
  <div class="h-full flex flex-col gap-4 text-[var(--text-primary)]">
    
    <!-- Stats Dashboard -->
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      <div 
        v-for="(stat, index) in stats" 
        :key="index"
        class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-3 flex flex-col items-center justify-center text-center transition-colors duration-300"
      >
        <span class="text-xs text-[var(--text-tertiary)] mb-1">{{ stat.label }}</span>
        <span class="text-xl font-bold font-mono" :class="stat.color">{{ stat.value }}</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex justify-end">
      <el-button type="danger" @click="clear" :icon="Delete" :disabled="!text">清空内容</el-button>
    </div>

    <!-- Text Area -->
    <div class="flex-1 relative">
      <textarea
        v-model="text"
        class="w-full h-full bg-[var(--input-bg)] text-[var(--input-text)] p-4 rounded-xl border border-[var(--input-border)] focus:border-[var(--accent-color)] focus:ring-1 focus:ring-[var(--accent-color)] outline-none resize-none font-mono leading-relaxed custom-scrollbar transition-colors duration-300"
        placeholder="在此处粘贴或输入文本..."
      ></textarea>
      
      <!-- Placeholder Tip -->
      <div v-if="!text" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none flex flex-col items-center gap-2">
        <el-icon :size="48"><Document /></el-icon>
        <span>输入文本开始统计</span>
      </div>
    </div>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}
</style>
