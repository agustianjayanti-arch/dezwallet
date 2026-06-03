<template>
  <div class="max-w-md mx-auto space-y-5">
    <!-- Step 1 -->
    <template v-if="step === 1">
      <div>
        <h1 class="page-header">Transfer</h1>
        <p class="page-subheader">Kirim saldo ke pengguna lain</p>
      </div>

      <!-- Balance info -->
      <div class="card flex items-center gap-4">
        <div class="h-12 w-12 rounded-2xl bg-violet-100 flex items-center justify-center text-xl">💰</div>
        <div>
          <p class="text-xs text-gray-400 font-medium">Saldo kamu</p>
          <p class="text-lg font-bold text-gray-900">{{ formatCurrency(walletStore.balance) }}</p>
        </div>
      </div>

      <div class="card space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">ID atau Email Penerima</label>
          <input v-model="receiverId" type="text" placeholder="Masukkan ID atau email"
                 class="input-field" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Jumlah Transfer</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">Rp</span>
            <input v-model.number="amount" type="number" min="1000" placeholder="0"
                   class="input-field pl-10" />
          </div>
        </div>
        <ErrorAlert :message="error" />
        <button @click="goToConfirm" :disabled="!receiverId || !amount || amount <= 0"
                class="btn-primary w-full">Lanjutkan</button>
      </div>
    </template>

    <!-- Step 2: Confirm + PIN -->
    <template v-if="step === 2">
      <div>
        <button @click="step = 1" class="flex items-center gap-2 text-gray-400 hover:text-gray-700 mb-4">
          ← Kembali
        </button>
        <h1 class="page-header">Konfirmasi</h1>
        <p class="page-subheader">Periksa detail transfer</p>
      </div>

      <div class="card space-y-3">
        <div class="flex justify-between items-center py-2 border-b border-gray-50">
          <span class="text-sm text-gray-400">Penerima</span>
          <span class="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{{ receiverId }}</span>
        </div>
        <div class="flex justify-between items-center py-2">
          <span class="text-sm text-gray-400">Jumlah</span>
          <span class="text-lg font-bold text-violet-600">{{ formatCurrency(amount) }}</span>
        </div>
      </div>

      <div class="card space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">PIN Transaksi</label>
          <input v-model="pin" type="password" inputmode="numeric" maxlength="6"
                 placeholder="••••••" class="input-field text-center text-2xl tracking-[0.5em]" />
        </div>
        <ErrorAlert :message="error" />
        <button @click="handleTransfer" :disabled="loading || pin.length !== 6"
                class="btn-primary w-full">
          <span v-if="loading" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Memproses...
          </span>
          <span v-else>Transfer Sekarang</span>
        </button>
      </div>
    </template>

    <!-- Step 3: Success -->
    <template v-if="step === 3">
      <div class="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div class="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <svg class="h-12 w-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900">Transfer Berhasil!</h2>
        <p class="text-violet-600 text-xl font-bold mt-2">{{ formatCurrency(amount) }}</p>
        <p class="text-gray-400 text-sm mt-1">Telah dikirim ke {{ receiverId }}</p>
        <button @click="reset" class="btn-primary mt-8 px-10">Transfer Lagi</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { transferApi } from '@/api/transfer'
import { useWalletStore } from '@/stores/walletStore'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import type { AxiosError } from 'axios'

const walletStore = useWalletStore()
const step = ref(1)
const receiverId = ref(''); const amount = ref(0); const pin = ref('')
const loading = ref(false); const error = ref<string | null>(null)

function formatCurrency(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function goToConfirm() { error.value = null; step.value = 2 }

async function handleTransfer() {
  error.value = null; loading.value = true
  try {
    await transferApi.initiateTransfer({ receiverId: receiverId.value, amount: amount.value, pin: pin.value })
    await walletStore.fetchBalance()
    step.value = 3
  } catch (err) {
    const e = err as AxiosError<{ error: { message: string } }>
    error.value = e.response?.data?.error?.message ?? 'Transfer gagal.'
  } finally { loading.value = false }
}

function reset() { step.value = 1; receiverId.value = ''; amount.value = 0; pin.value = ''; error.value = null }
</script>
