import { defineStore } from 'pinia'
import { ref } from 'vue'

function applyTheme(dark: boolean) {
    if (dark) {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
}

export const useThemeStore = defineStore('theme', () => {
    const isDark = ref(localStorage.getItem('dezpay_theme') === 'dark')

    // Apply saat pertama kali store dibuat
    applyTheme(isDark.value)

    function toggle() {
        isDark.value = !isDark.value
        applyTheme(isDark.value)
        localStorage.setItem('dezpay_theme', isDark.value ? 'dark' : 'light')
    }

    return { isDark, toggle }
})
