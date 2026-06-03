<template>
  <div class="max-w-md mx-auto space-y-5">
    <div class="flex items-center gap-3">
      <RouterLink to="/profile" class="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <ChevronLeftIcon class="h-5 w-5 text-gray-500" />
      </RouterLink>
      <h1 class="page-header">Pengaturan</h1>
    </div>

    <div class="card divide-y divide-gray-50 dark:divide-gray-700 !p-0 overflow-hidden">

      <!-- Dark mode -->
      <div class="flex items-center justify-between px-5 py-4">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-xl flex items-center justify-center"
               :class="themeStore.isDark ? 'bg-gray-800' : 'bg-amber-50'">
            <component :is="themeStore.isDark ? MoonIcon : SunIcon"
                       class="h-5 w-5"
                       :class="themeStore.isDark ? 'text-violet-400' : 'text-amber-500'" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-800 dark:text-white">Tema Gelap</p>
            <p class="text-xs text-gray-400">{{ themeStore.isDark ? 'Aktif' : 'Nonaktif' }}</p>
          </div>
        </div>
        <!-- Toggle switch -->
        <button @click="themeStore.toggle()"
                class="w-12 h-6 rounded-full transition-colors relative focus:outline-none"
                :class="themeStore.isDark ? 'bg-violet-500' : 'bg-gray-200'">
          <span class="absolute top-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform duration-200"
                :class="themeStore.isDark ? 'translate-x-6' : 'translate-x-0.5'" />
        </button>
      </div>

      <!-- Notifikasi -->
      <div class="flex items-center justify-between px-5 py-4">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
            <BellIcon class="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-800 dark:text-white">Notifikasi</p>
            <p class="text-xs text-gray-400">Terima notifikasi transaksi</p>
          </div>
        </div>
        <button @click="notif = !notif"
                class="w-12 h-6 rounded-full transition-colors relative"
                :class="notif ? 'bg-violet-500' : 'bg-gray-200'">
          <span class="absolute top-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform duration-200"
                :class="notif ? 'translate-x-6' : 'translate-x-0.5'" />
        </button>
      </div>

      <!-- Bahasa -->
      <div class="flex items-center justify-between px-5 py-4">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <GlobeAltIcon class="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-800 dark:text-white">Bahasa</p>
            <p class="text-xs text-gray-400">Indonesia</p>
          </div>
        </div>
        <ChevronRightIcon class="h-4 w-4 text-gray-300" />
      </div>
    </div>

    <div class="text-center py-2">
      <p class="text-xs text-gray-300 dark:text-gray-600">DezPay v1.0.0 · © 2024</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useThemeStore } from '@/stores/themeStore'
import {
  ChevronLeftIcon, ChevronRightIcon,
  MoonIcon, SunIcon, BellIcon, GlobeAltIcon,
} from '@heroicons/vue/24/outline'

const themeStore = useThemeStore()
const notif = ref(true)
</script>
