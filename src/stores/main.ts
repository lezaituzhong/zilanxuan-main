import { defineStore } from 'pinia'

export const useMainStore = defineStore('main', {
  state: () => ({
    isDarkMode: false,
  }),
  actions: {
    toggleTheme() {
      this.isDarkMode = !this.isDarkMode
      if (this.isDarkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }
})
