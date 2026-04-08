import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import AOS from 'aos'
import 'aos/dist/aos.css'

import './style.css'
import './assets/base.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// Register Icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// Initialize AOS
AOS.init({
  duration: 800,
  easing: 'ease-in-out',
  once: false,
  mirror: false
})

app.mount('#app')
