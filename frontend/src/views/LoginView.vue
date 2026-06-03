<template>
  <div class="min-h-screen bg-surface flex flex-col">
    <!-- Top decoration -->
    <div class="h-48 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-b-[2.5rem] flex items-end pb-8 px-6 relative overflow-hidden">
      <div class="absolute top-4 right-4 h-20 w-20 rounded-full bg-white/10"></div>
      <div class="absolute -top-4 -left-4 h-24 w-24 rounded-full bg-white/10"></div>
      <div>
        <h1 class="text-3xl font-extrabold text-white">DezPay</h1>
        <p class="text-violet-200 text-sm mt-1">Dompet digital yang cepat & aman</p>
      </div>
    </div>

    <!-- Form -->
    <div class="flex-1 px-5 pt-6 pb-8 max-w-md w-full mx-auto">
      <h2 class="text-2xl font-bold text-gray-900 mb-1">Masuk</h2>
      <p class="text-gray-400 text-sm mb-6">Selamat datang kembali 👋</p>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
          <input v-model="form.email" type="email" placeholder="email@example.com"
                 class="input-field" required autocomplete="email" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
          <input v-model="form.password" type="password" placeholder="Password"
                 class="input-field" required autocomplete="current-password" />
        </div>

        <div v-if="isFrozen" class="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <p class="text-sm font-semibold text-orange-700">Akun dibekukan</p>
          <p class="text-xs text-orange-500 mt-1">Hubungi admin untuk informasi lebih lanjut.</p>
        </div>
        <ErrorAlert v-else :message="error" />

        <button type="submit" :disabled="loading" class="btn-primary w-full mt-2">
          <span v-if="loading" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Masuk...
          </span>
          <span v-else>Masuk</span>
        </button>
      </form>

      <p class="text-center text-sm text-gray-400 mt-6">
        Belum punya akun?
        <RouterLink to="/register" class="text-violet-600 font-semibold hover:underline">Daftar sekarang</RouterLink>
      </p>
      <p class="text-center mt-3">
        <RouterLink to="/admin/login" class="text-xs text-gray-400 hover:text-gray-600">Login sebagai Admin →</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import type { AxiosError } from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const form = ref({ email: '', password: '' })
const loading = ref(false)
const error = ref<string | null>(null)
const isFrozen = ref(false)

async function handleLogin() {
  error.value = null; isFrozen.value = false; loading.value = true
  try {
    await authStore.login(form.value.email, form.value.password)
    router.push('/dashboard')
  } catch (err) {
    const e = err as AxiosError<{ error: { code: string; message: string } }>
    if (e.response?.data?.error?.code === 'ACCOUNT_FROZEN') isFrozen.value = true
    else error.value = e.response?.data?.error?.message ?? 'Login gagal.'
  } finally { loading.value = false }
}
</script>
