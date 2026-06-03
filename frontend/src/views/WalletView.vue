<template>
  <div class="space-y-5 max-w-lg mx-auto">
    <div>
      <h1 class="page-header">Wallet</h1>
      <p class="page-subheader">Saldo & riwayat transaksi</p>
    </div>

    <BalanceCard :balance="walletStore.balance" :currency="walletStore.currency" :loading="walletStore.loading" />

    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-gray-900">Riwayat Transaksi</h2>
        <span class="badge-gray">{{ pagination?.total ?? 0 }} transaksi</span>
      </div>
      <LoadingSpinner v-if="loading" size="sm" />
      <TransactionList v-else :transactions="walletStore.transactions" />

      <div v-if="pagination && pagination.totalPages > 1"
           class="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
        <button @click="changePage(page - 1)" :disabled="!pagination.hasPrev"
                class="btn-secondary text-sm py-2 px-4 flex items-center gap-1.5 disabled:opacity-40">
          <ChevronLeftIcon class="h-4 w-4" /> Sebelumnya
        </button>
        <span class="text-sm text-gray-400 font-medium">{{ page }} / {{ pagination.totalPages }}</span>
        <button @click="changePage(page + 1)" :disabled="!pagination.hasNext"
                class="btn-secondary text-sm py-2 px-4 flex items-center gap-1.5 disabled:opacity-40">
          Berikutnya <ChevronRightIcon class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWalletStore } from '@/stores/walletStore'
import BalanceCard from '@/components/wallet/BalanceCard.vue'
import TransactionList from '@/components/wallet/TransactionList.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

const walletStore = useWalletStore()
const loading = ref(false)
const page = ref(1)
const pagination = ref(walletStore.pagination)

onMounted(() => load())

async function load() {
  loading.value = true
  try {
    await Promise.all([walletStore.fetchBalance(), walletStore.fetchTransactions(page.value)])
    pagination.value = walletStore.pagination
  } finally { loading.value = false }
}

async function changePage(p: number) { page.value = p; await load() }
</script>
