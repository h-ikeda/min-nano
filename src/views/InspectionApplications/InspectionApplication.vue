<template>
  <InputField :data="applicationData" name="name" @input="update" label="物件名" class="mx-4 mt-4" :validator="nameValidator" @blur="nameValidation = true" invalidMessage="物件名は空欄にできません" required/>
  <section class="fields">
    <p>
      ご依頼内容
    </p>
    <RadioSelect v-model="scope" label="依頼する調査" :options="scopes" required ref="scopeSelect"/>
    <Transition>
      <p v-if="flat35Request" class="checkbox-group">
        <InputField :data="applicationData" @input="update" name="flat35SRequest" type="checkbox" label="フラット35Sの適用を希望する"/>
      </p>
    </Transition>
    <InputField :data="applicationData" name="buildingType" @input="update" type="radio" label="住宅の種類" :options="buildingTypeOptions" required ref="buildingTypeSelect"/>
  </section>
  <section class="fields">
    <p>
      物件資料
    </p>
    <DocumentUploader label="タップして提出する資料を選択" @complete="addAttachment" :belongsTo="`inspectionApplications/${applicationId}`" class="document-uploader" :disabled="submitted"/>
    <section v-if="attachments" class="mb-4 pt-5 gap-4 flex overflow-x-scroll relative">
      <p class="after:content-[':'] absolute top-0 left-0 text-sm text-gray-600 font-medium">
        アップロード済み (タップして編集)
      </p>
      <AttachmentCard v-for="[id, { preview, informationTypes, name }] in attachments" :id="id" :preview="preview" :informationTypes="informationTypes" :name="name" :key="id" class="flex-none w-3/5" @click.native="editorQueue.push(id)"/>
    </section>
    <section v-if="filteredDocuments.length" class="alert">
      <p v-for="{ label } in filteredDocuments">
        * {{ label }}は必須です。
      </p>
    </section>
  </section>
  <section class="fields">
    <p>
      補足情報の入力
    </p>
    <InputField :data="applicationData" :name="id" :label="label" @input="update" :type="type" :options="options" :acceptOther="acceptOther" v-for="{ id, label, type, options, acceptOther, validator } in filteredFields" :key="id" required :validator="validation[id] && (validator || ((value) => value && value !== ''))" @blur="validation[id] = true"/>
    <p v-if="!filteredFields.length" class="text-green-600">
      入力が必要な項目はありません。
    </p>
  </section>
  <section class="fields">
    <p>
      連絡事項の入力
    </p>
    <InputField :data="applicationData" :name="id" @input="update" :type="type" :label="label" v-for="{ id, label, type, required } in communication" :required="required" :key="id" :ref="(r) => communicationValidationEnabler[id] = r && r.validate"/>
  </section>
  <Transition name="message">
  <ul class="flex flex-col mx-auto w-fit mt-3 text-sm animate-appear" v-if="validationMessages && validationMessages.length" :key="messageKey">
    <li v-for="message, i of validationMessages" class="text-red-600 font-light" :key="i">
      {{ message }}
    </li>
  </ul>
  <p v-else class="mt-3 text-sm">
    &nbsp;
  </p>
  </Transition>
  <div class="flex flex-col mx-auto w-fit mt-4 mb-12 gap-y-6">
    <button @click="submit" :disabled="submitted" class="text-white font-medium" :class="{ 'animate-vibrate': validationMessages && validationMessages.length, 'bg-gray-500': submitted, 'bg-gray-800 shadow': !submitted }" :key="messageKey">
      {{ submitted ? 'ご依頼は送信済みです' : '依頼を送信' }}
    </button>
    <!--
    <button @click="save" class="border-2 border-gray-500 text-gray-700">
      一時保存
    </button>
    -->
    <RouterLink :to="{ name: MenuInspectionApplications }" class="border border-gray-700 text-gray-700 rounded-full px-6 py-1.5 m-px text-center font-medium shadow">
      メニューへ戻る
    </RouterLink>
    <button class="text-red-600 underline text-sm" @click="clear" v-if="!submitted">
      入力内容を消去
    </button>
  </div>
  <Transition name="editor-background">
    <div v-show="editingAttachmentId" class="fixed inset-0 bg-white/80 backdrop-blur z-20"></div>
  </Transition>
  <Transition name="editor">
    <AttachmentEditor v-if="editingAttachmentId" :attachment="applicationData[attachmentsId][editingAttachmentId]" @update="updateAttachment" @close="editorQueue.shift()" class="bg-white fixed inset-0 z-20"/>
  </Transition>
  <Spinner v-if="loading" class="fixed inset-0 bg-zinc-50 z-50"/>
