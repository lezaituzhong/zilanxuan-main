<script setup lang="ts">
import { ref, computed } from 'vue'
import { CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const inputColor = ref('#409EFF')

// Helper functions
const hexToRgb = (hex: string) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
  hex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b)
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16)
  } : null
}

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

const parseInput = (str: string) => {
  if (!str) return null
  str = str.trim().toLowerCase()
  
  // Try HEX
  if (str.startsWith('#')) {
    const rgb = hexToRgb(str)
    if (rgb) return { ...rgb, a: 1 }
  }
  
  // Try RGB/RGBA
  const rgbMatch = str.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/)
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]!),
      g: parseInt(rgbMatch[2]!),
      b: parseInt(rgbMatch[3]!),
      a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
    }
  }
  
  // Try HSL/HSLA (Simple support)
  const hslMatch = str.match(/^hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*([\d.]+))?\)$/)
  if (hslMatch) {
     // Convert HSL to RGB (omitted for brevity in regex approach, but could add if needed)
     // For now, let's assume user inputs HEX or RGB mostly. 
     // Element Plus ColorPicker outputs HEX or RGB/RGBA.
  }

  return null
}

// State derived from inputColor
const colorState = computed(() => {
  let r = 0, g = 0, b = 0, a = 1
  let valid = false

  // First try to parse as HEX/RGB string
  const parsed = parseInput(inputColor.value)
  if (parsed) {
    r = parsed.r; g = parsed.g; b = parsed.b; a = parsed.a
    valid = true
  } else {
    // If simple parse fails, try hexToRgb again loosely
    const hexRgb = hexToRgb(inputColor.value)
    if (hexRgb) {
      r = hexRgb.r; g = hexRgb.g; b = hexRgb.b
      valid = true
    }
  }

  if (!valid) return null

  const hsl = rgbToHsl(r, g, b)
  const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()

  return {
    hex: hex,
    rgb: `rgb(${r}, ${g}, ${b})`,
    rgba: `rgba(${r}, ${g}, ${b}, ${a})`,
    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    hsla: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a})`,
    object: { r, g, b, a, h: hsl.h, s: hsl.s, l: hsl.l }
  }
})

const updateFromPicker = (val: string) => {
  if (val) inputColor.value = val
}

const copyResult = (text: string) => {
  if (!text) return
  navigator.clipboard.writeText(text)
  ElMessage.success(`已复制: ${text}`)
}
</script>

<template>
  <div class="h-full flex flex-col gap-6">
    <!-- Input Section -->
    <div class="flex flex-col md:flex-row gap-6 items-start">
      <div class="w-full md:w-auto flex flex-col items-center gap-2">
        <el-color-picker 
          v-model="inputColor" 
          show-alpha 
          size="large"
          @change="updateFromPicker"
        />
        <span class="text-xs text-gray-500">点击选择</span>
      </div>
      
      <div class="flex-1 w-full">
        <el-input 
          v-model="inputColor" 
          placeholder="输入颜色 (HEX, RGB, RGBA)" 
          size="large" 
          clearable
        >
          <template #prepend>颜色值</template>
        </el-input>
        <div class="mt-2 text-xs text-gray-400">
          支持格式: #409EFF, rgb(64, 158, 255), rgba(...)
        </div>
      </div>
    </div>

    <!-- Preview & Results -->
    <div v-if="colorState" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Preview Box -->
      <el-card shadow="never" class="!border-none !bg-transparent">
        <template #header>
          <div class="font-bold">预览 (Preview)</div>
        </template>
        <div 
          class="w-full h-32 rounded-lg shadow-inner flex items-center justify-center text-white font-bold text-shadow transition-colors duration-300"
          :style="{ backgroundColor: colorState.rgba }"
        >
          <span :style="{ color: colorState.object.l > 50 ? '#000' : '#fff' }">
            {{ colorState.hex }}
          </span>
        </div>
      </el-card>

      <!-- Formats -->
      <el-card shadow="hover" class="!border-none">
        <template #header>
          <div class="font-bold">转换结果 (Formats)</div>
        </template>
        <div class="space-y-3">
          <div 
            v-for="(val, key) in { HEX: colorState.hex, RGB: colorState.rgb, RGBA: colorState.rgba, HSL: colorState.hsl, HSLA: colorState.hsla }" 
            :key="key"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            @click="copyResult(val)"
          >
            <span class="text-gray-500 font-medium w-16">{{ key }}</span>
            <span class="font-mono font-bold flex-1 text-right truncate mr-2">{{ val }}</span>
            <el-icon class="opacity-0 group-hover:opacity-100 transition-opacity"><CopyDocument /></el-icon>
          </div>
        </div>
      </el-card>
    </div>
    
    <div v-else class="flex items-center justify-center h-32 text-gray-400">
      请输入有效的颜色值
    </div>
  </div>
</template>

<style scoped>
.text-shadow {
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}
</style>
