<template>
  <div class="bg-zinc-50 h-full flex flex-col items-center justify-center gap-y-16">
    <section class="grid gap-y-4 mx-8">
      <p class="text-center">
        ご依頼を受付けました。
      </p>
      <dl class="text-sm font-light flex gap-x-2">
        <dt class="shrink-0">
          物件名 :
        </dt>
        <dd>
          {{ applicationName }}
        </dd>
      </dl>
    </section>
    <section class="grid text-center gap-y-4">
      <RouterLink :to="{ name: MenuInspectionApplications }" class="bg-gray-800 text-white px-6 py-3 rounded-full font-medium">
        メニューへ戻る
      </RouterLink>
      <RouterLink :to="{ name: EditInspectionApplication, params: { applicationId } }" class="text-gray-700 border border-gray-700 px-6 py-3 rounded-full font-medium">
        送信内容を確認する
      </RouterLink>
    </section>
  </div>
  <Spinner v-if="waiting" class="fixed inset-0 bg-zinc-50 z-50"/>
</template>

<script setup>
import { doc, getDoc } from 'firebase/firestore';
import { MenuInspectionApplications, EditInspectionApplication } from '../../routes';
import { firestore } from '../../firebase';
import { inspectionApplicationsCollectionId } from '../../constants';
import { ref, toRefs, watch } from 'vue';
import { useRouter } from 'vue-router';
import Spinner from '../../components/Spinner.vue';

const props = defineProps({
  applicationId: { type: String },
});

const { applicationId } = toRefs(props);
const waiting = ref(true);
const applicationName = ref('');
const router = useRouter();

watch(applicationId, async (id) => {
  waiting.value = true;
  const docRef = doc(firestore, inspectionApplicationsCollectionId, id);
  const d = await getDoc(docRef).catch(() => ({ data: () => ({}) }));
  const { status, name } = d.data();
  if (status !== 'submitted') {
    router.replace({ name: MenuInspectionApplications });
    return;
  }
  applicationName.value = name;
  waiting.value = false;
}, { immediate: true });
</script>
