<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">Audit Log</h1>

    <div class="card">
      <div class="flex flex-wrap gap-3 mb-4">
        <input v-model="filters.action" @input="debouncedLoad" type="text"
               placeholder="Filter aksi..." class="input-field w-auto text-sm" />
        <input v-model="filters.startDate" @change="load" type="date" class="input-field w-auto text-sm" />
        <input v-model="filters.endDate" @change="load" type="date" class="input-field w-auto text-sm" />
      </div>

      <LoadingSpinner v-if="loading" size="sm" />
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 text-left text-gray-500">
              <th class="pb-3 font-medium">Waktu</th>
              <th class="pb-3 font-medium">Aktor</th>
              <th class="pb-3 font-medium">Aksi</th>
              <th class="pb-3 font-medium">Entitas</th>
              <th class="pb-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50">
              <td class="py-3 text-gray-400 text-xs">{{ formatDate(log.created_at) }}</td>
              <td class="py-3">
                <span class="font-mono text-xs text-gray-600">{{ log.actor_id?.slice(0, 8) ?? 'system' }}</span>
                <span class="badge-info ml-1 text-xs">{{ log.actor_type }}</span>
              </td>
              <td class="py-3 font-medium text-gray-700">{{ log.action }}</td>
              <td class="py-3 text-xs text-gray-400">
                {{ log.entity_type }} {{ log.entity_id?.slice(0, 8) }}
              </td>
              <td class="py-3 text-xs text-gray-400">{{ log.ip_address ?? '-' }}</td>
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
import { adminApi } from '@/api/admin'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const logs = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pagination = ref<any>(null)
const filters = ref({ action: '', startDate: '', endDate: '' })
let debounceTimer: ReturnType<typeof setTimeout>

onMounted(load)

async function load() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: page.value }
    if (filters.value.action) params.action = filters.value.action
    if (filters.value.startDate) params.startDate = filters.value.startDate
    if (filters.value.endDate) params.endDate = filters.value.endDate
    const res = await adminApi.getAuditLogs(params)
    logs.value = res.data.data.logs
    pagination.value = res.data.data.pagination
  } finally { loading.value = false }
}

function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; load() }, 400)
}

async function changePage(p: number) { page.value = p; await load() }

function formatDate(ts: string) {
  return new Date(ts).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
}
</script>
