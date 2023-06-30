<template>
  <p class="h-full w-fit mx-auto flex flex-col justify-center gap-y-4">
    <RouterLink :to="createInspectionApplicationLink" class="link bg-gray-900 text-gray-100">新規に依頼する</RouterLink>
    <RouterLink :to="listInspectionApplicationsLink" v-if="listEnabled" class="link border border-gray-600 text-gray-600">直近の依頼を確認する</RouterLink>
  </p>
</template>

<script setup>
import { onAuthStateChanged } from 'firebase/auth';
import { CreateInspectionApplication, ListInspectionApplications } from '../../routes';
import { auth, firestore } from '../../firebase';
import { onBeforeUnmount, ref } from 'vue';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { applicantId, inspectionApplicationsCollectionId } from '../../constants';

const createInspectionApplicationLink = { name : CreateInspectionApplication };
const listInspectionApplicationsLink = { name: ListInspectionApplications };

const listEnabled = ref(false);
let unwatch;

onBeforeUnmount(onAuthStateChanged(auth, (user) => {
  if (unwatch) unwatch();
  unwatch = onSnapshot(query(collection(firestore, inspectionApplicationsCollectionId), where(applicantId, '==', user.uid), where('status', '!=', 'created'), limit(1)), (snapshot) => {
    listEnabled.value = !snapshot.empty;
  });
}));

onBeforeUnmount(() => {
  if (unwatch) unwatch();
});
</script>

<style scoped>
.link {
  @apply px-6 py-3 rounded-full text-center font-medium;
}
</style>
