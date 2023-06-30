<template>
  <p class="h-full w-fit mx-auto flex flex-col justify-center gap-y-4">
    <RouterLink :to="editInspectionApplicationLink(drafting)" v-if="drafting" class="link">続きを入力する</RouterLink>
    <button @click="create" class="link">新規に依頼する</button>
    <RouterLink :to="listInspectionApplicationsLink" v-if="listEnabled" class="link">直近の依頼を確認する</RouterLink>
  </p>
</template>

<script setup>
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'vue-router';
import { CreateInspectionApplication, EditInspectionApplication, ListInspectionApplications } from '../../routes';
import { auth, firestore } from '../../firebase';
import { onBeforeUnmount, ref } from 'vue';
import { collection, limit, onSnapshot, query, setDoc, where, doc } from 'firebase/firestore';
import { applicantId, inspectionApplicationsCollectionId } from '../../constants';
import { defaults } from './InspectionApplication/fields';

const createInspectionApplicationLink = { name : CreateInspectionApplication };
const listInspectionApplicationsLink = { name: ListInspectionApplications };
const editInspectionApplicationLink = (applicationId) => ({ name: EditInspectionApplication, params: { applicationId } });

const router = useRouter();
const listEnabled = ref(false);
const drafting = ref(null);
let unwatch;

onBeforeUnmount(onAuthStateChanged(auth, (user) => {
  if (unwatch) unwatch.forEach((u) => u());
  unwatch = [
    onSnapshot(query(collection(firestore, inspectionApplicationsCollectionId), where(applicantId, '==', user.uid), where('status', '!=', 'created'), limit(1)), (snapshot) => {
      listEnabled.value = !snapshot.empty;
    }),
    onSnapshot(query(collection(firestore, inspectionApplicationsCollectionId), where(applicantId, '==', user.uid), where('status', '==', 'created'), limit(1)), (snapshot) => {
      drafting.value = snapshot.empty ? null : snapshot.docs[0].id;
    }),
  ];
}));

onBeforeUnmount(() => {
  if (unwatch) unwatch.forEach((u) => u());
});

async function create() {
  if (drafting.value && !confirm('入力中のデータは消去されます。よろしいですか?')) return;
  if (drafting.value) {
    await setDoc(doc(firestore, inspectionApplicationsCollectionId, drafting.value), { status: 'created', [applicantId]: auth.currentUser.uid, ...defaults });
  }
  router.push(createInspectionApplicationLink);
}
</script>

<style scoped>
.link {
  @apply px-6 py-3 rounded-full text-center font-medium border border-gray-600 text-gray-600;
}
.link:first-child {
  @apply border-none bg-gray-900 text-gray-100;
}
</style>
