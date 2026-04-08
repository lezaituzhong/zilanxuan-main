<script setup lang="ts">
import { ref, computed } from 'vue'
import { CopyDocument, EditPen, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const inputText = ref('')

// 分词函数：将任意格式的输入字符串拆分为单词数组
const getWords = (str: string): string[] => {
  if (!str) return []
  
  // 1. 处理驼峰：在小写字母和大写字母之间插入空格
  let text = str.replace(/([a-z])([A-Z])/g, '$1 $2')
  // 2. 处理全大写单词后跟小写（例如 XMLHttp -> XML Http）
  text = text.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  
  // 3. 将非字母数字字符替换为空格
  text = text.replace(/[^a-zA-Z0-9]/g, ' ')
  
  // 4. 按空格分割并过滤空项
  return text.split(/\s+/).filter(w => w.length > 0)
}

// 转换结果计算属性
const conversions = computed(() => {
  const words = getWords(inputText.value)
  if (words.length === 0) return []

  const lowerWords = words.map(w => w.toLowerCase())
  
  return [
    {
      label: '全小写 (Lower Case)',
      desc: '保留分隔符',
      value: inputText.value.toLowerCase()
    },
    {
      label: '全大写 (Upper Case)',
      desc: '保留分隔符',
      value: inputText.value.toUpperCase()
    },
    {
      label: '小驼峰 (Camel Case)',
      desc: 'javaScriptVariable',
      value: lowerWords.map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('')
    },
    {
      label: '大驼峰 (Pascal Case)',
      desc: 'JavaScriptVariable',
      value: lowerWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
    },
    {
      label: '小蛇形 (Snake Case)',
      desc: 'java_script_variable',
      value: lowerWords.join('_')
    },
    {
      label: '大蛇形 (SNAKE CASE)',
      desc: 'JAVA_SCRIPT_VARIABLE',
      value: lowerWords.join('_').toUpperCase()
    },
    {
      label: '小脊柱 (Kebab Case)',
      desc: 'java-script-variable',
      value: lowerWords.join('-')
    },
     {
      label: '大脊柱 (KEBAB CASE)',
      desc: 'JAVA-SCRIPT-VARIABLE',
      value: lowerWords.join('-').toUpperCase()
    },
    {
      label: '空格 (Space Case)',
      desc: 'java script variable',
      value: lowerWords.join(' ')
    },
    {
      label: '点连接 (Dot Case)',
      desc: 'java.script.variable',
      value: lowerWords.join('.')
    },
    {
      label: '路径 (Path Case)',
      desc: 'java/script/variable',
      value: lowerWords.join('/')
    }
  ]
})

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('复制成功')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

const clear = () => {
  inputText.value = ''
}
</script>

<template>
  <div class="h-full flex flex-col gap-6 text-[var(--text-primary)] max-w-5xl mx-auto">
    
    <!-- Input Section -->
    <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 sticky top-0 z-10 backdrop-blur-md transition-colors duration-300">
      <div class="flex items-center gap-4">
        <el-input
          v-model="inputText"
          placeholder="输入变量名 (例如: helloWorld, MyVariable)"
          size="large"
          clearable
          class="flex-1"
        >
          <template #prefix>
            <el-icon class="text-[var(--text-tertiary)]"><EditPen /></el-icon>
          </template>
        </el-input>
        <el-button type="danger" plain @click="clear" :disabled="!inputText">
          清空
        </el-button>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="conversions.length > 0" class="flex flex-col gap-0 border border-[var(--border-color)] rounded-xl overflow-hidden bg-[var(--bg-secondary)] transition-colors duration-300">
      <div 
        v-for="(item, index) in conversions" 
        :key="index"
        class="flex items-center justify-between p-3 border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors group"
      >
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <span class="text-[var(--text-secondary)] text-sm w-40 flex-shrink-0 text-right">{{ item.label }}</span>
          <div class="w-px h-4 bg-[var(--border-color)]"></div>
          <span class="font-mono text-base text-[var(--accent-color)] truncate select-all">{{ item.value }}</span>
        </div>
        
        <el-button 
            type="primary" 
            link 
            :icon="CopyDocument" 
            @click="copyToClipboard(item.value)" 
            class="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-4"
        >
            复制
        </el-button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-[var(--text-tertiary)] opacity-50 min-h-[300px]">
      <el-icon :size="64" class="mb-4"><Refresh /></el-icon>
      <p>输入内容以查看全格式转换结果</p>
    </div>

  </div>
</template>

<style scoped>
/* Element Plus Input Override for Dark Theme */
:deep(.el-input__wrapper) {
  background-color: var(--input-bg);
  box-shadow: 0 0 0 1px var(--input-border) inset;
}
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--accent-color) inset;
}
:deep(.el-input__inner) {
  color: var(--input-text);
}
</style>