</template>

<script setup>
import { toRefs, watch, ref, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { addDoc, doc, collection, onSnapshot, updateDoc, query, where, getDocs, limit, arrayUnion, setDoc } from 'firebase/firestore';
import { firestore, auth, app } from '../../firebase';
import { inspectionApplicationsCollectionId, applicantId, attachmentsId, informationTypesId } from '../../constants';
import DocumentUploader from './InspectionApplication/DocumentUploader.vue';
import InputField from './InspectionApplication/InputField.vue';
import { onAuthStateChanged } from '@firebase/auth';
import { computed } from '@vue/reactivity';
import { EditInspectionApplication, ListInspectionApplications, MenuInspectionApplications, SubmittedInspectionApplication } from '../../routes';
import AttachmentEditor from './InspectionApplication/AttachmentEditor.vue';
import { specific, communication, requiredDocuments, scopeOptions, buildingTypeOptions, defaults } from './InspectionApplication/fields';
import AttachmentCard from './InspectionApplication/AttachmentCard.vue';
import RadioSelect from './InspectionApplication/RadioSelect.vue';
import Spinner from '../../components/Spinner.vue';

const props = defineProps({
  applicationId: { type: String, default: null },
});
const { applicationId } = toRefs(props);

const router = useRouter();
const db = collection(firestore, inspectionApplicationsCollectionId);

const applicationData = ref({});
const submitted = computed(() => applicationData.value.status === 'submitted');
const uid = ref(auth.currentUser && auth.currentUser.uid);
onBeforeUnmount(onAuthStateChanged(auth, (user) => { uid.value = user && user.uid }));

const docRef = computed(() => applicationId.value && doc(db, applicationId.value));
const docQuery = computed(() => uid.value
  && query(
    db,
    where(applicantId, '==', uid.value),
    where('status', '==', 'created'),
    limit(1),
  ));

let unwatchApplicationData;
function unwatchApplicationDataIfExists() {
  if (unwatchApplicationData) unwatchApplicationData();
  loading.value = true;
}
onBeforeUnmount(unwatchApplicationDataIfExists);

const loading = ref(true);
watch(docRef, (r) => {
  unwatchApplicationDataIfExists();
  if (!r) return;
  unwatchApplicationData = onSnapshot(r, (result) => {
    applicationData.value = result.data();
    loading.value = false;
  });
}, { immediate: true });

watch([docRef, docQuery], async ([r, q]) => {
  if (r) return;
  if (!q) return;
  const result = await getDocs(q);
  const { id } = result.empty
    ? await addDoc(db, { [applicantId]: uid.value, status: 'created', ...defaults })
    : result.docs.at(0);
  router.replace({ name: EditInspectionApplication, params: { applicationId: id } });
}, { immediate: true });

function update(payload) {
  updateDoc(docRef.value, payload);
}

const attachments = computed(() => applicationData.value[attachmentsId] && Object.entries(applicationData.value[attachmentsId]).sort(([_a, { timeCreated: a }], [_b, { timeCreated: b }]) => (new Date(b)) - (new Date(a))));
async function addAttachment(id, data) {
  await updateDoc(docRef.value, {
    [`${attachmentsId}.${id}`]: data,
  });
  editorQueue.value.push(id);
}

const editorQueue = ref([]);
const editingAttachmentId = computed(() => editorQueue.value[0]);
function updateAttachment(data) {
  const mergeData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [`${attachmentsId}.${editingAttachmentId.value}.${key}`, value]),
  );
  updateDoc(docRef.value, mergeData);
}

const providedInformations = computed(() => Object.fromEntries((attachments.value || []).map(([_id, { [informationTypesId]: i }]) => Object.entries(i || {}).filter(([_key, value]) => value)).flat()));
const filteredFields = computed(() => specific.filter(({ id }) => !providedInformations.value[id]));
const filteredDocuments = computed(() => requiredDocuments.filter(({ id, targets }) => targets.includes(applicationData.value.buildingType) && !providedInformations.value[id]));

const flat35Request = computed(() => applicationData.value.scope && applicationData.value.scope.includes('flat35'));
const scopes = scopeOptions.map(({ label, value }) => ({ label, value: value.join(';')}));
const scope = computed({
  get: () => applicationData.value.scope && applicationData.value.scope.join(';'),
  set: (s) => update({ scope: s.split(';') }),
});

