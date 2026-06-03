<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">Request Money</h1>

    <div class="flex gap-2 bg-gray-100 p-1 rounded-lg">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
              class="flex-1 py-2 text-sm font-medium rounded-md transition-colors"
              :class="activeTab === tab.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'">
        {{ tab.label }}
      </button>
    </div>

    <!-- Create Request -->
    <div v-if="activeTab === 'create'" class="card space-y-4">
      <h2 class="font-semibold text-gray-700">Kirim Permintaan</h2>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">ID Target Pengguna</label>
        <input v-model="targetId" type="text" placeholder="user-id" class="input-field" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah (IDR)</label>
        <input v-model.number="reqAmount" type="number" min="1" placeholder="50000" class="input-field" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
        <input v-model="notes" type="text" placeholder="Untuk apa..." class="input-field" />
      </div>
      <ErrorAlert :message="createError" />
      <SuccessToast message="Permintaan berhasil dikirim!" :show="createSuccess" @hide="createSuccess = false" />
      <button @click="handleCreate" :disabled="createLoading || !targetId || !reqAmount" class="btn-primary w-full">
        <span v-if="createLoading">Mengirim...</span>
        <span v-else>Kirim Permintaan</span>
      </button>
    </div>

    <!-- List Requests -->
    <div v-if="activeTab === 'list'" class="card">
      <div class="flex gap-2 mb-4">
        <button v-for="f in filters" :key="f.value" @click="filterType = f.value; loadRequests()"
                class="px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
                :class="filterType === f.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'">
          {{ f.label }}
        </button>
      </div>
      <LoadingSpinner v-if="listLoading" size="sm" />
      <div v-else-if="requests.length === 0" class="text-center text-gray-400 text-sm py-6">Tidak ada permintaan</div>
      <div v-else class="divide-y divide-gray-50">
        <div v-for="r in requests" :key="r.id" class="py-4">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-gray-800">
                {{ r.requester_name }} → {{ r.target_name }}
              </p>
              <p class="text-sm font-semibold text-primary-600 mt-0.5">{{ formatCurrency(r.amount) }}</p>
              <p v-if="r.notes" class="text-xs text-gray-400 mt-0.5">{{ r.notes }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ formatDate(r.created_at) }}</p>
            </div>
            <div class="flex flex-col items-end gap-2">
              <span :class="statusClass(r.status)" class="text-xs px-2.5 py-1 rounded-full font-medium">
                {{ r.status }}
              </span>
              <!-- Approve/Reject buttons for incoming pending requests -->
              <div v-if="r.status === 'pending' && r.target_id === currentUserId" class="flex gap-2">
                <button @click="openApprove(r)" class="text-xs btn-primary py-1 px-2">Setujui</button>
                <button @click="handleReject(r.id)" class="text-xs btn-danger py-1 px-2">Tolak</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Approve Modal -->
    <div v-if="approveModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h3 class="font-semibold text-gray-800">Konfirmasi Pembayaran</h3>
        <div class="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
          <div class="flex justify-between"><span class="text-gray-500">Jumlah</span><span class="font-semibold">{{ formatCurrency(approveModal.amount) }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Kepada</span><span>{{ approveModal.requester_name }}</span></div>
        </div>
        <PinInput v-model="approvePin" required />
        <ErrorAlert :message="approveError" />
        <div class="flex gap-3">
          <button @click="approveModal = null" class="btn-secondary flex-1">Batal</button>
          <button @click="handleApprove" :disabled="approveLoading || approvePin.length !== 6" class="btn-primary flex-1">
            <span v-if="approveLoading">Memproses...</span>
            <span v-else>Bayar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { requestApi } from '@/api/request'
import { useAuthStore } from '@/stores/authStore'
import { useWalletStore } from '@/stores/walletStore'
import PinInput from '@/components/transfer/PinInput.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import SuccessToast from '@/components/common/SuccessToast.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import type { AxiosError } from 'axios'

const authStore = useAuthStore()
const walletStore = useWalletStore()
const currentUserId = computed(() => authStore.user?.id)

const tabs = [{ id: 'create', label: 'Kirim Request' }, { id: 'list', label: 'Daftar Request' }]
const filters: { value: 'all' | 'sent' | 'received'; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'received', label: 'Masuk' },
  { value: 'sent', label: 'Keluar' },
]
const activeTab = ref('create')
const filterType = ref<'all' | 'sent' | 'received'>('all')

// Create
const targetId = ref(''); const reqAmount = ref(0); const notes = ref('')
const createLoading = ref(false); const createError = ref<string | null>(null); const createSuccess = ref(false)

async function handleCreate() {
  createError.value = null; createLoading.value = true
  try {
    await requestApi.createMoneyRequest({ targetId: targetId.value, amount: reqAmount.value, notes: notes.value || undefined })
    createSuccess.value = true; targetId.value = ''; reqAmount.value = 0; notes.value = ''
  } catch (err) {
    const e = err as AxiosError<{ error: { message: string } }>
    createError.value = e.response?.data?.error?.message ?? 'Gagal mengirim permintaan.'
  } finally { createLoading.value = false }
}

// List
const requests = ref<any[]>([]); const listLoading = ref(false)
onMounted(loadRequests)
async function loadRequests() {
  listLoading.value = true
  try {
    const res = await requestApi.getMoneyRequests({ type: filterType.value })
    requests.value = res.data.data.requests
  } finally { listLoading.value = false }
}

// Approve
const approveModal = ref<any>(null); const approvePin = ref(''); const approveLoading = ref(false); const approveError = ref<string | null>(null)
function openApprove(r: any) { approveModal.value = r; approvePin.value = ''; approveError.value = null }
async function handleApprove() {
  approveError.value = null; approveLoading.value = true
  try {
    await requestApi.approveMoneyRequest(approveModal.value.id, approvePin.value)
    approveModal.value = null; await Promise.all([loadRequests(), walletStore.fetchBalance()])
  } catch (err) {
    const e = err as AxiosError<{ error: { message: string } }>
    approveError.value = e.response?.data?.error?.message ?? 'Gagal menyetujui.'
  } finally { approveLoading.value = false }
}
async function handleReject(id: string) {
  await requestApi.rejectMoneyRequest(id); await loadRequests()
}

function formatCurrency(n: string | number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n))
}
function formatDate(ts: string) { return new Date(ts).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) }
function statusClass(s: string) {
  return s === 'accepted' ? 'bg-green-100 text-green-700' : s === 'rejected' || s === 'expired' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
}
</script>
