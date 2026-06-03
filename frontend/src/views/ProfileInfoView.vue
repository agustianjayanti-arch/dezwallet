<template>
  <div class="max-w-md mx-auto space-y-5">
    <div class="flex items-center gap-3">
      <RouterLink to="/profile" class="p-2 rounded-xl hover:bg-gray-100 transition-colors">
        <ChevronLeftIcon class="h-5 w-5 text-gray-500" />
      </RouterLink>
      <h1 class="page-header">Profil</h1>
    </div>

    <div class="card space-y-4">
      <div class="flex flex-col items-center py-4">
        <div class="h-20 w-20 rounded-3xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-3xl mb-3">
          {{ initial }}
        </div>
        <p class="font-bold text-gray-900">{{ authStore.user?.name }}</p>
        <p class="text-sm text-gray-400">{{ authStore.user?.email }}</p>
      </div>
      <div class="divide-y divide-gray-50">
        <div class="flex justify-between py-3">
          <span class="text-sm text-gray-400">Nama Lengkap</span>
          <span class="text-sm font-semibold text-gray-800">{{ authStore.user?.name }}</span>
        </div>
        <div class="flex justify-between py-3">
          <span class="text-sm text-gray-400">Email</span>
          <span class="text-sm font-semibold text-gray-800">{{ authStore.user?.email }}</span>
        </div>
        <div class="flex justify-between py-3">
          <span class="text-sm text-gray-400">ID Pengguna</span>
          <span class="text-xs font-mono text-gray-500">{{ authStore.user?.id }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { ChevronLeftIcon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const initial = computed(() => authStore.user?.name?.charAt(0).toUpperCase() ?? 'U')
</script>
