<template>
  <label :class="{ invalid: !valid }">
    <span>
      {{ label }}
      <span v-if="required">
        *
      </span>
    </span>
    <input :type="type" v-model="text" @blur="emit('blur')" @focus="emit('focus')">
    <Transition>
      <p v-if="!valid">
        {{ invalidMessage }}
      </p>
    </Transition>
  </label>
</template>

<script setup>
import { computed, toRefs } from 'vue';

const props = defineProps({
  modelValue: { type: String },
  label: { type: String },
  type: { type: String, default: 'text' },
  required: { type: Boolean },
  validator: { type: Function },
  invalidMessage: { type: String },
});
const { modelValue, validator } = toRefs(props);

const emit = defineEmits({
  'update:modelValue': (value) => value instanceof String,
  focus: null,
  blur: null,
});

const text = computed({
  get: () => modelValue.value,
  set: (value) => emit('update:modelValue', value),
});

const valid = computed(() => !validator.value || validator.value(modelValue.value));
</script>

<style scoped>
input {
  @apply border border-gray-700 rounded p-2 font-light outline-none;
}

input:focus {
  @apply shadow-inner font-medium border-2 border-gray-500;
}

label.invalid input {
  @apply border-red-500 border-2 text-red-500;
}

label.invalid>span {
  @apply text-red-500 font-medium;
}

label>span {
  @apply w-fit ml-2 -mb-2.5 px-1 z-10 bg-white rounded-full text-xs;
}

label {
  @apply flex flex-col;
}

label>span>span {
  @apply text-red-500
}

label:focus-within span {
  @apply font-bold;
}

* {
  @apply transition-all;
}

p {
  @apply text-red-500 text-xs mt-1 mx-1;
}

.v-enter-from, .v-leave-to {
  @apply scale-y-0 max-h-0 mt-0;
}

.v-leave-from, .v-enter-to {
  @apply scale-y-100 max-h-[1rem];
}
</style>
