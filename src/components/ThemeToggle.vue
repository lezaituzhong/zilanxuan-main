<script setup lang="ts">
import { Moon, Sunny } from '@element-plus/icons-vue'
import { useTheme } from '../composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button 
    @click="toggleTheme" 
    class="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 focus:outline-none overflow-hidden"
    :title="isDark ? '切换到亮色模式' : '切换到暗色模式'"
  >
    <el-icon 
      :size="20" 
      class="absolute transition-all duration-500"
      :class="isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100 text-orange-500'"
    >
      <Sunny />
    </el-icon>
    <el-icon 
      :size="20" 
      class="absolute transition-all duration-500"
      :class="isDark ? 'opacity-100 rotate-0 scale-100 text-yellow-300' : 'opacity-0 -rotate-90 scale-50'"
    >
      <Moon />
    </el-icon>
  </button>
</template>
