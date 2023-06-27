<template>
  <RadioSelect v-if="type === 'radio'" v-model="model" :label="label" :options="options" :acceptOther="acceptOther" :validator="validator" :required="required" ref="child"/>
  <CheckboxInput v-else-if="type === 'checkbox'" v-model="model" :label="label" :validator="validator" ref="child"/>
  <DatetimeInput v-else-if="type === 'datetimeRequest'" v-model="model" :label="label" :validator="validator" ref="child"/>
  <TextareaInput v-else-if="type === 'textarea'" v-model="model" :label="label" :validator="validator" ref="child"/>
  <EmailInput v-else-if="type === 'email'" v-model="model" :label="label" :validator="validator" ref="child"/>
  <ContactInput v-else-if="type === 'contact'" v-model="model" :label="label" :validator="validator" :required="required" ref="child"/>
  <TextInput v-else :label="label" :validator="validator" :invalidMessage="invalidMessage" v-model="model" :required="required" ref="child"/>
</template>

<script setup>
import RadioSelect from './RadioSelect.vue';
import CheckboxInput from './CheckboxInput.vue';
import TextInput from './TextInput.vue';
import { computed, ref, toRefs } from 'vue';
import DatetimeInput from './DatetimeInput.vue';
import TextareaInput from './TextareaInput.vue';
import EmailInput from './EmailInput.vue';
import ContactInput from './ContactInput.vue';

const props = defineProps({
  data: { type: Object, required: true },
  name: { type: String, required: true },
  type: { type: String, default: 'text' },
  label: { type: String },
  options: { type: Array },
  acceptOther: { type: Boolean },
  validator: { type: Function },
  invalidMessage: { type: String },
  required: { type: Boolean },
});
const { name, data } = toRefs(props);

const emit = defineEmits({
  input: (payload) => {
    const [[_, value]] = Object.entries(payload);
    return typeof value === 'string';
  },
});

const model = computed({
  get: () => data.value[name.value],
  set: (v) => {
    const payload = (typeof v === 'string' || typeof v === 'boolean') ? { [name.value]: v } : Object.fromEntries(Object.entries(v).map(([key, value]) => [`${name.value}.${key}`, value]));
    emit('input', payload);
  },
});

const child = ref(null);

function validate() {
  child.value.validate();
}
defineExpose({
  validate,
});
</script>
