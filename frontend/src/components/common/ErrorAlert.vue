<template>
  <div v-if="message"
       class="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-4 py-3">
    <ExclamationCircleIcon class="h-4 w-4 mt-0.5 shrink-0" />
    <p class="text-sm font-medium leading-relaxed">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'
defineProps<{ message?: string | null }>()
</script>