function save() {
  updateDoc(docRef.value, { status: 'saved' });
  router.push({ name: ListInspectionApplications });
}

const validationMessages = ref(null);
const messageKey = ref(0);

async function submit() {
  const { result, messages } = validate();
  if (!result) {
    if (validationMessages.value) ++messageKey.value;
    validationMessages.value = messages;
    return;
  }
  await updateDoc(docRef.value, { status: 'submitted' });
  router.push({ name: SubmittedInspectionApplication });
}

const nameValidation = ref(undefined);
const nameValidator = computed(() => nameValidation.value && ((name) => name && name !== ''));
const validation = ref(Object.fromEntries([...specific.map(({ id }) => [id, undefined])]));
const communicationValidationEnabler = Object.fromEntries([...communication.map(({ id }) => [id, undefined])]);

const scopeSelect = ref(null);
const buildingTypeSelect = ref(null);

function validate() {
  nameValidation.value = true;
  buildingTypeSelect.value.validate();
  scopeSelect.value.validate();
  Object.assign(validation.value, Object.fromEntries(specific.map(({ id }) => [id, true])));
  communicationValidationEnabler.contactTo();
  const messages = ['入力内容を確認して下さい'];
  const { name, buildingType, scope, contactTo } = applicationData.value;
  const result = (name && nameValidator.value(name))
    && (scope && scope.every((s) => ['flat35', 'inspection'].includes(s)))
    && buildingType && ['detouched', 'apartment'].includes(buildingType)
    && (buildingType === 'apartment' || providedInformations.value.landRegistration)
    && providedInformations.value.buildingRegistration
    && filteredFields.value.every(({ id }) => applicationData.value[id] && applicationData.value[id].length)
    && contactTo && contactTo.name && contactTo.name.length
    && contactTo.preference && ['tel', 'email', 'sms', 'other'].includes(contactTo.preference)
    && (['tel', 'sms'].includes(contactTo.preference) && contactTo.tel && /^[\+\(\)0-9\-]+$/i.test(contactTo.tel)
      || contactTo.preference === 'email' && contactTo.email && /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(contactTo.email)
      || contactTo.preference === 'other' && contactTo.otherAccount && contactTo.otherAccount.length);
  return {
    result,
    messages,
  };
}

function clear() {
  if (!confirm('全ての入力項目を消去します。よろしいですか?')) return;
  setDoc(docRef.value, { status: 'created', [applicantId]: uid.value, ...defaults });
}
</script>

<style scoped>
button, .back {
  @apply px-6 py-2 rounded-full;
}
section.fields {
  @apply mt-6 mx-4 border-t-4 border-double border-gray-500 space-y-3 pt-1 pb-2 rounded-b;
}
section.fields>p:first-child {
  @apply -mt-3.5 ml-2.5 bg-slate-50 rounded w-fit px-1 text-xs font-medium text-gray-700;
}
section.fields:focus-within {
  @apply shadow-inner border-black;
}
section.fields:focus-within>p:first-child {
  @apply font-bold;
}
.document-uploader {
  @apply -mx-1 rounded-xl py-4 shadow grid justify-center bg-amber-400 text-gray-800 text-lg;
}
section.fields, section.fields>* {
  @apply transition-all;
}
.v-enter-from, .v-leave-to {
  @apply max-h-0 scale-y-0;
}
.v-enter-to, .v-leave-from {
  @apply max-h-[2rem] scale-y-100;
}
.v-enter-active, .v-leave-active {
  @apply origin-top;
}
.editor-enter-from, .editor-leave-to {
  @apply translate-y-full;
}
.editor-enter-to, .editor-leave-from {
  @apply translate-y-0;
}
.editor-enter-active, .editor-leave-active {
  @apply transition-all;
}
.editor-background-enter-from, .editor-background-leave-to {
  @apply scale-150;
}
.editor-background-enter-to, .editor-background-leave-from {
  @apply scale-100;
}
.editor-background-enter-active, .editor-background-leave-active {
  @apply transition-all;
}
.alert {
  @apply text-red-600 text-sm;
}
.checkbox-group {
  @apply border border-gray-700 rounded px-4 py-2 bg-white;
}
.checkbox-group:focus-within {
  @apply border-2;
}
.message-enter-to {
  @apply scale-y-100;
}
.message-enter-from {
  @apply scale-y-0;
}
.message-enter-active {
  @apply transition-transform delay-300;
}
</style>
