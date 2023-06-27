<template>
  <label tabindex="0">
    <input v-model="model" type="checkbox">
    <span>
      {{ label }}
    </span>
  </label>
</template>

<script setup>
import { computed, toRefs } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: Boolean },
});
const { modelValue } = toRefs(props);

const emit = defineEmits({
  'update:modelValue': (value) => typeof value === 'boolean',
});

const model = computed({
  get: () => modelValue.value,
  set: (value) => emit('update:modelValue', value),
});
</script>

<style scoped>
label {
  @apply flex items-center outline-none;
}

span {
  @apply ml-1 text-sm;
}
</style>
