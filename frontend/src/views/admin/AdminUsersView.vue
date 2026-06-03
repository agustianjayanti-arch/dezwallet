<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">Manajemen Pengguna</h1>

    <div class="card">
      <div class="flex gap-3 mb-4">
        <input v-model="search" @input="debouncedLoad" type="text"
               placeholder="Cari nama atau email..." class="input-field max-w-xs" />
      </div>

      <LoadingSpinner v-if="loading" size="sm" />
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 text-left text-gray-500">
              <th class="pb-3 font-medium">Nama</th>
              <th class="pb-3 font-medium">Email</th>
              <th class="pb-3 font-medium">Saldo</th>
              <th class="pb-3 font-medium">Status</th>
              <th class="pb-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50">
              <td class="py-3">
                <RouterLink :to="`/admin/users/${u.id}`" class="font-medium text-gray-800 hover:text-primary-600">
                  {{ u.name }}
                </RouterLink>
              </td>
              <td class="py-3 text-gray-500">{{ u.email }}</td>
              <td class="py-3 font-medium">{{ formatCurrency(u.balance) }}</td>
              <td class="py-3">
                <span :class="u.status === 'active' ? 'badge-success' : 'badge-danger'">{{ u.status }}</span>
              </td>
              <td class="py-3">
                <button v-if="u.status === 'active'" @click="freeze(u.id)"
                        class="text-xs text-red-600 hover:underline">Bekukan</button>
                <button v-else @click="unfreeze(u.id)"
                        class="text-xs text-green-600 hover:underline">Aktifkan</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pagination && pagination.totalPages > 1" class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <button @click="changePage(page - 1)" :disabled="!pagination.hasPrev" class="btn-secondary text-sm py-1.5 px-3">← Sebelumnya</button>
        <span class="text-sm text-gray-500">{{ page }} / {{ pagination.totalPages }}</span>
        <button @click="changePage(page + 1)" :disabled="!pagination.hasNext" class="btn-secondary text-sm py-1.5 px-3">Berikutnya →</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { adminApi } from '@/api/admin'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const users = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const page = ref(1)
const pagination = ref<any>(null)
let debounceTimer: ReturnType<typeof setTimeout>

onMounted(load)

async function load() {
  loading.value = true
  try {
    const res = await adminApi.listUsers({ search: search.value || undefined, page: page.value })
    users.value = res.data.data.users
    pagination.value = res.data.data.pagination
  } finally { loading.value = false }
}

function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; load() }, 400)
}

async function changePage(p: number) { page.value = p; await load() }

async function freeze(id: string) {
  await adminApi.freezeAccount(id); await load()
}
async function unfreeze(id: string) {
  await adminApi.unfreezeAccount(id); await load()
}

function formatCurrency(n: string | number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n))
}
</script>
