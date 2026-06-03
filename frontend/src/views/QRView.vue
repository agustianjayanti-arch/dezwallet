<template>
  <div class="max-w-md mx-auto space-y-5">
    <div>
      <h1 class="page-header">QR Code</h1>
      <p class="page-subheader">Buat atau bayar dengan QR</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-gray-100 p-1 rounded-2xl">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
              class="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              :class="activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'">
        <component :is="tab.icon" class="h-4 w-4" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Generate QR -->
    <div v-if="activeTab === 'generate'" class="card space-y-4">
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Jumlah Pembayaran</label>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">Rp</span>
          <input v-model.number="genAmount" type="number" min="1" placeholder="0" class="input-field pl-10" />
        </div>
      </div>
      <ErrorAlert :message="genError" />
      <button @click="handleGenerate" :disabled="genLoading || !genAmount || genAmount <= 0"
              class="btn-primary w-full flex items-center justify-center gap-2">
        <QrCodeIcon class="h-4 w-4" />
        <span v-if="genLoading">Membuat...</span>
        <span v-else>Buat QR Code</span>
      </button>

      <div v-if="qrResult" class="text-center space-y-3 pt-2">
        <div class="bg-white border-2 border-gray-100 rounded-3xl p-4 inline-block">
          <img :src="qrResult.qrImageUrl" alt="QR Code" class="w-44 h-44 mx-auto" />
        </div>
        <p class="text-lg font-bold text-violet-700">{{ formatCurrency(qrResult.amount) }}</p>
        <div class="flex items-center justify-center gap-2 text-sm">
          <ClockIcon class="h-4 w-4 text-amber-500" />
          <span class="font-semibold" :class="countdown === 'Kedaluwarsa' ? 'text-red-500' : 'text-amber-500'">
            {{ countdown }}
          </span>
        </div>
        <p class="text-xs text-gray-400 font-mono bg-gray-50 rounded-xl px-3 py-2 break-all">{{ qrResult.qrToken }}</p>
      </div>
    </div>

    <!-- Pay QR -->
    <div v-if="activeTab === 'scan'" class="card space-y-4">
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Token QR</label>
        <input v-model="scanToken" type="text" placeholder="Paste atau ketik token QR" class="input-field" />
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">PIN Transaksi</label>
        <input v-model="scanPin" type="password" inputmode="numeric" maxlength="6"
               placeholder="••••••" class="input-field text-center text-2xl tracking-[0.5em]" />
      </div>
      <ErrorAlert :message="scanError" />
      <SuccessToast message="Pembayaran berhasil!" :show="scanSuccess" @hide="scanSuccess = false" />
      <button @click="handlePay" :disabled="scanLoading || !scanToken || scanPin.length !== 6"
              class="btn-primary w-full flex items-center justify-center gap-2">
        <CreditCardIcon class="h-4 w-4" />
        <span v-if="scanLoading">Memproses...</span>
        <span v-else>Bayar Sekarang</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { qrApi } from '@/api/qr'
import { useWalletStore } from '@/stores/walletStore'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import SuccessToast from '@/components/common/SuccessToast.vue'
import { QrCodeIcon, CreditCardIcon, ClockIcon } from '@heroicons/vue/24/outline'
import type { AxiosError } from 'axios'

const walletStore = useWalletStore()
const tabs = [
  { id: 'generate', label: 'Buat QR',  icon: QrCodeIcon },
  { id: 'scan',     label: 'Bayar QR', icon: CreditCardIcon },
]
const activeTab = ref('generate')
const genAmount = ref(0); const genLoading = ref(false); const genError = ref<string | null>(null)
const qrResult = ref<any>(null); const countdown = ref('')
let timer: ReturnType<typeof setInterval> | null = null

async function handleGenerate() {
  genError.value = null; genLoading.value = true
  try {
    const res = await qrApi.generateQRCode({ amount: genAmount.value })
    qrResult.value = res.data.data
    startCountdown(new Date(res.data.data.expiresAt))
  } catch (err) {
    const e = err as AxiosError<{ error: { message: string } }>
    genError.value = e.response?.data?.error?.message ?? 'Gagal membuat QR.'
  } finally { genLoading.value = false }
}

function startCountdown(expiresAt: Date) {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    const diff = expiresAt.getTime() - Date.now()
    if (diff <= 0) { countdown.value = 'Kedaluwarsa'; clearInterval(timer!); return }
    const m = Math.floor(diff / 60000); const s = Math.floor((diff % 60000) / 1000)
    countdown.value = `${m}:${s.toString().padStart(2, '0')}`
  }, 1000)
}

const scanToken = ref(''); const scanPin = ref(''); const scanLoading = ref(false)
const scanError = ref<string | null>(null); const scanSuccess = ref(false)

async function handlePay() {
  scanError.value = null; scanLoading.value = true
  try {
    await qrApi.processQRPayment({ qrToken: scanToken.value, pin: scanPin.value })
    scanSuccess.value = true; scanToken.value = ''; scanPin.value = ''
    await walletStore.fetchBalance()
  } catch (err) {
    const e = err as AxiosError<{ error: { message: string } }>
    scanError.value = e.response?.data?.error?.message ?? 'Pembayaran gagal.'
  } finally { scanLoading.value = false }
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

onUnmounted(() => { if (timer) clearInterval(timer) })
</script>
