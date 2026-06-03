<template>
  <div class="max-w-md mx-auto space-y-5">
    <div class="flex items-center gap-3">
      <RouterLink to="/profile" class="p-2 rounded-xl hover:bg-gray-100 transition-colors">
        <ChevronLeftIcon class="h-5 w-5 text-gray-500" />
      </RouterLink>
      <div>
        <h1 class="page-header">E-Statement</h1>
        <p class="page-subheader">Riwayat mutasi saldo</p>
      </div>
    </div>

    <div class="card">
      <LoadingSpinner v-if="loading" size="sm" />
      <div v-else-if="entries.length === 0" class="text-center py-10">
        <DocumentTextIcon class="h-12 w-12 text-gray-200 mx-auto mb-2" />
        <p class="text-sm text-gray-400">Belum ada mutasi</p>
      </div>
      <div v-else class="divide-y divide-gray-50">
        <div v-for="e in entries" :key="e.id" class="flex items-center justify-between py-3">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl flex items-center justify-center"
                 :class="e.entry_type === 'credit' ? 'bg-emerald-50' : 'bg-red-50'">
              <component :is="e.entry_type === 'credit' ? ArrowDownIcon : ArrowUpIcon"
                         class="h-5 w-5"
                         :class="e.entry_type === 'credit' ? 'text-emerald-500' : 'text-red-400'" />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-800">{{ e.transaction_type ?? e.account_name }}</p>
              <p class="text-xs text-gray-400">{{ formatDate(e.created_at) }}</p>
            </div>
          </div>
          <p class="text-sm font-bold"
             :class="e.entry_type === 'credit' ? 'text-emerald-600' : 'text-red-500'">
            {{ e.entry_type === 'credit' ? '+' : '-' }}{{ formatCurrency(e.amount) }}
          </p>
        </div>
      </div>

      <div v-if="pagination && pagination.totalPages > 1"
           class="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
        <button @click="changePage(page - 1)" :disabled="!pagination.hasPrev"
                class="btn-secondary text-sm py-2 px-4 disabled:opacity-40">← Sebelumnya</button>
        <span class="text-sm text-gray-400">{{ page }} / {{ pagination.totalPages }}</span>
        <button @click="changePage(page + 1)" :disabled="!pagination.hasNext"
                class="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Berikutnya →</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { walletApi } from '@/api/wallet'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { ChevronLeftIcon, DocumentTextIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/vue/24/outline'

const entries = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pagination = ref<any>(null)

onMounted(() => load())

async function load() {
  loading.value = true
  try {
    const res = await walletApi.getLedger({ page: page.value, limit: 20 })
    entries.value = res.data.data.entries
    pagination.value = res.data.data.pagination
  } finally { loading.value = false }
}

async function changePage(p: number) { page.value = p; await load() }

function formatCurrency(n: string | number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n))
}
function formatDate(ts: string) {
  return new Date(ts).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}
</script>
