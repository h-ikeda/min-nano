<template>
  <fieldset :class="{ invalid: !valid, required }">
    <legend>
      {{ label }}
    </legend>
    <section>
      <label for="contact-name" :class="{ invalid: !validName }">
        <span>
          お名前
        </span>
      </label>
      <input v-model="name" id="contact-name" :class="{ invalid: !validName }" @blur="nameFocus = false"/>
      <Transition>
        <p class="col-start-2" v-if="!validName">
          連絡先の宛名を入力して下さい
        </p>
      </Transition>
    </section>
    <p :class="{ invalid: !validPreference }">
      優先したい連絡手段を選択して下さい
    </p>
    <label tabindex="0">
      <input type="radio" v-model="preference" value="tel">
      電話
    </label>
    <label tabindex="0">
      <input type="radio" v-model="preference" value="email">
      Eメール
    </label>
    <label tabindex="0">
      <input type="radio" v-model="preference" value="sms">
      ショートメール (SMS)
    </label>
    <label tabindex="0">
      <input type="radio" v-model="preference" value="other">
      その他 (SNS等)
    </label>
    <section>
      <label for="contact-tel" :class="{ invalid: !validTel }">
        <span>
          電話番号
        </span>
      </label>
      <input v-model="tel" type="tel" id="contact-tel" :class="{ invalid: !validTel }" @blur="validate"/>
      <Transition>
        <p class="col-start-2" v-if="tel && tel.length && !correctTel">
          電話番号を正しく入力して下さい
        </p>
        <p class="col-start-2" v-else-if="!validTel">
          優先したい連絡手段に選択されています
        </p>
      </Transition>
      <label for="contact-email" :class="{ invalid: !validEmail || email && email.length && !correctEmail }">
        <span>
          メールアドレス
        </span>
      </label>
      <input v-model="email" type="email" id="contact-email" :class="{ invalid: !validEmail || email && email.length && !correctEmail }" @blur="validate"/>
      <Transition>
        <p class="col-start-2" v-if="email && email.length && !correctEmail">
          メールアドレスを正しく入力して下さい
        </p>
        <p class="col-start-2" v-else-if="!validEmail">
          優先したい連絡手段に選択されています
        </p>
      </Transition>
      <label for="contact-other-account" :class="{ invalid: !validOtherAccount }">
        <span>
          その他 (SNS等)
        </span>
      </label>
      <input v-model="otherAccount" id="contact-other-account" :class="{ invalid: !validOtherAccount }" @blur="validate"/>
      <Transition>
        <p class="col-start-2" v-if="!validOtherAccount">
          優先したい連絡手段に選択されています
        </p>
      </Transition>
    </section>
  </fieldset>
</template>

<script setup>
import { computed, toRefs, ref } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: Object },
  required: { type: Boolean },
});
const { modelValue } = toRefs(props);

const emit = defineEmits({
  'update:modelValue': null,
  valid: null,
});

const name = computed({
  get: () => modelValue.value && modelValue.value.name,
  set: (n) => emit('update:modelValue', { name: n }),
});

const email = computed({
  get: () => modelValue.value && modelValue.value.email,
  set: (e) => emit('update:modelValue', { email: e }),
});

const tel = computed({
  get: () => modelValue.value && modelValue.value.tel,
  set: (t) => emit('update:modelValue', { tel: t }),
});

const otherAccount = computed({
  get: () => modelValue.value && modelValue.value.otherAccount,
  set: (a) => emit('update:modelValue', { otherAccount: a }),
});

const preference = computed({
  get: () => modelValue.value && modelValue.value.preference,
  set: (p) => emit('update:modelValue',{ preference: p }),
});

const validName = computed(() => nameFocus.value || name.value && name.value !== '');
const nameFocus = ref(true);

const telFocus = ref(true);
const validTel = computed(() => telFocus.value || !['tel', 'sms'].includes(preference.value) || tel.value && correctTel.value);
const correctTel = computed(() => /^[\+\(\)0-9\-]+$/i.test(tel.value));

const emailFocus = ref(true);
const validEmail = computed(() => emailFocus.value || preference.value !== 'email' || (email.value && correctEmail.value));
const correctEmail = computed(() => validateEmail(email.value));

const otherAccountFocus = ref(true);
const validOtherAccount = computed(() => otherAccountFocus.value || preference.value !== 'other' || otherAccount.value && otherAccount.value !== '');

const validPreference = computed(() => ['tel', 'email', 'sms', 'other'].includes(preference.value) || (telFocus.value && emailFocus.value && otherAccountFocus.value));

const valid = computed(() => validName.value && validTel.value && validEmail.value && validOtherAccount.value);

function validateEmail(email) {
  return /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(email);
}

function validate() {
  nameFocus.value = false;
  telFocus.value = false;
  emailFocus.value = false;
  otherAccountFocus.value = false;
}

defineExpose({
  validate,
});
</script>

<style scoped>
fieldset {
  @apply border border-gray-700 rounded px-4 flex flex-col bg-white pb-2.5 pt-1;
}
fieldset.invalid {
  @apply border-red-500 border-2;
}
legend {
  @apply text-xs px-1 -ml-2 w-fit rounded bg-white;
}
fieldset.invalid>legend {
  @apply text-red-500 font-bold;
}
section>label {
  @apply text-sm flex after:content-[':'];
}
section>label>span {
  @apply grow pr-1;
  text-align-last: justify;
}
section>input {
  @apply outline-none border-b border-gray-700 px-1.5 py-0.5 col-start-2 bg-slate-50 rounded-t;
}
section>input:focus {
  @apply border-b-2 shadow-inner;
}
fieldset:focus-within {
  @apply border-2;
}
fieldset:focus-within>legend {
  @apply font-medium;
}
section {
  @apply grid gap-x-2 gap-y-1.5 items-center grid-cols-[max-content,auto];
}
section:last-child {
  @apply mt-3;
}
fieldset>p {
  @apply text-xs mt-6 mb-1;
}
fieldset>label {
  @apply text-sm py-0.5 flex items-center gap-x-1;
}
section>label.invalid {
  @apply text-red-500;
}
section>input.invalid {
  @apply border-red-500 border-b-2 bg-red-50;
}
section>p {
  @apply text-xs text-red-500 -mt-1 mb-1;
}
.v-enter-from, .v-leave-to {
  @apply max-h-0 scale-y-0 -mb-1;
}
.v-enter-to, .v-leave-from {
  @apply max-h-[1rem] scale-100;
}
.v-enter-active, .v-leave-active {
  @apply transition-all;
}
.required>legend {
  @apply after:content-['*'];
}
fieldset>p.invalid {
  @apply text-red-500;
}
fieldset>p.invalid~label {
  @apply text-red-500;
}
fieldset.required>legend::after {
  content: ' *';
  @apply text-red-500;
}
</style>
