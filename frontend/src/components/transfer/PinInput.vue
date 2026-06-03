<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">PIN Transaksi</label>
    <input :value="modelValue" @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
           type="password" inputmode="numeric" pattern="\d{6}" maxlength="6"
           placeholder="••••••" class="input-field text-center text-2xl tracking-widest"
           :required="required" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string; required?: boolean }>()
defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>
