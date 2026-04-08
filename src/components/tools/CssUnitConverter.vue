<script setup lang="ts">
import { ref, computed } from 'vue'
import { CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const rootFontSize = ref(16)
const viewportWidth = ref(1920)
const inputValue = ref(16)
const inputUnit = ref('px')

const units = [
  { label: 'px', value: 'px' },
  { label: 'rem', value: 'rem' },
  { label: 'vw', value: 'vw' },
]

const results = computed(() => {
  const val = Number(inputValue.value)
  const root = Number(rootFontSize.value)
  const vw = Number(viewportWidth.value)

  if (isNaN(val) || isNaN(root) || isNaN(vw) || root === 0 || vw === 0) {
    return { px: 0, rem: 0, vw: 0 }
  }

  let px = 0
  
  // Convert input to px first
  if (inputUnit.value === 'px') {
    px = val
  } else if (inputUnit.value === 'rem') {
    px = val * root
  } else if (inputUnit.value === 'vw') {
    px = (val * vw) / 100
  }

  return {
    px: Number(px.toFixed(2)),
    rem: Number((px / root).toFixed(4)),
    vw: Number(((px / vw) * 100).toFixed(4))
  }
})

const copyResult = (text: string) => {
  navigator.clipboard.writeText(text)
  ElMessage.success(`已复制: ${text}`)
}

// Quick Reference Table
const referenceValues = [12, 14, 16, 18, 20, 24, 32, 48, 64]
const referenceTable = computed(() => {
  const root = Number(rootFontSize.value)
  const vw = Number(viewportWidth.value)
  
  return referenceValues.map(px => ({
    px: px,
    rem: Number((px / root).toFixed(4)),
    vw: Number(((px / vw) * 100).toFixed(4))
  }))
})
</script>

<template>
  <div class="h-full flex flex-col gap-4">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Settings -->
      <el-card shadow="never" class="!border-none !bg-transparent">
        <template #header>
          <div class="font-bold">基准设置 (Settings)</div>
        </template>
        <el-form label-position="top">
          <div class="grid grid-cols-2 gap-4">
            <el-form-item label="根字体大小 (Root Font Size)">
              <el-input-number v-model="rootFontSize" :min="1" class="!w-full">
                <template #suffix>px</template>
              </el-input-number>
            </el-form-item>
            <el-form-item label="视口宽度 (Viewport Width)">
              <el-input-number v-model="viewportWidth" :min="1" class="!w-full">
                <template #suffix>px</template>
              </el-input-number>
            </el-form-item>
          </div>
        </el-form>
      </el-card>

      <!-- Converter -->
      <el-card shadow="never" class="!border-none !bg-transparent">
        <template #header>
          <div class="font-bold">转换器 (Converter)</div>
        </template>
        <div class="flex gap-2 mb-6">
          <el-input-number v-model="inputValue" class="!w-full" :precision="2" />
          <el-select v-model="inputUnit" class="w-32">
            <el-option v-for="u in units" :key="u.value" :label="u.label" :value="u.value" />
          </el-select>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div 
            v-for="(val, key) in results" 
            :key="key" 
            class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
            @click="copyResult(`${val}${key}`)"
          >
            <div class="text-xs text-gray-500 uppercase mb-1">{{ key }}</div>
            <div class="text-xl font-bold font-mono text-primary flex items-center justify-center gap-2">
              {{ val }}
              <el-icon class="opacity-0 group-hover:opacity-100 transition-opacity text-sm"><CopyDocument /></el-icon>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Reference Table -->
    <el-card shadow="hover" class="flex-1 overflow-auto">
      <template #header>
        <div class="font-bold">常用对照表 (Reference Table)</div>
      </template>
      <el-table :data="referenceTable" style="width: 100%" stripe>
        <el-table-column prop="px" label="px" align="center">
          <template #default="{ row }">
            <span class="font-mono cursor-pointer hover:text-primary" @click="copyResult(`${row.px}px`)">{{ row.px }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="rem" label="rem" align="center">
          <template #default="{ row }">
            <span class="font-mono cursor-pointer hover:text-primary" @click="copyResult(`${row.rem}rem`)">{{ row.rem }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="vw" label="vw" align="center">
          <template #default="{ row }">
            <span class="font-mono cursor-pointer hover:text-primary" @click="copyResult(`${row.vw}vw`)">{{ row.vw }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
