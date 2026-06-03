<template>
  <div class="relative overflow-hidden rounded-3xl p-6 text-white shadow-balance"
       style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)">
    <!-- Decorative circles -->
    <div class="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10"></div>
    <div class="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10"></div>

    <div class="relative">
      <p class="text-violet-200 text-sm font-medium">Saldo Tersedia</p>
      <div v-if="loading" class="mt-2 h-10 w-48 bg-white/20 rounded-xl animate-pulse"></div>
      <p v-else class="text-4xl font-bold mt-1.5 tracking-tight">
        {{ formatCurrency(balance) }}
      </p>
      <p class="text-violet-300 text-xs mt-1 font-medium">{{ currency }} · DezPay Wallet</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ balance: number; currency: string; loading?: boolean }>()

function formatCurrency(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(n)
}
</script>
