<template>
  <div class="max-w-xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">Kirim Notifikasi</h1>
      <p class="text-sm text-gray-400 mt-1">Kirim pesan langsung ke pengguna</p>
    </div>

    <div class="card space-y-5">
      <!-- Tipe pengiriman -->
      <div class="flex gap-2 bg-gray-100 p-1 rounded-2xl">
        <button @click="mode = 'personal'"
                class="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                :class="mode === 'personal' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'">
          <UserIcon class="h-4 w-4" /> Personal
        </button>
        <button @click="mode = 'broadcast'"
                class="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                :class="mode === 'broadcast' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'">
          <MegaphoneIcon class="h-4 w-4" /> Broadcast Semua
        </button>
      </div>

      <!-- Target user (hanya mode personal) -->
      <div v-if="mode === 'personal'">
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">
          User ID atau Email Target
        </label>
        <input v-model="targetUserId" type="text"
               placeholder="Masukkan user ID"
               class="input-field" />
        <p class="text-xs text-gray-400 mt-1.5">
          Buka halaman detail user untuk menyalin ID-nya
        </p>
      </div>

      <!-- Broadcast info -->
      <div v-else class="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <ExclamationTriangleIcon class="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-semibold text-amber-700">Broadcast ke semua pengguna aktif</p>
          <p class="text-xs text-amber-600 mt-0.5">Notifikasi akan dikirim ke seluruh pengguna dengan status aktif.</p>
        </div>
      </div>

      <!-- Judul -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Judul</label>
        <input v-model="title" type="text" placeholder="Contoh: Pembaruan Sistem"
               class="input-field" maxlength="100" />
        <p class="text-xs text-gray-400 mt-1 text-right">{{ title.length }}/100</p>
      </div>

      <!-- Pesan -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Pesan</label>
        <textarea v-model="message" rows="4"
                  placeholder="Isi pesan notifikasi..."
                  class="input-field resize-none" maxlength="500"></textarea>
        <p class="text-xs text-gray-400 mt-1 text-right">{{ message.length }}/500</p>
      </div>

      <!-- Preview -->
      <div v-if="title || message" class="bg-gray-50 rounded-2xl p-4">
        <p class="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Preview Notifikasi</p>
        <div class="flex items-start gap-3">
          <div class="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <BellIcon class="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-800">{{ title || 'Judul notifikasi' }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ message || 'Isi pesan notifikasi' }}</p>
          </div>
        </div>
      </div>

      <!-- Error / Success -->
      <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl p-3">
        <ExclamationCircleIcon class="h-4 w-4 text-red-500 shrink-0" />
        <p class="text-sm text-red-600">{{ error }}</p>
      </div>
      <div v-if="successMsg" class="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
        <CheckCircleIcon class="h-4 w-4 text-emerald-500 shrink-0" />
        <p class="text-sm text-emerald-700 font-medium">{{ successMsg }}</p>
      </div>

      <!-- Submit -->
      <button @click="handleSend"
              :disabled="loading || !title.trim() || !message.trim() || (mode === 'personal' && !targetUserId.trim())"
              class="btn-primary w-full flex items-center justify-center gap-2">
        <span v-if="loading" class="flex items-center gap-2">
          <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Mengirim...
        </span>
        <span v-else class="flex items-center gap-2">
          <PaperAirplaneIcon class="h-4 w-4" />
          {{ mode === 'broadcast' ? 'Broadcast Notifikasi' : 'Kirim Notifikasi' }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { adminNotifApi } from '@/api/admin'
import {
  UserIcon, MegaphoneIcon, BellIcon, PaperAirplaneIcon,
  ExclamationTriangleIcon, ExclamationCircleIcon, CheckCircleIcon,
} from '@heroicons/vue/24/outline'
import type { AxiosError } from 'axios'

const mode = ref<'personal' | 'broadcast'>('personal')
const targetUserId = ref('')
const title = ref('')
const message = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const successMsg = ref<string | null>(null)

async function handleSend() {
  error.value = null
  successMsg.value = null
  loading.value = true

  try {
    const payload =
      mode.value === 'broadcast'
        ? { title: title.value, message: message.value, broadcast: true }
        : { userId: targetUserId.value, title: title.value, message: message.value }

    const res = await adminNotifApi.sendNotification(payload)
    successMsg.value = res.data.data.message

    // Reset form
    title.value = ''
    message.value = ''
    targetUserId.value = ''
  } catch (err) {
    const e = err as AxiosError<{ error: { message: string } }>
    error.value = e.response?.data?.error?.message ?? 'Gagal mengirim notifikasi.'
  } finally {
    loading.value = false
  }
}
</script>
