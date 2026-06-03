<template>
  <Transition enter-active-class="transition ease-out duration-300"
              enter-from-class="opacity-0 translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition ease-in duration-200"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0">
    <div v-if="show"
         class="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <span class="text-sm font-medium">{{ message }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { watch } from 'vue'

const props = defineProps<{ message?: string; show: boolean }>()
const emit = defineEmits<{ (e: 'hide'): void }>()

watch(() => props.show, (val) => {
  if (val) setTimeout(() => emit('hide'), 3000)
})
</script>
