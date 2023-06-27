<template>
  <section>
    <StorageLoader :path="preview">
      <template #default="{ url: previewURL }">
        <img :src="previewURL"/>
      </template>
      <template #fallback>
        <Spinner class="placeholder"/>
      </template>
    </StorageLoader>
    <caption>
      {{ name }}
    </caption>
    <span class="text-sm after:content-[':'] text-gray-600 font-medium pt-1">
      含まれる情報
    </span>
    <p v-if="informationTypes" class="flex flex-wrap">
      <span v-for="[key] in Object.entries(informationTypes).filter(([_, value]) => value)" :key="key" class="text-sm py-0.5 border px-1.5 rounded bg-sky-600 text-white">
        {{ [...specific, ...requiredDocuments].find(({ id }) => id === key).label }}
      </span>
    </p>
  </section>
</template>

<script setup>
import StorageLoader from '../../../components/StorageLoader.vue';
import Spinner from '../../../components/Spinner.vue';
import { requiredDocuments, specific } from './fields';

defineProps({
  id: { type: String, required: true },
  preview: { type: String, required: true },
  informationTypes: { type: Object },
  name: { type: String, required: true },
});
</script>

<style scoped>
section {
  @apply flex flex-col cursor-pointer bg-sky-200 shadow rounded p-3 pb-6;
}
img {
  @apply aspect-square object-contain shadow-inner bg-white;
}
.placeholder {
  @apply aspect-square bg-white text-gray-600 shadow-inner;
}
caption {
  @apply text-xs text-gray-800 -mt-5 mx-1 truncate text-start mb-2;
}
</style>
