<template>
  <div class="relative">
    <button @click="toggle"
            class="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
      <BellIcon class="h-5 w-5" />
      <span v-if="store.unreadCount > 0"
            class="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
        {{ store.unreadCount > 9 ? '9+' : store.unreadCount }}
      </span>
    </button>

    <Transition enter-active-class="transition ease-out duration-200 origin-top-right"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition ease-in duration-150"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95">
      <div v-if="open"
           class="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <span class="font-bold text-gray-800 text-sm">Notifikasi</span>
          <button @click="markAll" class="text-xs font-semibold text-violet-600 hover:underline">Tandai dibaca</button>
        </div>
        <div class="max-h-72 overflow-y-auto">
          <div v-if="store.notifications.length === 0" class="px-4 py-8 text-center">
            <BellSlashIcon class="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p class="text-sm text-gray-400">Tidak ada notifikasi</p>
          </div>
          <div v-for="n in store.notifications.slice(0, 5)" :key="n.id"
               @click="read(n.id)"
               class="flex gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
               :class="{ 'bg-violet-50/50': !n.is_read }">
            <div class="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                 :class="n.is_read ? 'bg-gray-100' : 'bg-violet-100'">
              <component :is="notifIcon(n.type)" class="h-4 w-4"
                         :class="n.is_read ? 'text-gray-400' : 'text-violet-600'" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-gray-700 leading-relaxed" :class="{ 'font-semibold': !n.is_read }">
                {{ formatNotification(n) }}
              </p>
              <p class="text-[10px] text-gray-400 mt-0.5">{{ formatTime(n.created_at) }}</p>
            </div>
          </div>
        </div>
        <div class="px-4 py-2.5 border-t border-gray-50 bg-gray-50/50">
          <RouterLink to="/notifications" @click="open = false"
                      class="text-xs font-semibold text-violet-600 hover:underline flex items-center gap-1">
            Lihat semua <ChevronRightIcon class="h-3 w-3" />
          </RouterLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useNotificationStore } from '@/stores/notificationStore'
import type { Component } from 'vue'
import {
  BellIcon, BellSlashIcon, ChevronRightIcon,
  ArrowsRightLeftIcon, PlusCircleIcon, QrCodeIcon,
  HandRaisedIcon, CheckCircleIcon, XCircleIcon,
} from '@heroicons/vue/24/outline'

const store = useNotificationStore()
const open = ref(false)

function toggle() { open.value = !open.value; if (open.value) store.fetchNotifications() }
function read(id: string) { store.markAsRead(id) }
function markAll() { store.markAllAsRead() }

function notifIcon(type: string): Component {
  const map: Record<string, Component> = {
    transfer_sent: ArrowsRightLeftIcon, transfer_received: ArrowsRightLeftIcon,
    topup_approved: CheckCircleIcon, topup_rejected: XCircleIcon,
    qr_payment_sent: QrCodeIcon, qr_payment_received: QrCodeIcon,
    money_request_received: HandRaisedIcon, money_request_accepted: CheckCircleIcon,
    money_request_rejected: XCircleIcon,
  }
  return map[type] ?? BellIcon
}

function formatNotification(n: { type: string; payload: Record<string, unknown> }): string {
  const p = n.payload
  const amount = p.amount ? `Rp${Number(p.amount).toLocaleString('id-ID')}` : ''
  const map: Record<string, string> = {
    transfer_sent:            `Transfer ${amount} ke ${p.receiverName ?? ''} berhasil`,
    transfer_received:        `Menerima ${amount} dari ${p.senderName ?? ''}`,
    topup_approved:           `Top up ${amount} disetujui`,
    topup_rejected:           `Top up ${amount} ditolak`,
    qr_payment_sent:          `Pembayaran QR ${amount} berhasil`,
    qr_payment_received:      `Menerima QR ${amount} dari ${p.scannerName ?? ''}`,
    money_request_received:   `${p.requesterName ?? ''} meminta ${amount}`,
    money_request_accepted:   `Permintaan ${amount} diterima`,
    money_request_rejected:   `Permintaan ${amount} ditolak`,
    admin_message:            `${(p.title as string) ?? 'Pesan Admin'}: ${(p.message as string) ?? ''}`,
    admin_broadcast:          `${(p.title as string) ?? 'Pengumuman'}: ${(p.message as string) ?? ''}`,
  }
  return map[n.type] ?? n.type
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
}

function handleOutside(e: MouseEvent) {
  if (!(e.target as Element).closest('.relative')) open.value = false
}
onMounted(() => { store.fetchNotifications(); document.addEventListener('click', handleOutside) })
onUnmounted(() => document.removeEventListener('click', handleOutside))
</script>
