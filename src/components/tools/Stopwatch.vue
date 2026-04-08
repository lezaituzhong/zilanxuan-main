<template>
  <div class="h-full flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2 transition-colors duration-300">
        <el-icon><Timer /></el-icon>
        在线秒表
      </h2>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col gap-4 overflow-hidden">
      <!-- Display Area -->
      <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col items-center justify-center relative group shrink-0 transition-colors duration-300">
        <!-- Main Time Display -->
        <div class="text-5xl md:text-7xl font-mono font-bold text-[var(--text-primary)] tracking-widest tabular-nums select-none drop-shadow-xl transition-colors duration-300">
          {{ formattedTime }}
        </div>
        
        <!-- Controls -->
        <div class="mt-4 flex gap-4">
          <el-button 
            :type="isRunning ? 'danger' : 'success'" 
            size="large" 
            circle 
            class="!w-14 !h-14 !text-xl"
            @click="toggleTimer"
          >
            <el-icon><component :is="isRunning ? VideoPause : VideoPlay" /></el-icon>
          </el-button>
          
          <el-button 
            type="primary" 
            size="large" 
            circle 
            class="!w-14 !h-14 !text-xl"
            @click="handleLap"
            :disabled="!isRunning && time === 0"
          >
            <el-icon><Flag /></el-icon>
          </el-button>
          
          <el-button 
            type="info" 
            size="large" 
            circle 
            class="!w-14 !h-14 !text-xl"
            @click="handleReset"
          >
            <el-icon><RefreshRight /></el-icon>
          </el-button>
        </div>

        <div class="mt-2 text-xs text-[var(--text-tertiary)] font-mono">
             快捷键：A-开始/停止，S-计次，C-复位
        </div>
      </div>

      <!-- Content Grid: Laps & Instructions -->
      <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden min-h-0">
        
        <!-- Laps List -->
        <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex flex-col overflow-hidden h-[300px] shrink-0 transition-colors duration-300">
           <div class="px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex justify-between items-center shrink-0">
               <span class="font-bold text-[var(--text-secondary)] text-sm">计次记录</span>
               <span class="text-xs text-[var(--text-tertiary)]" v-if="laps.length">共 {{ laps.length }} 条</span>
           </div>
           
           <!-- Header -->
           <div class="grid grid-cols-3 gap-2 px-4 py-2 text-xs text-[var(--text-tertiary)] border-b border-[var(--border-color)] shrink-0 bg-[var(--bg-secondary)] font-medium">
               <div class="text-center">序号</div>
               <div class="text-center">当前时间</div>
               <div class="text-center">间隔</div>
           </div>

           <!-- Custom List -->
           <div class="flex-1 overflow-y-auto custom-scrollbar">
               <div 
                  v-for="lap in laps" 
                  :key="lap.index" 
                  class="grid grid-cols-3 gap-2 px-4 py-1.5 text-sm border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors items-center"
               >
                   <div class="text-center text-[var(--text-tertiary)] font-mono text-xs">{{ lap.index }}</div>
                   <div class="text-center text-[var(--text-primary)] font-mono">{{ lap.time }}</div>
                   <div class="text-center text-[var(--text-tertiary)] font-mono text-xs">+{{ lap.split }}</div>
               </div>
               
               <div v-if="laps.length === 0" class="h-full flex items-center justify-center text-[var(--text-tertiary)] text-xs">
                   暂无记录
               </div>
           </div>
        </div>

        <!-- Instructions -->
        <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-y-auto custom-scrollbar h-[300px] shrink-0 transition-colors duration-300">
            <h3 class="font-bold text-[var(--text-secondary)] mb-2 border-l-4 border-blue-500 pl-2 text-sm">使用说明</h3>
            <div class="text-xs text-[var(--text-tertiary)] space-y-1.5 leading-relaxed">
                <p>1、点击“开始”或按键盘“<span class="text-blue-400 font-bold">A</span>”启动。</p>
                <p>2、计时中点击“停止”或按键盘“<span class="text-blue-400 font-bold">A</span>”暂停。</p>
                <p>3、计时中点击“计次”或按键盘“<span class="text-blue-400 font-bold">S</span>”记录。</p>
                <p>4、点击“复位”或按键盘“<span class="text-blue-400 font-bold">C</span>”清空。</p>
            </div>
            
            <h3 class="font-bold text-gray-300 mt-4 mb-2 border-l-4 border-green-500 pl-2 text-sm">功能特性</h3>
            <ul class="list-disc list-inside text-xs text-gray-400 space-y-1">
                <li>高精度计时（毫秒级）</li>
                <li>计次数据自动保存到 SessionStorage</li>
                <li>页面刷新不丢失计次记录</li>
                <li>支持键盘快捷键操作</li>
            </ul>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Timer, VideoPlay, VideoPause, Flag, RefreshRight } from '@element-plus/icons-vue'

