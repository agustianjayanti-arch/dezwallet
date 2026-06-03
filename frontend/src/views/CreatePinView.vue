<template>
  <div class="min-h-screen bg-surface flex flex-col items-center justify-center px-5">
    <div class="w-full max-w-sm">
      <!-- Icon -->
      <div class="text-center mb-8">
        <div class="h-20 w-20 rounded-3xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
          <span class="text-4xl">🔐</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Buat PIN Transaksi</h1>
        <p class="text-gray-400 text-sm mt-2">PIN 6 digit digunakan untuk mengotorisasi setiap transaksi kamu</p>
      </div>

      <form @submit.prevent="handleCreatePin" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">PIN (6 digit)</label>
          <input v-model="pin" type="password" inputmode="numeric" pattern="\d{6}" maxlength="6"
                 placeholder="••••••" class="input-field text-center text-2xl tracking-[0.5em]" required />
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Konfirmasi PIN</label>
          <input v-model="confirmPin" type="password" inputmode="numeric" pattern="\d{6}" maxlength="6"
                 placeholder="••••••" class="input-field text-center text-2xl tracking-[0.5em]" required />
          <p v-if="confirmPin && pin !== confirmPin" class="text-xs text-red-400 mt-1.5 ml-1">PIN tidak cocok</p>
        </div>

        <ErrorAlert :message="error" />

        <button type="submit" :disabled="loading || pin !== confirmPin || pin.length !== 6"
                class="btn-primary w-full mt-2">
          <span v-if="loading">Menyimpan...</span>
          <span v-else>Simpan PIN</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import type { AxiosError } from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const pin = ref(''); const confirmPin = ref('')
const loading = ref(false); const error = ref<string | null>(null)

async function handleCreatePin() {
  if (pin.value !== confirmPin.value) return
  error.value = null; loading.value = true
  try {
    await authApi.createPin({ pin: pin.value })
    authStore.setHasPin(true)
    router.push('/dashboard')
  } catch (err) {
    const e = err as AxiosError<{ error: { message: string } }>
    error.value = e.response?.data?.error?.message ?? 'Gagal membuat PIN.'
  } finally { loading.value = false }
}
</script>
