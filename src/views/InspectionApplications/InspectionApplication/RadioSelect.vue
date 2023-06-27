<template>
  <div>
  <fieldset :class="{ invalid: !valid }">
    <legend>
      {{ label }}
      <span v-if="required">
        *
      </span>
    </legend>
    <label v-for="{ label, value }, i in options" tabindex="0">
      <input :value="value" v-model="model" type="radio">
      {{ label }}
    </label>
    <label v-if="acceptOther" class="other" @click="focusOther" tabindex="0" :class="{ invalid: !otherValid }">
      <input value="other" v-model="model" type="radio">
      その他 :
      <input v-model="other" v-if="model === 'other'" ref="otherInput" @blur="focus = false">
      <span v-else>
        {{ other }}&nbsp;
      </span>
    </label>
  </fieldset>
  <Transition>
    <p v-if="acceptOther && model === 'other' && !otherValid">
      「その他」の具体的な内容を入力して下さい
    </p>
    <p v-else-if="!valid">
      選択して下さい
    </p>
  </Transition>
  </div>
</template>

<script setup>
import { computed, toRefs, ref, watch } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  options: { type: Array },
  modelValue: { type: String, default: '' },
  acceptOther: { type: Boolean },
  required: { type: Boolean },
  validator: { type: Function },
});
const { modelValue, options, acceptOther, validator } = toRefs(props);

const emit = defineEmits({
  'update:modelValue': (value) => typeof value === 'string',
});

const model = computed({
  get: () => modelValue.value.startsWith('other:') ? 'other' : modelValue.value,
  set: (value) => {
    emit('update:modelValue', value === 'other' ? `other:${other.value}` : value);
  },
});

let tempOther = modelValue.value.startsWith('other:') ? modelValue.value.slice('other:'.length) : '';
const other = computed({
  get: () => {
    if (modelValue.value.startsWith('other:')) {
      tempOther = modelValue.value.slice('other:'.length);
    }
    return tempOther;
  },
  set: (value) => {
    tempOther = value;
    emit('update:modelValue', `other:${value}`);
  },
});

const otherInput = ref(null);
async function focusOther() {
  const unwatch = watch(otherInput, (target) => {
    if (target) target.focus();
    unwatch();
  });
}
watch(otherInput, () => {
  focus.value = true;
});

const focus = ref(true);
const otherValid = computed(() => focus.value || other.value !== '');

const valid = computed(() => focus.value || options.value.map(({ value }) => value).includes(model.value) || acceptOther.value && model.value === 'other' && otherValid.value);

watch(validator, (v) => {
  focus.value = !v;
})

defineExpose({
  validate: () => { focus.value = false; },
});
</script>

<style scoped>
fieldset {
  @apply border border-gray-700 flex flex-col rounded px-2 pt-1 gap-x-4 gap-y-1 pb-2 bg-white;
}
legend {
  @apply -mt-2 text-xs px-1 bg-white w-fit rounded-full;
}
legend>span {
  @apply text-red-500;
}
label {
  @apply mx-2 text-sm flex items-center gap-1 justify-start outline-none;
}
.other input:not([type=radio]), .other span {
  @apply grow border-b border-gray-400 text-sm px-1 ml-2 text-gray-700 cursor-text;
}
.other span {
  @apply bg-zinc-50 shadow-inner text-gray-400;
}
fieldset:focus-within {
  @apply shadow-inner border-2 border-gray-500;
}
fieldset:focus-within legend {
  @apply font-medium;
}
.other input:not([type=radio]) {
  @apply outline-none border-gray-600 rounded-t;
}
.other input:not([type=radio]):focus {
  @apply border-b-2 shadow-inner;
}
* {
  @apply transition-all;
}
.other.invalid {
}
.other.invalid input:last-child {
  @apply border-b-2 border-red-500 text-red-500 shadow-inner;
}
.other.invalid input:first-child {
  @apply text-red-500;
}
fieldset.invalid {
  @apply border-red-500 border-2;
}
fieldset.invalid>legend {
  @apply text-red-500 font-medium;
}
div>p {
  @apply text-red-500 text-xs mx-1 mt-1;
}
.v-enter-from, .v-leave-to {
  @apply max-h-0 scale-y-0 mt-0;
}
.v-enter-to, .v-leave-from {
  @apply max-h-[1rem] scale-y-100;
}
.v-enter-active, .v-leave-active {
  @apply transition-all;
}
</style>
