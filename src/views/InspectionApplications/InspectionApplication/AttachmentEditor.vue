<template>
  <aside class="overflow-auto pb-3 bg-sky-100">
    <nav class="flex items-center shadow bg-sky-200 sticky top-0">
      <p class="grow mx-4 text-gray-900 font-light">
        {{ attachment.name }}
      </p>
      <button @click="close" class="border-l border-gray-400 py-3 my-1 px-4 text-blue-500 font-medium shrink-0">
        閉じる
      </button>
    </nav>
    <p class="text-xs rounded ml-6 mt-4 px-1 -mb-2.5 bg-white relative w-fit">
      この資料に含まれる情報を選択して下さい
    </p>
    <section class="border border-gray-600 mx-4 rounded pt-5 px-4 space-y-3 pb-4 bg-white">
      <InputField type="checkbox" :data="informationType" :name="id" :label="label" @input="updateInformationType" v-for="{ id, label } in [...specific, ...requiredDocuments]" :key="id"/>
    </section>
    <p class="text-xs mx-4 mt-4 font-medium">
      プレビュー
    </p>
    <StorageLoader :path="attachment.original">
      <template #default="{ url }">
        <p class="mx-4">
          <iframe :src="`${url}#zoom=FitW`" class="w-full aspect-square"/>
        </p>
      </template>
      <template #fallback>
        <p class="animate-pulse text-center text-sm aspect-square flex flex-col justify-center border mx-4">
          loading...
        </p>
      </template>
    </StorageLoader>
  </aside>
</template>

<script setup>
import { computed, toRefs } from 'vue';
import StorageLoader from '../../../components/StorageLoader.vue';
import InputField from './InputField.vue';
import { informationTypesId } from '../../../constants';
import { specific, requiredDocuments } from './fields';

const props = defineProps({
  attachment: { type: Object, required: true },
});

const { attachment } = toRefs(props);

const emit = defineEmits({
  update: null,
  close: null,
});

function close() {
  emit('close');
}

function updateInformationType(payload) {
  const data = Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [`${informationTypesId}.${key}`, value]),
  );
  emit('update', data);
}

const informationType = computed(() => attachment.value[informationTypesId] || {});
</script>
