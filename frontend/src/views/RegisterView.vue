<template>
  <div class="min-h-screen bg-surface flex flex-col">
    <!-- Top decoration -->
    <div class="h-40 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-b-[2.5rem] flex items-end pb-6 px-6 relative overflow-hidden">
      <div class="absolute top-4 right-4 h-16 w-16 rounded-full bg-white/10"></div>
      <div class="absolute -top-4 -left-4 h-20 w-20 rounded-full bg-white/10"></div>
      <div>
        <h1 class="text-2xl font-extrabold text-white">DezPay</h1>
        <p class="text-violet-200 text-xs mt-0.5">Buat akun baru</p>
      </div>
    </div>

    <div class="flex-1 px-5 pt-6 pb-8 max-w-md w-full mx-auto">
      <h2 class="text-2xl font-bold text-gray-900 mb-1">Daftar</h2>
      <p class="text-gray-400 text-sm mb-6">Isi data di bawah untuk memulai</p>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
          <input v-model="form.name" type="text" placeholder="Budi Santoso"
                 class="input-field" required autocomplete="name" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
          <input v-model="form.email" type="email" placeholder="budi@example.com"
                 class="input-field" required autocomplete="email" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
          <input v-model="form.password" type="password" placeholder="Minimal 8 karakter"
                 class="input-field" required minlength="8" autocomplete="new-password" />
          <p v-if="form.password && form.password.length < 8" class="text-xs text-red-400 mt-1.5 ml-1">
            Password minimal 8 karakter
          </p>
        </div>

        <ErrorAlert :message="error" />

        <button type="submit" :disabled="loading" class="btn-primary w-full mt-2">
          <span v-if="loading" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Mendaftar...
          </span>
          <span v-else>Buat Akun</span>
        </button>
      </form>

      <p class="text-center text-sm text-gray-400 mt-6">
        Sudah punya akun?
        <RouterLink to="/login" class="text-violet-600 font-semibold hover:underline">Masuk</RouterLink>
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
const form = ref({ name: '', email: '', password: '' })
const loading = ref(false)
const error = ref<string | null>(null)

async function handleRegister() {
  error.value = null; loading.value = true
  try {
    await authStore.register(form.value.name, form.value.email, form.value.password)
    router.push('/create-pin')
  } catch (err) {
    const e = err as AxiosError<{ error: { message: string } }>
    error.value = e.response?.data?.error?.message ?? 'Pendaftaran gagal.'
  } finally { loading.value = false }
}
</script>
