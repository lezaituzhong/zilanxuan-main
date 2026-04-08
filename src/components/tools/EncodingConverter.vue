<script setup lang="ts">
import { ref, computed } from 'vue'
import { Buffer } from 'buffer'
import iconv from 'iconv-lite'
import { CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// Ensure Buffer is available globally for iconv-lite if needed, 
// though importing it might be enough. 
// iconv-lite usually works with Buffer.

const activeTab = ref('lookup')

// --- Encoding Lookup ---
const lookupText = ref('你好 World')
const targetEncodings = ['utf8', 'gbk', 'latin1', 'utf16le', 'base64']

const lookupResults = computed(() => {
  if (!lookupText.value) return []
  
  return targetEncodings.map(enc => {
    try {
      if (enc === 'base64') {
        return {
          name: 'Base64',
          hex: Buffer.from(lookupText.value, 'utf8').toString('base64'),
          len: '-'
        }
      }
      
      const buf = iconv.encode(lookupText.value, enc)
      return {
        name: enc.toUpperCase(),
        hex: buf.toString('hex').replace(/(.{2})/g, '$1 ').trim().toUpperCase(),
        len: buf.length
      }
    } catch (e) {
      return { name: enc.toUpperCase(), hex: 'Error', len: 0 }
    }
  })
})

const copyHex = (hex: string) => {
  navigator.clipboard.writeText(hex.replace(/\s/g, ''))
  ElMessage.success('Hex Copied')
}

// --- Mojibake Restore ---
const garbledText = ref('ä¸æ–‡') // "中文" in UTF-8 displayed as Latin1
const currentEncoding = ref('latin1') // How it is interpreted now
const originalEncoding = ref('utf8') // What it should be

const encodingsList = [
  { label: 'UTF-8', value: 'utf8' },
  { label: 'GBK / GB2312', value: 'gbk' },
  { label: 'ISO-8859-1 (Latin1)', value: 'latin1' },
  { label: 'Windows-1252', value: 'win1252' },
  { label: 'UTF-16LE', value: 'utf16le' },
  { label: 'Big5', value: 'big5' },
  { label: 'Shift_JIS', value: 'shift_jis' }
]

const restoredText = computed(() => {
  if (!garbledText.value) return ''
  try {
    // 1. Encode back to bytes using the "Current Encoding" (wrong interpretation)
    // e.g. "ä¸æ–‡" (seen as Latin1) -> bytes
    const buf = iconv.encode(garbledText.value, currentEncoding.value)
    
    // 2. Decode bytes using "Original Encoding"
    // e.g. bytes -> UTF-8 -> "中文"
    return iconv.decode(buf, originalEncoding.value)
  } catch (e: any) {
    return 'Error: ' + e.message
  }
})

const copyRestored = () => {
  if (restoredText.value) {
    navigator.clipboard.writeText(restoredText.value)
    ElMessage.success('Copied')
  }
}

// Common Scenarios
const applyScenario = (type: string) => {
  if (type === 'utf8_latin1') {
    currentEncoding.value = 'latin1'
    originalEncoding.value = 'utf8'
  } else if (type === 'gbk_latin1') {
    currentEncoding.value = 'latin1'
    originalEncoding.value = 'gbk'
  } else if (type === 'gbk_utf8') {
    currentEncoding.value = 'utf8'
    originalEncoding.value = 'gbk'
  }
}

</script>

<template>
  <div class="h-full flex flex-col gap-4 p-4">
    <el-tabs v-model="activeTab" class="h-full flex flex-col">
      
      <!-- Tab 1: Encoding Lookup -->
      <el-tab-pane label="编码查询 (String to Hex)" name="lookup">
        <div class="flex flex-col gap-4 h-full overflow-auto">
          <div>
            <div class="mb-2 text-sm text-gray-500">输入文本</div>
            <el-input 
              v-model="lookupText" 
              type="textarea" 
              :rows="3" 
              placeholder="Type something..."
              class="font-mono"
            />
          </div>
          
          <div class="flex-1 overflow-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm">
                  <th class="p-3 border-b border-[var(--border-color)] w-32">Encoding</th>
                  <th class="p-3 border-b border-[var(--border-color)]">Hex / Result</th>
                  <th class="p-3 border-b border-[var(--border-color)] w-24">Bytes</th>
                  <th class="p-3 border-b border-[var(--border-color)] w-16">Op</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in lookupResults" :key="item.name" class="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]">
                  <td class="p-3 font-bold text-[var(--text-primary)]">{{ item.name }}</td>
                  <td class="p-3 font-mono text-sm text-[var(--text-secondary)] break-all">{{ item.hex }}</td>
                  <td class="p-3 text-[var(--text-tertiary)]">{{ item.len }}</td>
                  <td class="p-3">
                    <el-button link :icon="CopyDocument" @click="copyHex(item.hex)" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tab 2: Mojibake Restore -->
      <el-tab-pane label="乱码恢复 (Mojibake Fixer)" name="restore">
        <div class="flex flex-col gap-6 h-full">
          <!-- Input -->
          <div>
             <div class="mb-2 text-sm text-gray-500 font-bold">乱码文本 (Garbled Text)</div>
             <el-input 
               v-model="garbledText" 
               type="textarea" 
               :rows="3" 
               class="font-mono text-lg"
             />
          </div>
          
          <!-- Controls -->
          <div class="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
            <div class="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
               <div class="flex items-center gap-2 w-full md:w-auto">
                 <span class="text-sm whitespace-nowrap">当前显示为 (Read as):</span>
                 <el-select v-model="currentEncoding" class="w-40">
                   <el-option v-for="opt in encodingsList" :key="opt.value" :label="opt.label" :value="opt.value" />
                 </el-select>
               </div>
               
               <div class="text-[var(--text-tertiary)]">➔ 恢复为 (Restore to) ➔</div>
               
               <div class="flex items-center gap-2 w-full md:w-auto">
                 <span class="text-sm whitespace-nowrap">原本应该是 (Should be):</span>
                 <el-select v-model="originalEncoding" class="w-40">
                   <el-option v-for="opt in encodingsList" :key="opt.value" :label="opt.label" :value="opt.value" />
                 </el-select>
               </div>
            </div>
            
            <div class="flex gap-2 flex-wrap">
              <span class="text-xs text-[var(--text-tertiary)] self-center mr-2">常见场景:</span>
              <el-button size="small" @click="applyScenario('utf8_latin1')">UTF-8 被误读为 Latin1</el-button>
              <el-button size="small" @click="applyScenario('gbk_latin1')">GBK 被误读为 Latin1</el-button>
              <el-button size="small" @click="applyScenario('gbk_utf8')">GBK 被误读为 UTF-8</el-button>
            </div>
          </div>
          
          <!-- Result -->
          <div class="flex-1 flex flex-col min-h-0">
            <div class="mb-2 text-sm text-gray-500 font-bold flex justify-between items-center">
              <span>恢复结果 (Result)</span>
              <el-button link type="primary" :icon="CopyDocument" @click="copyRestored">复制</el-button>
            </div>
            <div class="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded p-4 font-mono text-lg overflow-auto whitespace-pre-wrap break-all text-[var(--text-primary)]">
              {{ restoredText }}
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  padding-top: 16px;
}
:deep(.el-tabs__header) {
  margin-bottom: 0;
}
</style>