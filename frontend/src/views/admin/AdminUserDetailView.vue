<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <RouterLink to="/admin/users" class="text-gray-400 hover:text-gray-600">← Kembali</RouterLink>
      <h1 class="text-2xl font-bold text-gray-800">Detail Pengguna</h1>
    </div>

    <LoadingSpinner v-if="loading" />
    <template v-else-if="data">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card">
          <div class="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-700 mb-4">
            {{ data.user.name.charAt(0) }}
          </div>
          <h2 class="font-semibold text-gray-800">{{ data.user.name }}</h2>
          <p class="text-sm text-gray-500">{{ data.user.email }}</p>
          <span :class="data.user.status === 'active' ? 'badge-success' : 'badge-danger'" class="mt-2 inline-block">
            {{ data.user.status }}
          </span>
          <p class="text-xs text-gray-400 mt-2">Bergabung: {{ formatDate(data.user.created_at) }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-500">Saldo Wallet</p>
          <p class="text-3xl font-bold text-primary-600 mt-1">{{ formatCurrency(data.wallet?.balance ?? 0) }}</p>
        </div>
      </div>

      <div class="card">
        <h2 class="font-semibold text-gray-800 mb-4">Transaksi Terbaru</h2>
        <div v-if="data.recentTransactions.length === 0" class="text-gray-400 text-sm">Belum ada transaksi</div>
        <div v-else class="divide-y divide-gray-50">
          <div v-for="tx in data.recentTransactions" :key="tx.id" class="flex justify-between py-3 text-sm">
            <div>
              <span class="font-medium text-gray-700">{{ tx.type }}</span>
              <span class="text-gray-400 ml-2">{{ formatDate(tx.created_at) }}</span>
            </div>
            <div class="text-right">
              <span class="font-semibold">{{ formatCurrency(tx.amount) }}</span>
              <span :class="tx.status === 'success' ? 'badge-success' : 'badge-warning'" class="ml-2">{{ tx.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { adminApi } from '@/api/admin'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const loading = ref(false)
const data = ref<any>(null)

onMounted(async () => {
  loading.value = true
  try {
    const res = await adminApi.getUserDetail(route.params.id as string)
    data.value = res.data.data
  } finally { loading.value = false }
})

function formatCurrency(n: string | number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n))
}
function formatDate(ts: string) {
  return new Date(ts).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
}
</script>
