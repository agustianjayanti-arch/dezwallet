<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white">DezPay</h1>
        <p class="text-yellow-400 mt-1 text-sm font-medium">Admin Panel</p>
      </div>
      <div class="bg-gray-800 rounded-2xl p-8 shadow-xl">
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Email Admin</label>
            <input v-model="email" type="email" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input v-model="password" type="password" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400" required />
          </div>
          <div v-if="error" class="text-red-400 text-sm bg-red-900/30 rounded-lg p-3">{{ error }}</div>
          <button type="submit" :disabled="loading"
                  class="w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50">
            <span v-if="loading">Masuk...</span>
            <span v-else>Masuk sebagai Admin</span>
          </button>
        </form>
        <p class="text-center mt-4">
          <RouterLink to="/login" class="text-gray-400 text-sm hover:text-gray-300">← Kembali ke login user</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { adminApi } from '@/api/admin'
import type { AxiosError } from 'axios'

const router = useRouter()
const email = ref(''); const password = ref('')
const loading = ref(false); const error = ref<string | null>(null)

async function handleLogin() {
  error.value = null; loading.value = true
  try {
    const res = await adminApi.login({ email: email.value, password: password.value })
    const { admin, token } = res.data.data
    localStorage.setItem('dezpay_admin_token', token)
    localStorage.setItem('dezpay_admin', JSON.stringify(admin))
    router.push('/admin/dashboard')
  } catch (err) {
    const e = err as AxiosError<{ error: { message: string } }>
    error.value = e.response?.data?.error?.message ?? 'Login gagal.'
  } finally { loading.value = false }
}
</script>
