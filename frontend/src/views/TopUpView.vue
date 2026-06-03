<template>
  <div class="max-w-md mx-auto space-y-5">
    <div>
      <h1 class="page-header">Top Up</h1>
      <p class="page-subheader">Tambah saldo wallet kamu</p>
    </div>

    <div class="card space-y-4">
      <div class="flex items-center gap-3 p-3 bg-violet-50 rounded-2xl">
        <div class="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <PlusCircleIcon class="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">Rentang Top Up</p>
          <p class="text-sm font-semibold text-gray-800">Rp10.000 – Rp10.000.000</p>
        </div>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Jumlah (IDR)</label>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">Rp</span>
          <input v-model.number="amount" type="number" min="10000" max="10000000"
                 placeholder="0" class="input-field pl-10" />
        </div>
        <p v-if="amount && (amount < 10000 || amount > 10000000)"
           class="text-xs text-red-400 mt-1.5 ml-1 flex items-center gap-1">
          <ExclamationCircleIcon class="h-3 w-3" />
          Jumlah harus antara Rp10.000 dan Rp10.000.000
        </p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">URL Bukti Pembayaran <span class="text-gray-400 font-normal">(opsional)</span></label>
        <input v-model="proofUrl" type="url" placeholder="https://..." class="input-field" />
      </div>

      <ErrorAlert :message="error" />
      <SuccessToast message="Pengajuan top up berhasil dikirim!" :show="showSuccess" @hide="showSuccess = false" />

      <button @click="handleSubmit"
              :disabled="loading || !amount || amount < 10000 || amount > 10000000"
              class="btn-primary w-full">
        <span v-if="loading" class="flex items-center justify-center gap-2">
          <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Mengirim...
        </span>
        <span v-else class="flex items-center justify-center gap-2">
          <PaperAirplaneIcon class="h-4 w-4" /> Ajukan Top Up
        </span>
      </button>
    </div>

    <!-- History -->
    <div class="card">
      <h2 class="font-bold text-gray-900 mb-4">Riwayat Top Up</h2>
      <LoadingSpinner v-if="loadingHistory" size="sm" />
      <div v-else-if="history.length === 0" class="text-center py-8">
        <ClockIcon class="h-10 w-10 text-gray-200 mx-auto mb-2" />
        <p class="text-sm text-gray-400">Belum ada riwayat</p>
      </div>
      <div v-else class="divide-y divide-gray-50">
        <div v-for="t in history" :key="t.id" class="flex items-center justify-between py-3">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                 :class="t.status === 'approved' ? 'bg-emerald-50' : t.status === 'rejected' ? 'bg-red-50' : 'bg-amber-50'">
              <component :is="t.status === 'approved' ? CheckCircleIcon : t.status === 'rejected' ? XCircleIcon : ClockIcon"
                         class="h-5 w-5"
                         :class="t.status === 'approved' ? 'text-emerald-500' : t.status === 'rejected' ? 'text-red-400' : 'text-amber-500'" />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-800">{{ formatCurrency(t.amount) }}</p>
              <p class="text-xs text-gray-400">{{ formatDate(t.created_at) }}</p>
            </div>
          </div>
          <span :class="t.status === 'approved' ? 'badge-success' : t.status === 'rejected' ? 'badge-danger' : 'badge-warning'">
            {{ t.status }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { topupApi } from '@/api/topup'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import SuccessToast from '@/components/common/SuccessToast.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { PlusCircleIcon, PaperAirplaneIcon, ExclamationCircleIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/outline'
import type { AxiosError } from 'axios'

const amount = ref(0); const proofUrl = ref('')
const loading = ref(false); const error = ref<string | null>(null); const showSuccess = ref(false)
const history = ref<any[]>([]); const loadingHistory = ref(false)

onMounted(loadHistory)

async function loadHistory() {
  loadingHistory.value = true
  try { const res = await topupApi.getTopUpHistory(); history.value = res.data.data.topups }
  finally { loadingHistory.value = false }
}

async function handleSubmit() {
  error.value = null; loading.value = true
  try {
    await topupApi.submitTopUp({ amount: amount.value, proofUrl: proofUrl.value || undefined })
    showSuccess.value = true; amount.value = 0; proofUrl.value = ''
    await loadHistory()
  } catch (err) {
    const e = err as AxiosError<{ error: { message: string } }>
    error.value = e.response?.data?.error?.message ?? 'Gagal mengajukan top up.'
  } finally { loading.value = false }
}

function formatCurrency(n: string | number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n))
}
function formatDate(ts: string) {
  return new Date(ts).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
}
</script>
