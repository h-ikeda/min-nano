<template>
  <p class="text-sm py-2 px-4 mt-2 before:content-['↓']">
    直近の送信済み依頼
  </p>
  <ul class="grid">
    <li v-for="{ id, name } of inspectionApplications" class="flex">
      <RouterLink :to="{ name: EditInspectionApplication, params: { applicationId: id } }" class="py-6 px-4 font-medium text-gray-700 bg-gray-100 grow shadow-inner underline">
        {{ name }}
      </RouterLink>
    </li>
  </ul>
</template>

<script setup>
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { onBeforeUnmount, ref } from 'vue';
import { firestore, auth } from '../../firebase';
import { EditInspectionApplication } from '../../routes';
import { inspectionApplicationsCollectionId, applicantId } from '../../constants';

const inspectionApplications = ref([]);
let u;
const v = onAuthStateChanged(auth, (user) => {
  if (u) u();
  if (!user) {
    inspectionApplications.value = [];
    return;
  }
  const db = collection(firestore, inspectionApplicationsCollectionId);
  const q = query(
    db,
    where(applicantId, '==', user.uid),
    where('status', '!=', 'created'),
  );
  u = onSnapshot(q, (snapshot) => {
    const t = [];
    snapshot.forEach((application) => {
      const { id } = application;
      const { name } = application.data();
      t.push({ id, name });
    });
    inspectionApplications.value = t;
  });
});
onBeforeUnmount(v);
onBeforeUnmount(() => { if (u) u(); });
</script>
