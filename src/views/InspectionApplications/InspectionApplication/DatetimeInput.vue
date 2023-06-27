<template>
  <fieldset>
    <legend>
      {{ label }}
    </legend>
    <label>
      <input type="checkbox" v-model="asap">
      <span>
        希望日時なし (可能)
      </span>
    </label>
    <label v-for="n in [1,2,3]">
      <span>
        第{{ numberToKansuji(n) }}希望
      </span>
      <input type="date" v-model="date1">
      <input type="time" v-model="time1">
      <span>〜</span>
    </label>
  </fieldset>
</template>

<script setup>
import { numberToKansuji } from '../../../utils';

defineProps({
  label: { type: String, required: true },
  modelValue: { type: Object },
});

defineEmits({
  'update:modelValue': null,
});
</script>

<style scoped>
fieldset {
  @apply flex flex-col rounded bg-white border border-gray-700 px-4 pb-3 pt-1 space-y-1;
}
legend {
  @apply w-fit px-1 -ml-2 text-xs bg-white rounded-full;
}
label {
  @apply flex items-center space-x-2;
}
label:first-of-type {
  @apply space-x-1;
}
label>span {
  @apply text-sm;
}
input[type=date], input[type=time] {
  @apply border-b border-gray-700;
}
</style>
