<script setup lang="ts">
import { ref, watch } from 'vue'
import { CopyDocument, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import CryptoJS from 'crypto-js'

const activeTab = ref('text')
const textInput = ref('')
const isCalculating = ref(false)
const progress = ref(0)
const fileName = ref('')
const fileSize = ref('')

const textHashes = ref({
  md5: '',
  sha1: '',
  sha256: '',
  sha512: ''
})

const fileHashes = ref({
  md5: '',
  sha1: '',
  sha256: '',
  sha512: ''
})

// Text Hashing
watch(textInput, (val) => {
  if (!val) {
    textHashes.value = { md5: '', sha1: '', sha256: '', sha512: '' }
    return
  }
  textHashes.value = {
    md5: CryptoJS.MD5(val).toString(),
    sha1: CryptoJS.SHA1(val).toString(),
    sha256: CryptoJS.SHA256(val).toString(),
    sha512: CryptoJS.SHA512(val).toString()
  }
})

// File Hashing
const handleFileChange = async (uploadFile: any) => {
  const file = uploadFile.raw
  if (!file) return

  fileName.value = file.name
  fileSize.value = formatSize(file.size)
  progress.value = 0
  isCalculating.value = true
  
  // Reset hashes
  fileHashes.value = { md5: '', sha1: '', sha256: '', sha512: '' }

  try {
    await calculateFileHash(file)
  } catch (e: any) {
    ElMessage.error('计算出错: ' + e.message)
  } finally {
    isCalculating.value = false
    progress.value = 100
  }
}

const calculateFileHash = (file: File) => {
  return new Promise<void>((resolve, reject) => {
    const chunkSize = 2 * 1024 * 1024 // 2MB chunks
    const chunks = Math.ceil(file.size / chunkSize)
    let currentChunk = 0

    const md5Algo = CryptoJS.algo.MD5.create()
    const sha1Algo = CryptoJS.algo.SHA1.create()
    const sha256Algo = CryptoJS.algo.SHA256.create()
    const sha512Algo = CryptoJS.algo.SHA512.create()

    const fileReader = new FileReader()

    fileReader.onload = (e: any) => {
      try {
        const arrayBuffer = e.target.result
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any)
        
        md5Algo.update(wordArray)
        sha1Algo.update(wordArray)
        sha256Algo.update(wordArray)
        sha512Algo.update(wordArray)

        currentChunk++
        progress.value = Math.round((currentChunk / chunks) * 100)

        if (currentChunk < chunks) {
          loadNext()
        } else {
          fileHashes.value = {
            md5: md5Algo.finalize().toString(),
            sha1: sha1Algo.finalize().toString(),
            sha256: sha256Algo.finalize().toString(),
            sha512: sha512Algo.finalize().toString()
          }
          resolve()
        }
      } catch (err) {
        reject(err)
      }
    }

    fileReader.onerror = () => reject(new Error('File read error'))

    function loadNext() {
      const start = currentChunk * chunkSize
      const end = start + chunkSize >= file.size ? file.size : start + chunkSize
      fileReader.readAsArrayBuffer(file.slice(start, end))
    }

    loadNext()
  })
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const copyToClipboard = async (text: string) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}
</script>

<template>
  <div class="h-full flex flex-col p-4 gap-4">
    <div class="flex-none">
      <el-radio-group v-model="activeTab" size="large">
        <el-radio-button label="text">文本哈希 (Text)</el-radio-button>
        <el-radio-button label="file">文件哈希 (File)</el-radio-button>
      </el-radio-group>
    </div>

    <!-- Text Mode -->
    <div v-if="activeTab === 'text'" class="flex-1 flex flex-col gap-4 overflow-hidden">
      <div class="flex-1 flex flex-col min-h-0">
        <label class="mb-2 font-bold text-[var(--text-primary)]">输入文本:</label>
        <el-input
          v-model="textInput"
          type="textarea"
          class="flex-1"
          :rows="8"
          placeholder="请输入需要计算哈希的文本..."
          resize="none"
        />
      </div>
      
      <div class="flex-none grid grid-cols-1 gap-4">
        <div v-for="(hash, type) in textHashes" :key="type" class="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)]">
          <div class="flex justify-between items-center mb-1">
            <span class="uppercase font-bold text-[var(--text-primary)]">{{ type }}</span>
            <el-button v-if="hash" link type="primary" :icon="CopyDocument" @click="copyToClipboard(hash)">复制</el-button>
          </div>
          <div class="font-mono text-sm break-all text-gray-600 dark:text-gray-300 min-h-[1.5rem]">{{ hash || '-' }}</div>
        </div>
      </div>
    </div>

    <!-- File Mode -->
    <div v-else class="flex-1 flex flex-col gap-4 overflow-hidden">
      <div class="flex-none">
        <el-upload
          class="upload-demo"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :show-file-list="false"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处或 <em>点击上传</em>
          </div>
        </el-upload>
      </div>

      <div v-if="fileName" class="flex-none">
        <div class="text-[var(--text-primary)] mb-2">
          <span class="font-bold">文件名:</span> {{ fileName }}
          <span class="ml-4 font-bold">大小:</span> {{ fileSize }}
        </div>
        <el-progress v-if="isCalculating" :percentage="progress" :status="progress === 100 ? 'success' : ''" />
      </div>

      <div class="flex-1 overflow-auto grid grid-cols-1 gap-4 content-start">
        <div v-for="(hash, type) in fileHashes" :key="type" class="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)]">
          <div class="flex justify-between items-center mb-1">
            <span class="uppercase font-bold text-[var(--text-primary)]">{{ type }}</span>
            <el-button v-if="hash" link type="primary" :icon="CopyDocument" @click="copyToClipboard(hash)">复制</el-button>
          </div>
          <div v-if="!hash && isCalculating" class="animate-pulse h-5 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div v-else class="font-mono text-sm break-all text-gray-600 dark:text-gray-300">{{ hash || '-' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-textarea__inner) {
  height: 100% !important;
  font-family: monospace;
}
:deep(.el-upload-dragger) {
  background-color: var(--bg-secondary);
  border-color: var(--border-color);
}
:deep(.el-upload-dragger:hover) {
  border-color: var(--el-color-primary);
}
</style>
