<template>
  <div class="space-y-5 max-w-lg mx-auto">
    <!-- Header — tanpa ikon F -->
    <div class="pt-1">
      <p class="text-gray-400 text-sm">Selamat datang 👋</p>
      <h1 class="text-xl font-bold text-gray-900">{{ authStore.user?.name?.split(' ')[0] }}</h1>
    </div>

    <!-- Balance card -->
    <BalanceCard :balance="walletStore.balance" :currency="walletStore.currency" :loading="walletStore.loading" />

    <!-- Quick actions -->
    <div class="card">
      <div class="grid grid-cols-4 gap-2">
        <RouterLink v-for="a in quickActions" :key="a.to" :to="a.to" class="quick-action">
          <div class="quick-action-icon" :style="{ background: a.bg }">
            <component :is="a.icon" class="h-6 w-6" :style="{ color: a.color }" />
          </div>
          <span class="quick-action-label">{{ a.label }}</span>
        </RouterLink>
      </div>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-3xl p-5 text-white" style="background: linear-gradient(135deg, #7c3aed, #4f46e5)">
        <div class="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
          <ChartBarIcon class="h-5 w-5 text-white" />
        </div>
        <p class="text-violet-200 text-xs font-medium">Transaksi</p>
        <p class="text-2xl font-bold mt-0.5">{{ walletStore.transactions.length }}</p>
      </div>
      <RouterLink to="/topup"
                  class="card border-dashed border-2 border-violet-200 flex flex-col justify-center gap-2 hover:bg-violet-50 transition-colors">
        <div class="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center">
          <PlusIcon class="h-5 w-5 text-violet-600" />
        </div>
        <p class="text-sm font-semibold text-violet-700 leading-tight">Top Up<br/>Saldo</p>
      </RouterLink>
    </div>

    <!-- Recent activity -->
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-gray-900">Aktivitas Terbaru</h2>
        <RouterLink to="/wallet" class="text-xs font-semibold text-violet-600 hover:underline flex items-center gap-1">
          Lihat semua <ChevronRightIcon class="h-3 w-3" />
        </RouterLink>
      </div>
      <LoadingSpinner v-if="walletStore.loading" size="sm" />
      <TransactionList v-else :transactions="walletStore.transactions.slice(0, 5)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useWalletStore } from '@/stores/walletStore'
import BalanceCard from '@/components/wallet/BalanceCard.vue'
import TransactionList from '@/components/wallet/TransactionList.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import {
  ArrowsRightLeftIcon, PlusCircleIcon, QrCodeIcon, HandRaisedIcon,
  ChartBarIcon, PlusIcon, ChevronRightIcon,
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const walletStore = useWalletStore()
const initial = computed(() => authStore.user?.name?.charAt(0).toUpperCase() ?? 'U')

const quickActions = [
  { to: '/transfer', label: 'Transfer', icon: ArrowsRightLeftIcon, bg: '#FFF3E0', color: '#F59E0B' },
  { to: '/topup',    label: 'Top Up',   icon: PlusCircleIcon,       bg: '#E8F5E9', color: '#10B981' },
  { to: '/qr',       label: 'QR Pay',   icon: QrCodeIcon,           bg: '#EDE7F6', color: '#7C3AED' },
  { to: '/requests', label: 'Request',  icon: HandRaisedIcon,       bg: '#E3F2FD', color: '#3B82F6' },
]

onMounted(() => Promise.all([walletStore.fetchBalance(), walletStore.fetchTransactions()]))
</script>
