<script setup lang="ts">
import ThreeBackground from '../components/ThreeBackground.vue'
import Banner from '../components/Banner.vue'
import { Monitor, Notebook, Platform, ArrowRight, Brush } from '@element-plus/icons-vue'
</script>

<template>
  <main class="relative w-full overflow-x-hidden text-[var(--text-primary)] transition-colors duration-500">
    <ThreeBackground />
    
    <Banner />

    <!-- About Section -->
    <section class="relative container mx-auto px-6 py-32 z-10" data-aos="fade-up">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div class="space-y-8">
          <div class="inline-block px-4 py-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 backdrop-blur-sm text-sm tracking-widest uppercase text-gray-500 dark:text-gray-400 mb-4">
            About Me
          </div>
          <h2 class="text-4xl md:text-5xl font-bold leading-tight">
            融合艺术与技术的<br>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">数字工匠</span>
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-300 leading-loose">
            欢迎来到紫兰轩。这里是我的数字花园，我致力于探索 Vue 3 生态的无限可能，打造流畅、沉浸且富有美感的 Web 体验。
            <br><br>
            每一行代码都是逻辑的诗篇，每一个像素都是设计的注脚。在这里，我记录成长的轨迹，分享灵感的火花。
          </p>
          <div class="flex gap-4 pt-4">
             <a href="#gallery" class="px-8 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-semibold hover:opacity-80 transition-opacity shadow-lg hover:shadow-xl">
               查看作品
             </a>
             <router-link to="/about" class="px-8 py-3 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 backdrop-blur-sm">
               了解更多 <el-icon><ArrowRight /></el-icon>
             </router-link>
          </div>
        </div>
        
        <div class="relative group">
          <div class="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <div class="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            <img 
              src="https://picsum.photos/id/180/800/600" 
              alt="Workspace" 
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
               <div class="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                 <p class="text-white/80 text-sm tracking-wider uppercase mb-2">Philosophy</p>
                 <span class="text-white text-2xl font-bold">
                   专注 · 创造 · 极致
                 </span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Parallax Divider -->
    <section class="relative h-[400px] bg-fixed bg-center bg-cover flex items-center justify-center overflow-hidden" 
             style="background-image: url('https://picsum.photos/id/16/1920/600');">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
      <div class="relative z-10 text-center text-white px-4 max-w-4xl" data-aos="zoom-in">
        <h2 class="text-4xl md:text-6xl font-bold mb-6 tracking-tight">设计与技术的交响</h2>
        <div class="w-20 h-1 bg-white mx-auto mb-6"></div>
        <p class="text-xl md:text-2xl font-light opacity-90 tracking-widest uppercase">Design & Technology Symphony</p>
      </div>
    </section>

    <!-- Tech Stack Section -->
    <section class="py-32 relative overflow-hidden">
      <!-- Background Decorations -->
      <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full filter blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full filter blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

      <div class="container mx-auto px-6 relative z-10">
        <div class="text-center mb-20" data-aos="fade-down">
          <h2 class="text-3xl font-bold mb-4">技术栈</h2>
          <p class="text-gray-500 dark:text-gray-400">构建现代 Web 应用的核心工具</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="(tech, index) in ['Vue 3', 'TypeScript', 'Three.js', 'Tailwind CSS']" :key="index" 
               class="group p-8 rounded-2xl bg-[var(--bg-secondary)]/80 backdrop-blur-md border border-[var(--border-color)] hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl relative overflow-hidden"
               data-aos="fade-up"
               :data-aos-delay="index * 100">
            <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <el-icon :size="80" class="text-current"><Monitor /></el-icon>
            </div>
            
            <div class="h-14 w-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-6 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
               <el-icon :size="28"><component :is="index === 3 ? Brush : Monitor" /></el-icon>
            </div>
            
            <h3 class="text-xl font-bold mb-3">{{ tech }}</h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              {{ tech === 'Vue 3' ? '渐进式 JavaScript 框架，构建用户界面的利器。' : 
                 tech === 'TypeScript' ? 'JavaScript 的超集，提供静态类型检查。' :
                 tech === 'Three.js' ? '基于 WebGL 的 3D 库，创造沉浸式体验。' :
                 '功能类优先的 CSS 框架，快速构建现代设计。' }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Gallery Section (Masonry Style) -->
    <section id="gallery" class="py-32 bg-[var(--bg-secondary)]/30 backdrop-blur-sm transition-colors duration-500">
      <div class="container mx-auto px-6">
        <div class="flex justify-between items-end mb-16" data-aos="fade-right">
          <div>
            <h2 class="text-3xl font-bold mb-2">视觉画廊</h2>
            <p class="text-gray-500 dark:text-gray-400">捕捉光影与色彩的瞬间</p>
          </div>
          <el-button link class="hidden md:flex">查看更多 <el-icon class="ml-1"><ArrowRight /></el-icon></el-button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
          <!-- Large Item -->
          <div class="md:col-span-2 md:row-span-2 relative rounded-2xl overflow-hidden group cursor-pointer shadow-lg" data-aos="fade-up">
            <img src="https://picsum.photos/id/12/800/600" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Gallery 1">
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 text-center">
              <h3 class="text-white text-2xl font-bold mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">探索未知</h3>
              <p class="text-gray-200 text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">Discovery</p>
            </div>
          </div>

          <!-- Small Items -->
          <div class="relative rounded-2xl overflow-hidden group cursor-pointer shadow-lg" data-aos="fade-left" data-aos-delay="100">
            <img src="https://picsum.photos/id/28/400/300" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Gallery 2">
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span class="text-white font-bold border-b border-white pb-1">自然之美</span>
            </div>
          </div>

          <div class="relative rounded-2xl overflow-hidden group cursor-pointer shadow-lg" data-aos="fade-left" data-aos-delay="200">
            <img src="https://picsum.photos/id/42/400/300" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Gallery 3">
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span class="text-white font-bold border-b border-white pb-1">时光印记</span>
            </div>
          </div>

          <!-- Wide Item -->
          <div class="md:col-span-3 relative rounded-2xl overflow-hidden group cursor-pointer shadow-lg" data-aos="fade-up" data-aos-delay="300">
            <img src="https://picsum.photos/id/56/1200/400" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Gallery 4">
             <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
              <div>
                <h3 class="text-white text-xl font-bold mb-1">广阔天地</h3>
                <p class="text-gray-300 text-sm">The Wide World</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- External Links Section -->
    <section class="container mx-auto px-6 py-32" data-aos="fade-up">
      <h2 class="text-3xl font-bold mb-12 text-center">连接世界</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <a href="https://blog.zilanxuan.cn" target="_blank" rel="noopener noreferrer"
           class="group relative h-80 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
          <img src="https://picsum.photos/id/119/400/300" alt="Blog" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-8 flex flex-col justify-end">
            <div class="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 border border-white/20 group-hover:scale-110 transition-transform">
              <el-icon :size="24" class="text-white"><Notebook /></el-icon>
            </div>
            <h3 class="text-2xl font-bold text-white mb-2">个人博客</h3>
            <p class="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
              分享技术见解与生活感悟，记录成长的每一个脚印。
            </p>
          </div>
        </a>

        <a href="https://www.zilanxuan.cn" target="_blank" rel="noopener noreferrer"
           class="group relative h-80 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
          <img src="https://picsum.photos/id/201/400/300" alt="Website" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-8 flex flex-col justify-end">
            <div class="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 border border-white/20 group-hover:scale-110 transition-transform">
              <el-icon :size="24" class="text-white"><Monitor /></el-icon>
            </div>
            <h3 class="text-2xl font-bold text-white mb-2">官方网站</h3>
            <p class="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
              zilanxuan.cn - 展示我的数字作品集。
            </p>
          </div>
        </a>

        <a href="https://github.com/zilanxuan" target="_blank" rel="noopener noreferrer"
           class="group relative h-80 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
          <img src="https://picsum.photos/id/0/400/300" alt="GitHub" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-8 flex flex-col justify-end">
            <div class="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 border border-white/20 group-hover:scale-110 transition-transform">
              <el-icon :size="24" class="text-white"><Platform /></el-icon>
            </div>
            <h3 class="text-2xl font-bold text-white mb-2">GitHub</h3>
            <p class="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
              开源贡献与代码仓库，欢迎 Star 和 Fork。
            </p>
          </div>
        </a>
      </div>
    </section>

  </main>
</template>

<style scoped>
/* Add any custom styles here if Tailwind isn't enough */
</style>
