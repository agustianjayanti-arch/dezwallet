<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">Dashboard Admin</h1>

    <LoadingSpinner v-if="loading" />
    <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="stat in stats" :key="stat.label" class="card">
        <p class="text-sm text-gray-500">{{ stat.label }}</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ stat.value }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-800">Top Up Pending</h2>
          <RouterLink to="/admin/topups" class="text-sm text-primary-600 hover:underline">Lihat semua</RouterLink>
        </div>
        <p class="text-3xl font-bold text-orange-500">{{ data?.pendingTopUps ?? 0 }}</p>
        <p class="text-sm text-gray-400 mt-1">Menunggu persetujuan</p>
      </div>
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-800">Pengguna Aktif</h2>
          <RouterLink to="/admin/users" class="text-sm text-primary-600 hover:underline">Kelola</RouterLink>
        </div>
        <p class="text-3xl font-bold text-green-500">{{ data?.activeUsers ?? 0 }}</p>
        <p class="text-sm text-gray-400 mt-1">Akun aktif</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { adminApi } from '@/api/admin'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const loading = ref(false)
const data = ref<{ totalTransactions: number; totalTransferVolume: number; activeUsers: number; pendingTopUps: number } | null>(null)

const stats = computed(() => [
  { label: 'Total Transaksi', value: data.value?.totalTransactions.toLocaleString('id-ID') ?? '0' },
  { label: 'Volume Transfer', value: data.value ? `Rp${(data.value.totalTransferVolume / 1_000_000).toFixed(1)}jt` : '0' },
  { label: 'Pengguna Aktif', value: data.value?.activeUsers.toLocaleString('id-ID') ?? '0' },
  { label: 'Top Up Pending', value: data.value?.pendingTopUps.toLocaleString('id-ID') ?? '0' },
])

onMounted(async () => {
  loading.value = true
  try {
    const res = await adminApi.getStats()
    data.value = res.data.data
  } finally { loading.value = false }
})
</script>
