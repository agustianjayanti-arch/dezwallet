<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">Monitoring Transaksi</h1>

    <div class="card">
      <!-- Filters -->
      <div class="flex flex-wrap gap-3 mb-4">
        <select v-model="filters.type" @change="load" class="input-field w-auto text-sm">
          <option value="">Semua Tipe</option>
          <option value="transfer">Transfer</option>
          <option value="topup">Top Up</option>
          <option value="qr_payment">QR Payment</option>
          <option value="money_request">Request Money</option>
        </select>
        <select v-model="filters.status" @change="load" class="input-field w-auto text-sm">
          <option value="">Semua Status</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <input v-model="filters.startDate" @change="load" type="date" class="input-field w-auto text-sm" />
        <input v-model="filters.endDate" @change="load" type="date" class="input-field w-auto text-sm" />
      </div>

      <LoadingSpinner v-if="loading" size="sm" />
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 text-left text-gray-500">
              <th class="pb-3 font-medium">ID</th>
              <th class="pb-3 font-medium">Tipe</th>
              <th class="pb-3 font-medium">Jumlah</th>
              <th class="pb-3 font-medium">Status</th>
              <th class="pb-3 font-medium">Waktu</th>
              <th class="pb-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="tx in transactions" :key="tx.id" class="hover:bg-gray-50">
              <td class="py-3 font-mono text-xs text-gray-400">{{ tx.id.slice(0, 8) }}...</td>
              <td class="py-3"><span class="badge-info">{{ tx.type }}</span></td>
              <td class="py-3 font-medium">{{ formatCurrency(tx.amount) }}</td>
              <td class="py-3">
                <span :class="tx.status === 'success' ? 'badge-success' : tx.status === 'pending' ? 'badge-warning' : 'badge-danger'">
                  {{ tx.status }}
                </span>
              </td>
              <td class="py-3 text-gray-400">{{ formatDate(tx.created_at) }}</td>
              <td class="py-3">
                <RouterLink :to="`/admin/transactions/${tx.id}`" class="text-xs text-primary-600 hover:underline">Detail</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pagination && pagination.totalPages > 1" class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <button @click="changePage(page - 1)" :disabled="!pagination.hasPrev" class="btn-secondary text-sm py-1.5 px-3">← Sebelumnya</button>
        <span class="text-sm text-gray-500">{{ page }} / {{ pagination.totalPages }}</span>
        <button @click="changePage(page + 1)" :disabled="!pagination.hasNext" class="btn-secondary text-sm py-1.5 px-3">Berikutnya →</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { adminApi } from '@/api/admin'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const transactions = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pagination = ref<any>(null)
const filters = ref({ type: '', status: '', startDate: '', endDate: '' })

onMounted(load)

async function load() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: page.value }
    if (filters.value.type) params.type = filters.value.type
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.startDate) params.startDate = filters.value.startDate
    if (filters.value.endDate) params.endDate = filters.value.endDate
    const res = await adminApi.listTransactions(params)
    transactions.value = res.data.data.transactions
    pagination.value = res.data.data.pagination
  } finally { loading.value = false }
}

async function changePage(p: number) { page.value = p; await load() }

function formatCurrency(n: string | number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n))
}
function formatDate(ts: string) {
  return new Date(ts).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
}
</script>
