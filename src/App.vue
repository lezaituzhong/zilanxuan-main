<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useTheme } from './composables/useTheme'
import MenuHover from './components/MenuHover.vue'

const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
})
</script>

<template>
  <div class="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
    <MenuHover />
    <RouterView />
  </div>
</template>

<style>
/* Global transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
