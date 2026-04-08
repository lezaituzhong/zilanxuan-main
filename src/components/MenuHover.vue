<script setup lang="ts">
import { useRouter } from 'vue-router'
import { 
  Tools, 
} from '@element-plus/icons-vue'
import ThemeToggle from './ThemeToggle.vue'
import { House, User, Link, Menu } from '@element-plus/icons-vue'

const router = useRouter()

function goHome() {
  router.push('/')
}
function goAbout() {
  router.push('/about')
}
function goTools() {
  router.push('/tools')
}
function goBlog() {
  window.open('https://blog.zilanxuan.cn', '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="fixed top-6 right-6 z-50 flex items-center gap-3">
    <!-- Theme Toggle -->
    <ThemeToggle class="bg-white/60 dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/10 shadow-lg !rounded-full" />
    
    <!-- Menu Button -->
    <div class="group relative">
      <button class="w-10 h-10 flex items-center justify-center rounded-full bg-white/60 dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/10 transition-all cursor-pointer shadow-lg">
        <el-icon :size="20"><Menu /></el-icon>
      </button>
      
      <!-- Dropdown Menu -->
      <div
        class="absolute right-0 top-full pt-2 w-56 opacity-0 translate-y-1 pointer-events-none transition duration-300 ease-out
               group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto"
      >
        <!-- Actual Menu Content -->
        <div class="rounded-xl backdrop-blur-md bg-white/80 dark:bg-black/60 border border-gray-200 dark:border-white/30 shadow-2xl overflow-hidden">
          <ul class="py-2 text-gray-800 dark:text-white">
            <li>
              <button class="w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center gap-3" @click="goHome">
                <el-icon :size="18"><House /></el-icon> <span>首页</span>
              </button>
            </li>
            <li>
              <button class="w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center gap-3" @click="goAbout">
                <el-icon :size="18"><User /></el-icon> <span>关于</span>
              </button>
            </li>
            <li>
              <button class="w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center gap-3" @click="goTools">
                <el-icon :size="18"><Tools /></el-icon> <span>工具</span>
              </button>
            </li>
            <li>
              <button class="w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center gap-3" @click="goBlog">
                <el-icon :size="18"><Link /></el-icon> <span>博客</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  </template>

<style scoped>
</style>

