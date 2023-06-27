<template>
  <label>
    <span :class="{ required }">
      {{ label }}
    </span>
    <textarea v-model="text" rows="4" :required="required"/>
  </label>
</template>

<script setup>
import { computed, toRefs } from 'vue';

const props = defineProps({
  label: { type: String },
  modelValue: { type: String, default: '' },
  required: { type: Boolean },
});
const { modelValue } = toRefs(props);

const emit = defineEmits({
  'update:modelValue': (v) => typeof v === 'string',
});

const text = computed({
  get: () => modelValue.value,
  set: (v) => {
    emit('update:modelValue', v);
  },
});
</script>

<style scoped>
label {
  @apply flex flex-col;
}
textarea {
  @apply border border-gray-700 rounded outline-none resize-none px-3 py-2 font-normal;
}
textarea:focus {
  @apply border-2;
}
label:focus-within {
  @apply font-medium;
}
label>span {
  @apply text-xs -mb-2 z-10 ml-2 px-1 bg-white w-fit;
}
label.required>span {
  @apply after:content-['*'];
}
</style>
