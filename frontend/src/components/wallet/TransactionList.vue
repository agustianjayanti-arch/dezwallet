<template>
  <div class="divide-y divide-gray-50">
    <div v-if="transactions.length === 0" class="py-10 text-center">
      <div class="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
        <BanknotesIcon class="h-7 w-7 text-gray-300" />
      </div>
      <p class="text-gray-400 text-sm">Belum ada transaksi</p>
    </div>
    <div v-for="tx in transactions" :key="tx.id" class="tx-item">
      <div class="tx-icon shrink-0" :style="{ background: typeStyle(tx.type).bg }">
        <component :is="typeStyle(tx.type).icon" class="h-5 w-5" :style="{ color: typeStyle(tx.type).color }" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-800 truncate">{{ typeLabel(tx.type) }}</p>
        <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(tx.created_at) }}</p>
      </div>
      <div class="text-right shrink-0 ml-2">
        <p class="text-sm font-bold" :class="tx.type === 'topup' ? 'text-emerald-600' : 'text-gray-800'">
          {{ tx.type === 'topup' ? '+' : '-' }}{{ formatAmount(tx.amount) }}
        </p>
        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              :class="tx.status === 'success' ? 'bg-emerald-50 text-emerald-600' : tx.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'">
          {{ tx.status }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { Transaction } from '@/stores/walletStore'
import {
  ArrowsRightLeftIcon, PlusCircleIcon, QrCodeIcon,
  HandRaisedIcon, BanknotesIcon,
} from '@heroicons/vue/24/outline'

defineProps<{ transactions: Transaction[] }>()

interface TxStyle { icon: Component; bg: string; color: string }

function typeStyle(t: string): TxStyle {
  const map: Record<string, TxStyle> = {
    transfer:       { icon: ArrowsRightLeftIcon, bg: '#FFF8EC', color: '#F59E0B' },
    topup:          { icon: PlusCircleIcon,       bg: '#ECFDF5', color: '#10B981' },
    qr_payment:     { icon: QrCodeIcon,           bg: '#F5F3FF', color: '#7C3AED' },
    money_request:  { icon: HandRaisedIcon,       bg: '#EFF6FF', color: '#3B82F6' },
  }
  return map[t] ?? { icon: BanknotesIcon, bg: '#F5F5F5', color: '#9CA3AF' }
}

function typeLabel(t: string) {
  const m: Record<string, string> = {
    transfer: 'Transfer', topup: 'Top Up',
    qr_payment: 'QR Payment', money_request: 'Request Money'
  }
  return m[t] ?? t
}

function formatAmount(a: string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(Number(a))
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
}
</script>
