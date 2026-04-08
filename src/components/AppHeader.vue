<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMainStore } from '../stores/main'

const router = useRouter()
const route = useRoute()
const store = useMainStore()

const active = computed(() => {
  if (route.path.startsWith('/about')) return 'about'
  return 'home'
})

function onNavigate(index: string) {
  if (index === 'home') router.push('/')
  else if (index === 'about') router.push('/about')
  else if (index === 'blog') window.open('https://blog.zilanxuan.cn', '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <header class="fixed top-0 left-0 w-full z-50">
    <div class="mx-auto px-4">
      <nav class="mt-4 rounded-2xl backdrop-blur bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 shadow-lg">
        <div class="flex items-center justify-between px-4 py-2">
          <div class="flex items-center gap-3">
            <img src="/logo.png" class="h-8 w-8" alt="logo" />
            <span class="font-semibold tracking-wider text-white">紫兰轩</span>
          </div>

          <ul class="hidden md:flex items-center gap-6 text-white">
            <li>
              <button
                :class="['px-3 py-2 rounded-lg transition', active === 'home' ? 'bg-white/20' : 'hover:bg-white/10']"
                @click="onNavigate('home')"
              >
                首页
              </button>
            </li>
            <li>
              <button
                :class="['px-3 py-2 rounded-lg transition', active === 'about' ? 'bg-white/20' : 'hover:bg-white/10']"
                @click="onNavigate('about')"
              >
                关于
              </button>
            </li>
            <li>
              <button
                class="px-3 py-2 rounded-lg transition hover:bg-white/10"
                @click="onNavigate('blog')"
              >
                博客
              </button>
            </li>
          </ul>

          <button
            class="md:hidden p-2 rounded-lg text-white hover:bg-white/10"
            @click="store.toggleTheme()"
            aria-label="切换主题"
          >
            <el-icon v-if="store.isDarkMode"><Moon /></el-icon>
            <el-icon v-else><Sunny /></el-icon>
          </button>
        </div>
      </nav>
    </div>
  </header>
</template>

<style scoped>
</style>

