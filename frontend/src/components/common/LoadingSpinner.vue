<template>
  <div class="flex items-center justify-center" :class="fullScreen ? 'min-h-screen' : 'py-8'">
    <div class="animate-spin rounded-full border-2 border-gray-100 border-t-violet-500"
         :class="size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8'">
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ size?: 'sm' | 'md' | 'lg'; fullScreen?: boolean }>()
</script>
