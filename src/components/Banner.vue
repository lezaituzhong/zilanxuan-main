<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowDown } from '@element-plus/icons-vue'

gsap.registerPlugin(ScrollTrigger)

const bannerRef = ref<HTMLElement | null>(null)
const bgImageRef = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const subtitleRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

const handleMouseMove = (e: MouseEvent) => {
  if (!contentRef.value) return
  const { clientX, clientY } = e
  const x = (clientX / window.innerWidth - 0.5) * 20
  const y = (clientY / window.innerHeight - 0.5) * 20
  
  gsap.to(contentRef.value, {
    x: x,
    y: y,
    duration: 1,
    ease: 'power2.out'
  })
}

onMounted(() => {
  const tl = gsap.timeline()

  // Initial Animation
  tl.from(bgImageRef.value, {
    scale: 1.1,
    duration: 2,
    ease: 'power2.out'
  })
  .from(titleRef.value, {
    y: 100,
    opacity: 0,
    duration: 1.2,
    ease: 'power3.out',
    letterSpacing: '0.5em'
  }, '-=1.5')
  .from(subtitleRef.value, {
    y: 50,
    opacity: 0,
    duration: 1,
    ease: 'power3.out'
  }, '-=0.8')

  // Scroll Parallax
  if (bannerRef.value && bgImageRef.value) {
    gsap.to(bgImageRef.value, {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: bannerRef.value,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    })
  }

  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  ScrollTrigger.getAll().forEach(t => t.kill())
})
</script>

<template>
  <div ref="bannerRef" class="relative w-full h-screen flex items-center justify-center overflow-hidden bg-black">
    <!-- Background Image with Overlay -->
    <div ref="bgImageRef" class="absolute inset-0 z-0 will-change-transform">
      <img 
        src="/banner.webp" 
        alt="Banner" 
        class="w-full h-full object-cover opacity-80"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60"></div>
    </div>

    <!-- Content -->
    <div ref="contentRef" class="relative z-10 text-center text-white px-4">
      <h1 ref="titleRef" class="text-6xl md:text-8xl font-bold mb-6 tracking-widest text-shadow-lg mix-blend-overlay">
        紫兰轩
      </h1>
      <p ref="subtitleRef" class="text-xl md:text-2xl font-light tracking-[0.5em] text-gray-200 uppercase">
        Explore · Create · Experience
      </p>
    </div>
    
    <!-- Scroll Down Indicator -->
    <div class="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/80">
      <el-icon :size="32" class="opacity-80"><ArrowDown /></el-icon>
    </div>
  </div>
</template>

<style scoped>
.text-shadow-lg {
  text-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
</style>
