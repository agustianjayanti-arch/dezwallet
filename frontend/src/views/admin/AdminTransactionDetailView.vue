<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <RouterLink to="/admin/transactions" class="text-gray-400 hover:text-gray-600">← Kembali</RouterLink>
      <h1 class="text-2xl font-bold text-gray-800">Detail Transaksi</h1>
    </div>

    <LoadingSpinner v-if="loading" />
    <template v-else-if="data">
      <div class="card space-y-3">
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">ID</span>
          <span class="font-mono text-gray-700">{{ data.transaction.id }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Tipe</span>
          <span class="badge-info">{{ data.transaction.type }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Jumlah</span>
          <span class="font-semibold">{{ formatCurrency(data.transaction.amount) }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Status</span>
          <span :class="data.transaction.status === 'success' ? 'badge-success' : 'badge-warning'">{{ data.transaction.status }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Waktu</span>
          <span>{{ formatDate(data.transaction.created_at) }}</span>
        </div>
      </div>

      <div class="card">
        <h2 class="font-semibold text-gray-800 mb-4">Ledger Entries</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 text-left text-gray-500">
                <th class="pb-2 font-medium">Akun</th>
                <th class="pb-2 font-medium">Tipe</th>
                <th class="pb-2 font-medium">Jumlah</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="e in data.ledgerEntries" :key="e.id">
                <td class="py-2 text-gray-600">{{ e.account_name }}</td>
                <td class="py-2">
                  <span :class="e.entry_type === 'debit' ? 'badge-danger' : 'badge-success'">{{ e.entry_type }}</span>
                </td>
                <td class="py-2 font-medium">{{ formatCurrency(e.amount) }}</td>
              </tr>
            </tbody>
          </table>
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
    const res = await adminApi.getTransactionDetail(route.params.id as string)
    data.value = res.data.data
  } finally { loading.value = false }
})

function formatCurrency(n: string | number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n))
}
function formatDate(ts: string) {
  return new Date(ts).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}
</script>
