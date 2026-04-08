<template>
  <div class="h-full flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2 transition-colors duration-300">
        <el-icon><Picture /></el-icon>
        本地图片压缩
      </h2>
      <div class="text-xs bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded border border-yellow-500/20">
        <el-icon class="mr-1"><Warning /></el-icon>
        所有操作均在本地浏览器完成，图片不会上传至服务器
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col gap-4 overflow-hidden">
      <!-- Upload Area -->
      <div 
        class="bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer hover:border-blue-500/50 hover:bg-[var(--bg-tertiary)]"
        :class="{ 'border-blue-500 bg-blue-500/10': isDragging }"
        @dragenter.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @dragover.prevent
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
        v-if="!file"
      >
        <el-icon class="text-6xl text-[var(--text-tertiary)] mb-4"><UploadFilled /></el-icon>
        <div class="text-lg text-[var(--text-secondary)] font-bold mb-2">点击选择或拖放图片到此处</div>
        <div class="text-sm text-[var(--text-tertiary)]">支持 JPG、PNG 格式</div>
        <input 
          type="file" 
          ref="fileInput" 
          class="hidden" 
          accept="image/jpeg,image/png" 
          @change="handleFileSelect"
        />
      </div>

      <!-- Processing Area -->
      <div v-else class="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        <!-- Settings Panel -->
        <div class="w-full md:w-80 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar transition-colors duration-300">
           <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
               <span class="font-bold text-[var(--text-primary)]">压缩设置</span>
               <el-button link type="danger" @click="reset">重置</el-button>
           </div>
           
           <div class="space-y-4">
               <div>
                   <div class="text-sm text-[var(--text-secondary)] mb-2">最大尺寸 (宽/高 px)</div>
                   <el-input-number v-model="maxWidth" :min="100" :max="4096" :step="100" class="w-full" />
               </div>
               
               <div>
                   <div class="text-sm text-[var(--text-secondary)] mb-2">目标文件大小 (MB)</div>
                   <el-input-number v-model="maxSizeMB" :min="0.1" :max="10" :step="0.1" :precision="1" class="w-full" />
               </div>

               <div>
                   <div class="text-sm text-[var(--text-secondary)] mb-2">压缩质量 (0.1 - 1.0)</div>
                   <el-slider v-model="quality" :min="0.1" :max="1.0" :step="0.1" show-input input-size="small" />
               </div>

               <el-button type="primary" class="w-full mt-2" :loading="isCompressing" @click="compressImage">
                   开始压缩
               </el-button>
           </div>

           <div class="mt-auto border-t border-[var(--border-color)] pt-4">
               <div class="text-xs text-[var(--text-tertiary)] mb-2">文件信息</div>
               <div class="text-sm text-[var(--text-secondary)] break-all mb-1">{{ file.name }}</div>
               <div class="text-xs text-[var(--text-tertiary)]">原始大小: {{ formatSize(file.size) }}</div>
           </div>
        </div>

        <!-- Preview Area -->
        <div class="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col overflow-hidden relative transition-colors duration-300">
            <div class="flex-1 flex items-center justify-center overflow-hidden bg-[var(--bg-tertiary)] rounded-lg relative">
                <div v-if="previewUrl" class="h-full w-full flex items-center justify-center p-2">
                    <img :src="previewUrl" class="max-w-full max-h-full object-contain shadow-lg" alt="Preview" />
                </div>
                <div v-else class="text-[var(--text-tertiary)] flex flex-col items-center">
                    <el-icon class="text-4xl mb-2"><Picture /></el-icon>
                    <span>预览区域</span>
                </div>
                
                <!-- Comparison Badge -->
                <div v-if="compressedBlob" class="absolute bottom-4 right-4 bg-[var(--bg-primary)]/90 backdrop-blur text-[var(--text-primary)] px-3 py-2 rounded-lg text-sm shadow-xl border border-[var(--border-color)] flex flex-col gap-1 transition-colors duration-300">
                    <div class="flex justify-between gap-4">
                        <span class="text-[var(--text-tertiary)]">原始:</span>
                        <span>{{ formatSize(file.size) }}</span>
                    </div>
                    <div class="flex justify-between gap-4 font-bold text-green-500">
                        <span>压缩后:</span>
                        <span>{{ formatSize(compressedBlob.size) }}</span>
                    </div>
                    <div class="border-t border-[var(--border-color)] mt-1 pt-1 text-xs text-center text-blue-400">
                        减少 {{ calculateReduction() }}%
                    </div>
                </div>
            </div>
            
            <div class="mt-4 flex justify-end gap-3" v-if="compressedBlob">
                 <el-button @click="previewOriginal">查看原图</el-button>
                 <el-button type="success" :icon="Download" @click="downloadCompressed">下载压缩图</el-button>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { UploadFilled, Picture, Warning, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// State
const isDragging = ref(false)
const file = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const maxWidth = ref(800)
const maxSizeMB = ref(0.5)
const quality = ref(0.8)
const isCompressing = ref(false)
const previewUrl = ref<string>('')
const compressedBlob = ref<Blob | null>(null)
const originalUrl = ref<string>('')

// Methods
const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const triggerFileInput = () => {
    fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0 && input.files[0]) {
        processFile(input.files[0])
    }
}

