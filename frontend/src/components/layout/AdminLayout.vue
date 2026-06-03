<template>
  <div class="min-h-screen bg-gray-50 flex">
    <aside class="w-64 bg-gray-900 text-white flex flex-col fixed h-full z-30">
      <div class="px-6 py-5 border-b border-gray-700">
        <span class="text-xl font-bold text-white">DezPay <span class="text-yellow-400 text-sm font-normal">Admin</span></span>
      </div>
      <nav class="flex-1 px-4 py-4 space-y-1">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    :class="route.path.startsWith(item.to)
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'">
          <span>{{ item.icon }}</span>{{ item.label }}
        </RouterLink>
      </nav>
      <div class="px-4 py-4 border-t border-gray-700">
        <button @click="handleLogout"
                class="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-800 rounded-lg transition-colors">
          Keluar
        </button>
      </div>
    </aside>
    <div class="flex-1 ml-64">
      <header class="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-20">
        <h1 class="text-lg font-semibold text-gray-800">Admin Panel</h1>
      </header>
      <main class="p-6"><RouterView /></main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/users', label: 'Pengguna', icon: '👥' },
  { to: '/admin/transactions', label: 'Transaksi', icon: '💳' },
  { to: '/admin/topups', label: 'Top Up', icon: '✅' },
  { to: '/admin/notifications/send', label: 'Kirim Notifikasi', icon: '📣' },
  { to: '/admin/audit-logs', label: 'Audit Log', icon: '📋' },
]

function handleLogout() {
  localStorage.removeItem('dezpay_admin_token')
  localStorage.removeItem('dezpay_admin')
  router.push('/admin/login')
}
</script>
