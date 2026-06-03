<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">Persetujuan Top Up</h1>

    <div class="card">
      <LoadingSpinner v-if="loading" size="sm" />
      <div v-else-if="topups.length === 0" class="text-center text-gray-400 text-sm py-10">
        Tidak ada top up yang menunggu persetujuan
      </div>
      <div v-else class="divide-y divide-gray-50">
        <div v-for="t in topups" :key="t.id" class="py-4 flex items-start justify-between">
          <div>
            <p class="font-medium text-gray-800">{{ t.user_name }}</p>
            <p class="text-sm text-gray-500">{{ t.user_email }}</p>
            <p class="text-lg font-bold text-primary-600 mt-1">{{ formatCurrency(t.amount) }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ formatDate(t.created_at) }}</p>
            <a v-if="t.proof_url" :href="t.proof_url" target="_blank"
               class="text-xs text-primary-600 hover:underline mt-1 inline-block">Lihat bukti</a>
          </div>
          <div class="flex gap-2">
            <button @click="approve(t.id)" class="btn-primary text-sm py-1.5 px-3">Setujui</button>
            <button @click="openReject(t)" class="btn-danger text-sm py-1.5 px-3">Tolak</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="rejectModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h3 class="font-semibold text-gray-800">Tolak Top Up</h3>
        <p class="text-sm text-gray-500">{{ formatCurrency(rejectModal.amount) }} dari {{ rejectModal.user_name }}</p>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Alasan Penolakan</label>
          <textarea v-model="rejectReason" rows="3" class="input-field" placeholder="Masukkan alasan..."></textarea>
        </div>
        <div class="flex gap-3">
          <button @click="rejectModal = null" class="btn-secondary flex-1">Batal</button>
          <button @click="confirmReject" :disabled="!rejectReason" class="btn-danger flex-1">Tolak</button>
        </div>
      </div>
    </div>

    <SuccessToast :message="toastMsg" :show="showToast" @hide="showToast = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api/admin'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SuccessToast from '@/components/common/SuccessToast.vue'

const topups = ref<any[]>([])
const loading = ref(false)
const rejectModal = ref<any>(null)
const rejectReason = ref('')
const showToast = ref(false)
const toastMsg = ref('')

onMounted(load)

async function load() {
  loading.value = true
  try {
    const res = await adminApi.getPendingTopUps()
    topups.value = res.data.data.topups
  } finally { loading.value = false }
}

async function approve(id: string) {
  await adminApi.approveTopUp(id)
  toastMsg.value = 'Top up disetujui'; showToast.value = true
  await load()
}

function openReject(t: any) { rejectModal.value = t; rejectReason.value = '' }

async function confirmReject() {
  await adminApi.rejectTopUp(rejectModal.value.id, rejectReason.value)
  rejectModal.value = null
  toastMsg.value = 'Top up ditolak'; showToast.value = true
  await load()
}

function formatCurrency(n: string | number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n))
}
function formatDate(ts: string) {
  return new Date(ts).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
}
</script>
