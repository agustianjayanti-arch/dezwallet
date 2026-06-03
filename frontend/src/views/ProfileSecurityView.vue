<template>
  <div class="max-w-md mx-auto space-y-5">
    <div class="flex items-center gap-3">
      <RouterLink to="/profile" class="p-2 rounded-xl hover:bg-gray-100 transition-colors">
        <ChevronLeftIcon class="h-5 w-5 text-gray-500" />
      </RouterLink>
      <h1 class="page-header">Keamanan Akun</h1>
    </div>

    <!-- Ganti Password -->
    <div class="card space-y-4">
      <h2 class="font-bold text-gray-800 flex items-center gap-2">
        <LockClosedIcon class="h-5 w-5 text-violet-500" /> Ganti Password
      </h2>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Password Lama</label>
        <input v-model="pw.old" type="password" class="input-field" placeholder="••••••••" />
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Password Baru</label>
        <input v-model="pw.new" type="password" class="input-field" placeholder="Min. 8 karakter" />
      </div>
      <ErrorAlert :message="pwError" />
      <div v-if="pwSuccess" class="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
        <CheckCircleIcon class="h-4 w-4 text-emerald-500" />
        <p class="text-sm text-emerald-700 font-medium">Password berhasil diubah.</p>
      </div>
      <button @click="handleChangePassword" :disabled="pwLoading || !pw.old || pw.new.length < 8"
              class="btn-primary w-full">
        <span v-if="pwLoading">Menyimpan...</span>
        <span v-else>Simpan Password</span>
      </button>
    </div>

    <!-- Ganti PIN -->
    <div class="card space-y-4">
      <h2 class="font-bold text-gray-800 flex items-center gap-2">
        <KeyIcon class="h-5 w-5 text-emerald-500" /> Ganti PIN Transaksi
      </h2>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">PIN Lama</label>
        <input v-model="pin.old" type="password" inputmode="numeric" maxlength="6"
               class="input-field text-center tracking-[0.5em] text-xl" placeholder="••••••" />
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">PIN Baru</label>
        <input v-model="pin.new" type="password" inputmode="numeric" maxlength="6"
               class="input-field text-center tracking-[0.5em] text-xl" placeholder="••••••" />
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Password Akun</label>
        <input v-model="pin.password" type="password" class="input-field" placeholder="••••••••" />
      </div>
      <ErrorAlert :message="pinError" />
      <div v-if="pinSuccess" class="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
        <CheckCircleIcon class="h-4 w-4 text-emerald-500" />
        <p class="text-sm text-emerald-700 font-medium">PIN berhasil diubah.</p>
      </div>
      <button @click="handleChangePin"
              :disabled="pinLoading || pin.old.length !== 6 || pin.new.length !== 6 || !pin.password"
              class="btn-primary w-full">
        <span v-if="pinLoading">Menyimpan...</span>
        <span v-else>Simpan PIN</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { authApi } from '@/api/auth'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { ChevronLeftIcon, LockClosedIcon, KeyIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import type { AxiosError } from 'axios'

// Password
const pw = ref({ old: '', new: '' })
const pwLoading = ref(false); const pwError = ref<string | null>(null); const pwSuccess = ref(false)

async function handleChangePassword() {
  pwError.value = null; pwSuccess.value = false; pwLoading.value = true
  try {
    await authApi.changePassword({ oldPassword: pw.value.old, newPassword: pw.value.new })
    pwSuccess.value = true; pw.value = { old: '', new: '' }
  } catch (err) {
    const e = err as AxiosError<{ error: { message: string } }>
    pwError.value = e.response?.data?.error?.message ?? 'Gagal mengubah password.'
  } finally { pwLoading.value = false }
}

// PIN
const pin = ref({ old: '', new: '', password: '' })
const pinLoading = ref(false); const pinError = ref<string | null>(null); const pinSuccess = ref(false)

async function handleChangePin() {
  pinError.value = null; pinSuccess.value = false; pinLoading.value = true
  try {
    await authApi.changePin({ oldPin: pin.value.old, newPin: pin.value.new, password: pin.value.password })
    pinSuccess.value = true; pin.value = { old: '', new: '', password: '' }
  } catch (err) {
    const e = err as AxiosError<{ error: { message: string } }>
    pinError.value = e.response?.data?.error?.message ?? 'Gagal mengubah PIN.'
  } finally { pinLoading.value = false }
}
</script>
