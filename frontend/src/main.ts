import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

// Register service worker untuk PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then(reg => console.log('✓ Service Worker registered:', reg.scope))
            .catch(err => console.error('✗ Service Worker registration failed:', err))
    })
}

// Apply theme sebelum mount untuk hindari flash
const savedTheme = localStorage.getItem('dezpay_theme')
if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark')
} else {
    document.documentElement.classList.remove('dark')
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
