<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800">Notifikasi</h1>
      <button @click="store.markAllAsRead()" class="text-sm text-primary-600 hover:underline">
        Tandai semua dibaca
      </button>
    </div>

    <div class="card">
      <LoadingSpinner v-if="loading" size="sm" />
      <div v-else-if="store.notifications.length === 0" class="text-center text-gray-400 text-sm py-10">
        Tidak ada notifikasi
      </div>
      <div v-else class="divide-y divide-gray-50">
        <div v-for="n in store.notifications" :key="n.id"
             @click="store.markAsRead(n.id)"
             class="flex items-start gap-3 py-4 cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors"
             :class="{ 'bg-blue-50': !n.is_read }">
          <div class="h-10 w-10 rounded-full flex items-center justify-center text-lg shrink-0"
               :class="n.is_read ? 'bg-gray-100' : 'bg-primary-100'">
            {{ notifIcon(n.type) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-800" :class="{ 'font-medium': !n.is_read }">
              {{ formatNotification(n) }}
            </p>
            <p class="text-xs text-gray-400 mt-1">{{ formatDate(n.created_at) }}</p>
          </div>
          <div v-if="!n.is_read" class="h-2 w-2 rounded-full bg-primary-500 mt-2 shrink-0"></div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="store.total > 20" class="flex justify-center mt-4 pt-4 border-t border-gray-100">
        <button @click="loadMore" class="btn-secondary text-sm">Muat lebih banyak</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNotificationStore } from '@/stores/notificationStore'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const store = useNotificationStore()
const loading = ref(false)
let page = 1

onMounted(async () => {
  loading.value = true
  await store.fetchNotifications()
  loading.value = false
})

async function loadMore() {
  page++
  await store.fetchNotifications(page)
}

function notifIcon(type: string) {
  const map: Record<string, string> = {
    transfer_sent: '↗️', transfer_received: '↙️',
    topup_approved: '✅', topup_rejected: '❌',
    qr_payment_sent: '📱', qr_payment_received: '💰',
    money_request_received: '🤝', money_request_accepted: '✅', money_request_rejected: '❌',
  }
  return map[type] ?? '🔔'
}

function formatNotification(n: { type: string; payload: Record<string, unknown> }): string {
  const p = n.payload
  const amount = p.amount ? `Rp${Number(p.amount).toLocaleString('id-ID')}` : ''
  const map: Record<string, string> = {
    transfer_sent: `Transfer ${amount} ke ${p.receiverName ?? ''} berhasil`,
    transfer_received: `Menerima ${amount} dari ${p.senderName ?? ''}`,
    topup_approved: `Top up ${amount} disetujui oleh admin`,
    topup_rejected: `Top up ${amount} ditolak. Alasan: ${p.reason ?? '-'}`,
    qr_payment_sent: `Pembayaran QR ${amount} berhasil`,
    qr_payment_received: `Menerima pembayaran QR ${amount} dari ${p.scannerName ?? ''}`,
    money_request_received: `${p.requesterName ?? ''} meminta ${amount}`,
    money_request_accepted: `Permintaan ${amount} diterima`,
    money_request_rejected: `Permintaan ${amount} ditolak`,
    money_request_expired: `Permintaan ${amount} kedaluwarsa`,
  }
  return map[n.type] ?? n.type
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}
</script>
