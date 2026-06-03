<template>
  <div class="max-w-md mx-auto space-y-4 pb-4">
    <!-- Header profil -->
    <div class="flex items-center gap-4 py-2">
      <div class="h-16 w-16 rounded-3xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-2xl shrink-0">
        {{ initial }}
      </div>
      <div>
        <h1 class="text-xl font-bold text-gray-900">{{ authStore.user?.name }}</h1>
        <p class="text-sm text-gray-400">{{ authStore.user?.email }}</p>
      </div>
    </div>

    <!-- Menu items -->
    <div class="card divide-y divide-gray-50 !p-0 overflow-hidden">
      <RouterLink v-for="item in menuItems" :key="item.to" :to="item.to"
                  class="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
        <div class="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
             :style="{ background: item.bg }">
          <component :is="item.icon" class="h-5 w-5" :style="{ color: item.color }" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold text-gray-800">{{ item.label }}</p>
          <p class="text-xs text-gray-400">{{ item.desc }}</p>
        </div>
        <ChevronRightIcon class="h-4 w-4 text-gray-300" />
      </RouterLink>
    </div>

    <!-- App info -->
    <div class="text-center py-2">
      <p class="text-xs text-gray-300 font-medium">DezPay v1.0</p>
    </div>

    <!-- Tombol Keluar -->
    <button @click="handleLogout"
            class="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-100 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors">
      <ArrowRightOnRectangleIcon class="h-5 w-5" />
      Keluar dari Akun
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import {
  UserCircleIcon, ShieldCheckIcon, DocumentTextIcon,
  Cog6ToothIcon, ChevronRightIcon, ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const router = useRouter()

const initial = computed(() => authStore.user?.name?.charAt(0).toUpperCase() ?? 'U')

const menuItems = [
  {
    to: '/profile/info',
    label: 'Profil',
    desc: 'Informasi akun & data diri',
    icon: UserCircleIcon,
    bg: '#EDE9FE',
    color: '#7C3AED',
  },
  {
    to: '/profile/security',
    label: 'Keamanan Akun',
    desc: 'Password & PIN transaksi',
    icon: ShieldCheckIcon,
    bg: '#ECFDF5',
    color: '#10B981',
  },
  {
    to: '/profile/statement',
    label: 'E-Statement',
    desc: 'Riwayat mutasi saldo',
    icon: DocumentTextIcon,
    bg: '#EFF6FF',
    color: '#3B82F6',
  },
  {
    to: '/profile/settings',
    label: 'Pengaturan',
    desc: 'Preferensi aplikasi',
    icon: Cog6ToothIcon,
    bg: '#FFF7ED',
    color: '#F59E0B',
  },
]

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>