const handleDrop = (event: DragEvent) => {
    isDragging.value = false
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0 && event.dataTransfer.files[0]) {
        processFile(event.dataTransfer.files[0])
    }
}

const processFile = (selectedFile: File) => {
    if (!selectedFile.type.match('image.*')) {
        ElMessage.error('请选择图片文件 (JPG/PNG)')
        return
    }
    
    // Cleanup previous
    if (originalUrl.value) URL.revokeObjectURL(originalUrl.value)
    if (previewUrl.value && previewUrl.value !== originalUrl.value) URL.revokeObjectURL(previewUrl.value)
    
    file.value = selectedFile
    originalUrl.value = URL.createObjectURL(selectedFile)
    previewUrl.value = originalUrl.value // Default show original
    compressedBlob.value = null // Reset compressed state
    
    // Auto compress with defaults? Optional. Let's wait for user or do initial soft compress?
    // Let's wait for user to click "Start Compress" to avoid lag on large files immediately.
}

const compressImage = async () => {
    if (!file.value) return
    
    isCompressing.value = true
    try {
        const result = await performCompression(file.value, {
            maxWidth: maxWidth.value,
            maxSizeMB: maxSizeMB.value,
            quality: quality.value
        })
        
        if (previewUrl.value && previewUrl.value !== originalUrl.value) URL.revokeObjectURL(previewUrl.value)
        
        compressedBlob.value = result
        previewUrl.value = URL.createObjectURL(result)
        ElMessage.success('压缩完成')
    } catch (e: any) {
        ElMessage.error('压缩失败: ' + e.message)
    } finally {
        isCompressing.value = false
    }
}

const performCompression = (sourceFile: File, options: { maxWidth: number, maxSizeMB: number, quality: number }): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = URL.createObjectURL(sourceFile)
        
        img.onload = () => {
            URL.revokeObjectURL(img.src)
            
            let width = img.width
            let height = img.height
            
            // Resize logic
            if (width > options.maxWidth) {
                height = Math.round((height * options.maxWidth) / width)
                width = options.maxWidth
            }
            
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            
            const ctx = canvas.getContext('2d')
            if (!ctx) {
                reject(new Error('Canvas context not available'))
                return
            }
            
            ctx.drawImage(img, 0, 0, width, height)
            
            // Compression logic loop (Binary search for quality if size constraint is strict?)
            // For simplicity, we use the user provided quality first. 
            // If strict size limit is needed, we might need multiple passes.
            // Requirement says "Max file size setting". So we should try to respect it.
            
            const maxSizeBytes = options.maxSizeMB * 1024 * 1024
            let currentQuality = options.quality
            
            const attemptCompress = (q: number) => {
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Compression failed'))
                        return
                    }
                    
                    if (blob.size > maxSizeBytes && q > 0.1) {
                        // Too big, try lower quality
                        attemptCompress(q - 0.1)
                    } else {
                        // Accept result (either fits or quality too low already)
                        if (blob.size > maxSizeBytes) {
                            ElMessage.warning('无法压缩到目标大小，已尽可能压缩')
                        }
                        resolve(blob)
                    }
                }, sourceFile.type === 'image/png' ? 'image/png' : 'image/jpeg', q)
            }
            
            attemptCompress(currentQuality)
        }
        
        img.onerror = () => reject(new Error('Image load failed'))
    })
}

const reset = () => {
    if (originalUrl.value) URL.revokeObjectURL(originalUrl.value)
    if (previewUrl.value && previewUrl.value !== originalUrl.value) URL.revokeObjectURL(previewUrl.value)
    
    file.value = null
    compressedBlob.value = null
    previewUrl.value = ''
    originalUrl.value = ''
}

const previewOriginal = () => {
    if (originalUrl.value) {
        previewUrl.value = originalUrl.value
    }
}

const downloadCompressed = () => {
    if (!compressedBlob.value) return
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(compressedBlob.value)
    
    // Construct filename: name_compressed.ext
    const originalName = file.value?.name || 'image'
    const dotIndex = originalName.lastIndexOf('.')
    let name = originalName
    let ext = ''
    if (dotIndex !== -1) {
        name = originalName.substring(0, dotIndex)
        ext = originalName.substring(dotIndex)
    }
    link.download = `${name}_compressed${ext}`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(link.href), 100)
}

const calculateReduction = () => {
    if (!file.value || !compressedBlob.value) return 0
    const reduction = ((file.value.size - compressedBlob.value.size) / file.value.size) * 100
    return Math.max(0, reduction).toFixed(1)
}

onUnmounted(() => {
    reset()
})
</script>