interface Lap {
    index: number
    time: string
    split: string
    rawTime: number
}

// State
const time = ref(0)
const isRunning = ref(false)
const laps = ref<Lap[]>([])
let timerInterval: number | null = null
let lastTime = 0 // Time when last lap was recorded (for split calc)
let startTime = 0 // Timestamp when timer started (adjusted for pauses)

// Session Storage Key
const SESSION_KEY = 'stopwatch_laps'

// Formatter
const formatTime = (ms: number): string => {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const milliseconds = ms % 1000

    const h = hours.toString().padStart(2, '0')
    const m = minutes.toString().padStart(2, '0')
    const s = seconds.toString().padStart(2, '0')
    const msStr = milliseconds.toString().padStart(3, '0')

    return `${h}:${m}:${s}.${msStr}`
}

const formattedTime = computed(() => formatTime(time.value))

// Actions
const startTimer = () => {
    if (isRunning.value) return
    
    isRunning.value = true
    const now = Date.now()
    // If resuming, adjust startTime so that (now - startTime) equals previously accumulated time
    startTime = now - time.value
    
    timerInterval = window.requestAnimationFrame(updateTimer)
}

const updateTimer = () => {
    if (!isRunning.value) return
    time.value = Date.now() - startTime
    timerInterval = window.requestAnimationFrame(updateTimer)
}

const stopTimer = () => {
    if (!isRunning.value) return
    isRunning.value = false
    if (timerInterval) {
        window.cancelAnimationFrame(timerInterval)
        timerInterval = null
    }
}

const toggleTimer = () => {
    if (isRunning.value) {
        stopTimer()
    } else {
        startTimer()
    }
}

const handleLap = () => {
    // Lap can be recorded even if stopped, as long as time > 0
    if (time.value === 0) return
    
    const currentRaw = time.value
    const splitRaw = currentRaw - lastTime
    lastTime = currentRaw
    
    const newLap: Lap = {
        index: laps.value.length + 1,
        time: formatTime(currentRaw),
        split: formatTime(splitRaw),
        rawTime: currentRaw
    }
    
    // Add to beginning of list
    laps.value.unshift(newLap)
    saveLaps()
}

const handleReset = () => {
    stopTimer()
    time.value = 0
    laps.value = []
    lastTime = 0
    clearSession()
}

// Session Storage
const saveLaps = () => {
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(laps.value))
    } catch (e) {
        console.error('Failed to save laps', e)
    }
}

const loadLaps = () => {
    try {
        const stored = sessionStorage.getItem(SESSION_KEY)
        if (stored) {
            laps.value = JSON.parse(stored)
            // If we have laps, user probably wants to see the last time?
            // But we don't store "current running time" in session easily without issues if page was closed.
            // The requirement says "store laps to sessionStore".
            // It doesn't explicitly say "restore running state".
            // However, if we reload, we might want to continue from last lap? 
            // Let's keep it simple: Restore laps history. Timer resets to 0 (or last lap time?).
            // If user refreshes, timer usually resets on simple web stopwatches.
            // But let's check if we have laps. If so, maybe set lastTime to the last lap's time?
            if (laps.value.length > 0) {
                 // laps[0] is the latest
                 const latest = laps.value[0]
                 if (latest) {
                     lastTime = latest.rawTime
                 }
                 // Ideally we don't change 'time' unless we persisted that too.
                 // Let's just restore the list.
            }
        }
    } catch (e) {
        console.error('Failed to load laps', e)
    }
}

const clearSession = () => {
    sessionStorage.removeItem(SESSION_KEY)
}

// Keyboard Handling
const handleKeydown = (e: KeyboardEvent) => {
    // Ignore if input focused
    if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return

    switch(e.code) {
        case 'KeyA':
            e.preventDefault()
            toggleTimer()
            break
        case 'KeyS':
            e.preventDefault()
            handleLap()
            break
        case 'KeyC':
            e.preventDefault()
            handleReset()
            break
    }
}

onMounted(() => {
    loadLaps()
    window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
    stopTimer()
    window.removeEventListener('keydown', handleKeydown)
})

</script>

<style scoped>
/* Custom Table Styles override */
/* No overrides needed as we use custom grid */
</style>