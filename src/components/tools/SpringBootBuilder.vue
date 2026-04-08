<script setup lang="ts">
import { ref, computed } from 'vue'
import { CopyDocument, VideoPlay, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const jarName = ref('app.jar')
const serverPort = ref<number | null>(8080)
const activeProfile = ref('prod')
const jvmXms = ref('512m')
const jvmXmx = ref('1024m')
const jvmXmn = ref('')
const jvmXss = ref('')
const jvmMetaspace = ref('')
const gcType = ref('G1')
const printGc = ref(false)
const heapDump = ref(false)
const headless = ref(true)
const customJvmArgs = ref('')
const customAppArgs = ref('')

const gcOptions = [
  { label: 'G1 (Recommended)', value: 'G1' },
  { label: 'ZGC (Low Latency)', value: 'ZGC' },
  { label: 'Parallel (Throughput)', value: 'Parallel' },
  { label: 'Serial (Minimal)', value: 'Serial' },
  { label: 'CMS (Deprecated)', value: 'CMS' },
  { label: 'Default', value: 'Default' }
]

const generatedCommand = computed(() => {
  const parts: string[] = ['java']

  // JVM Options
  if (headless.value) parts.push('-Djava.awt.headless=true')
  if (jvmXms.value) parts.push(`-Xms${jvmXms.value}`)
  if (jvmXmx.value) parts.push(`-Xmx${jvmXmx.value}`)
  if (jvmXmn.value) parts.push(`-Xmn${jvmXmn.value}`)
  if (jvmXss.value) parts.push(`-Xss${jvmXss.value}`)
  if (jvmMetaspace.value) parts.push(`-XX:MaxMetaspaceSize=${jvmMetaspace.value}`)

  // GC
  if (gcType.value === 'G1') parts.push('-XX:+UseG1GC')
  else if (gcType.value === 'ZGC') parts.push('-XX:+UseZGC')
  else if (gcType.value === 'Parallel') parts.push('-XX:+UseParallelGC')
  else if (gcType.value === 'Serial') parts.push('-XX:+UseSerialGC')
  else if (gcType.value === 'CMS') parts.push('-XX:+UseConcMarkSweepGC')

  if (printGc.value) parts.push('-XX:+PrintGCDetails -Xloggc:gc.log')
  if (heapDump.value) parts.push('-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=dump.hprof')

  if (customJvmArgs.value) parts.push(customJvmArgs.value)

  // Jar
  parts.push('-jar')
  parts.push(jarName.value || 'app.jar')

  // Spring Args
  if (activeProfile.value) parts.push(`--spring.profiles.active=${activeProfile.value}`)
  if (serverPort.value) parts.push(`--server.port=${serverPort.value}`)
  
  if (customAppArgs.value) parts.push(customAppArgs.value)

  return parts.join(' ')
})

const copyCommand = () => {
  navigator.clipboard.writeText(generatedCommand.value)
  ElMessage.success('启动命令已复制')
}

const reset = () => {
  jarName.value = 'app.jar'
  serverPort.value = 8080
  activeProfile.value = 'prod'
  jvmXms.value = '512m'
  jvmXmx.value = '1024m'
  jvmXmn.value = ''
  jvmXss.value = ''
  jvmMetaspace.value = ''
  gcType.value = 'G1'
  printGc.value = false
  heapDump.value = false
  headless.value = true
  customJvmArgs.value = ''
  customAppArgs.value = ''
}
</script>

<template>
  <div class="h-full flex flex-col gap-4">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-auto p-1">
      <!-- Configuration Panel -->
      <div class="space-y-4">
        <el-card shadow="never" class="!border-none !bg-transparent">
          <template #header>
            <div class="flex items-center gap-2 font-bold">
              <span class="w-1 h-4 bg-primary rounded-full"></span>
              基础配置 (Basic)
            </div>
          </template>
          <el-form label-position="top">
            <el-form-item label="JAR 文件名">
              <el-input v-model="jarName" placeholder="例如: app.jar" />
            </el-form-item>
            <div class="grid grid-cols-2 gap-4">
              <el-form-item label="环境 Profile">
                <el-input v-model="activeProfile" placeholder="dev / prod" />
              </el-form-item>
              <el-form-item label="服务端口 (Port)">
                <el-input-number v-model="serverPort" :min="1" :max="65535" class="!w-full" />
              </el-form-item>
            </div>
          </el-form>
        </el-card>

        <el-card shadow="never" class="!border-none !bg-transparent">
          <template #header>
            <div class="flex items-center gap-2 font-bold">
              <span class="w-1 h-4 bg-success rounded-full"></span>
              JVM 内存与 GC (Memory & GC)
            </div>
          </template>
          <el-form label-position="top">
            <div class="grid grid-cols-2 gap-4">
              <el-form-item label="初始堆内存 (-Xms)">
                <el-input v-model="jvmXms" placeholder="例如: 512m" />
              </el-form-item>
              <el-form-item label="最大堆内存 (-Xmx)">
                <el-input v-model="jvmXmx" placeholder="例如: 2g" />
              </el-form-item>
              <el-form-item label="年轻代大小 (-Xmn)">
                <el-input v-model="jvmXmn" placeholder="可选, 如: 256m" />
              </el-form-item>
              <el-form-item label="线程栈大小 (-Xss)">
                <el-input v-model="jvmXss" placeholder="可选, 如: 256k" />
              </el-form-item>
            </div>
            
            <el-form-item label="垃圾回收器 (GC)">
              <el-select v-model="gcType" class="w-full">
                <el-option v-for="opt in gcOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>

            <div class="flex flex-wrap gap-4">
              <el-checkbox v-model="headless" label="Headless Mode (-Djava.awt.headless=true)" border />
              <el-checkbox v-model="printGc" label="打印 GC 日志" border />
              <el-checkbox v-model="heapDump" label="OOM 时自动 Dump" border />
            </div>
          </el-form>
        </el-card>
      </div>

      <!-- Advanced & Preview -->
      <div class="space-y-4 flex flex-col">
        <el-card shadow="never" class="!border-none !bg-transparent">
          <template #header>
            <div class="flex items-center gap-2 font-bold">
              <span class="w-1 h-4 bg-warning rounded-full"></span>
              高级选项 (Advanced)
            </div>
          </template>
          <el-form label-position="top">
            <el-form-item label="自定义 JVM 参数">
              <el-input 
                v-model="customJvmArgs" 
                type="textarea" 
                :rows="3" 
                placeholder="-Duser.timezone=Asia/Shanghai -Dfile.encoding=UTF-8"
              />
            </el-form-item>
            <el-form-item label="自定义应用参数">
              <el-input 
                v-model="customAppArgs" 
                type="textarea" 
                :rows="3" 
                placeholder="--logging.level.root=DEBUG"
              />
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="hover" class="flex-1 flex flex-col">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-bold text-lg">
                <el-icon><VideoPlay /></el-icon>
                生成结果
              </div>
              <div class="flex gap-2">
                <el-button @click="reset" :icon="RefreshRight" circle />
                <el-button type="primary" @click="copyCommand" :icon="CopyDocument">复制命令</el-button>
              </div>
            </div>
          </template>
          <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm break-all leading-relaxed min-h-[100px] h-full">
            {{ generatedCommand }}
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>
