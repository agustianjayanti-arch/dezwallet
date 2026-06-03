<template>
  <div class="min-h-screen bg-surface dark:bg-gray-950">

    <!-- ── Desktop Sidebar ─────────────────────────────────────────────────── -->
    <aside class="hidden lg:flex w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-col fixed h-full z-30">
      <div class="px-6 py-6 border-b border-gray-50 dark:border-gray-800">
        <span class="text-2xl font-extrabold text-violet-600">Dez<span class="text-gray-800 dark:text-white">Pay</span></span>
      </div>
      <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all"
                    :class="isActive(item.to)
                      ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-semibold'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-white'">
          <div class="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
               :class="isActive(item.to) ? 'bg-violet-100 dark:bg-violet-800 text-violet-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'">
            <component :is="item.icon" class="h-4 w-4" />
          </div>
          {{ item.label }}
        </RouterLink>
      </nav>
      <div class="px-3 py-4 border-t border-gray-50 dark:border-gray-800">
        <RouterLink to="/profile"
                    class="flex items-center gap-3 px-3 py-2 rounded-2xl bg-gray-50 dark:bg-gray-800 mb-2 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors">
          <div class="h-9 w-9 rounded-xl bg-violet-100 dark:bg-violet-800 flex items-center justify-center text-violet-700 dark:text-violet-300 font-bold text-sm shrink-0">
            {{ userInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-800 dark:text-white truncate">{{ authStore.user?.name }}</p>
            <p class="text-xs text-gray-400 truncate">{{ authStore.user?.email }}</p>
          </div>
        </RouterLink>
        <button @click="handleLogout"
                class="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-colors">
          <ArrowRightOnRectangleIcon class="h-4 w-4" /> Keluar
        </button>
      </div>
    </aside>

    <!-- ── Mobile Top Bar ──────────────────────────────────────────────────── -->
    <header class="lg:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
      <span class="text-xl font-extrabold text-violet-600">Dez<span class="text-gray-800 dark:text-white">Pay</span></span>
      <NotificationBell />
    </header>

    <!-- ── Main content ────────────────────────────────────────────────────── -->
    <div class="lg:ml-64 flex flex-col min-h-screen">
      <header class="hidden lg:flex bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-3.5 items-center justify-end sticky top-0 z-20">
        <NotificationBell />
      </header>
      <main class="flex-1 p-4 lg:p-8 pb-28 lg:pb-8">
        <RouterView />
      </main>
    </div>

    <!-- ── Mobile Bottom Nav ──────────────────────────────────────────────── -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 z-30 safe-area-bottom">
      <div class="flex items-end justify-around px-2 py-1">

        <!-- Home -->
        <RouterLink to="/dashboard"
                    class="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all"
                    :class="isActive('/dashboard') ? 'text-violet-600' : 'text-gray-400 dark:text-gray-500'">
          <HomeIcon class="h-5 w-5" :class="isActive('/dashboard') ? 'stroke-2' : 'stroke-[1.5]'" />
          <span class="text-[10px] font-semibold">Home</span>
        </RouterLink>

        <!-- Transfer -->
        <RouterLink to="/transfer"
                    class="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all"
                    :class="isActive('/transfer') ? 'text-violet-600' : 'text-gray-400 dark:text-gray-500'">
          <ArrowsRightLeftIcon class="h-5 w-5" :class="isActive('/transfer') ? 'stroke-2' : 'stroke-[1.5]'" />
          <span class="text-[10px] font-semibold">Transfer</span>
        </RouterLink>

        <!-- QR — besar di tengah, floating -->
        <RouterLink to="/qr" class="flex flex-col items-center -mt-5">
          <div class="h-14 w-14 rounded-2xl shadow-lg flex items-center justify-center transition-transform active:scale-90"
               :class="isActive('/qr')
                 ? 'bg-violet-600 shadow-violet-200'
                 : 'bg-gray-900 dark:bg-violet-600 shadow-gray-200 dark:shadow-violet-200'">
            <QrCodeIcon class="h-7 w-7 text-white stroke-2" />
          </div>
          <span class="text-[10px] font-semibold mt-1"
                :class="isActive('/qr') ? 'text-violet-600' : 'text-gray-400 dark:text-gray-500'">QR</span>
        </RouterLink>

        <!-- Request -->
        <RouterLink to="/requests"
                    class="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all"
                    :class="isActive('/requests') ? 'text-violet-600' : 'text-gray-400 dark:text-gray-500'">
          <HandRaisedIcon class="h-5 w-5" :class="isActive('/requests') ? 'stroke-2' : 'stroke-[1.5]'" />
          <span class="text-[10px] font-semibold">Request</span>
        </RouterLink>

        <!-- Saya -->
        <RouterLink to="/profile"
                    class="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all"
                    :class="isActive('/profile') ? 'text-violet-600' : 'text-gray-400 dark:text-gray-500'">
          <UserCircleIcon class="h-5 w-5" :class="isActive('/profile') ? 'stroke-2' : 'stroke-[1.5]'" />
          <span class="text-[10px] font-semibold">Saya</span>
        </RouterLink>

      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import NotificationBell from '@/components/common/NotificationBell.vue'
import {
  HomeIcon, ArrowsRightLeftIcon, QrCodeIcon,
  HandRaisedIcon, UserCircleIcon, ArrowRightOnRectangleIcon,
  WalletIcon, PlusCircleIcon, BellIcon,
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// Desktop sidebar — lengkap
const navItems = [
  { to: '/dashboard',     label: 'Dashboard',  icon: HomeIcon },
  { to: '/wallet',        label: 'Wallet',      icon: WalletIcon },
  { to: '/transfer',      label: 'Transfer',    icon: ArrowsRightLeftIcon },
  { to: '/topup',         label: 'Top Up',      icon: PlusCircleIcon },
  { to: '/qr',            label: 'QR Code',     icon: QrCodeIcon },
  { to: '/requests',      label: 'Request',     icon: HandRaisedIcon },
  { to: '/notifications', label: 'Notifikasi',  icon: BellIcon },
  { to: '/profile',       label: 'Saya',        icon: UserCircleIcon },
]

const userInitial = computed(() => authStore.user?.name?.charAt(0).toUpperCase() ?? 'U')

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>
