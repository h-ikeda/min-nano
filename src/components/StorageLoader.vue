<template>
  <slot name="default" :metadata="metadata" :url="downloadURL" v-if="resolved" />
  <slot name="fallback" v-else />
</template>

<script setup>
import { ref, toRefs, watch } from 'vue';
import { getDownloadURL, getMetadata, ref as storageRef } from 'firebase/storage';
import { storage } from '../firebase';

const props = defineProps({
  path: { type: String },
});

const { path } = toRefs(props);

const resolved = ref(false);
const metadata = ref(null);
const downloadURL = ref(null);

watch(path, async (newPath) => {
  resolved.value = false;
  const reference = storageRef(storage, newPath);
  const metadataLocal = await getMetadata(reference);
  const downloadURLLocal = await getDownloadURL(reference);
  if (path.value !== newPath) return;
  metadata.value = metadataLocal;
  downloadURL.value = downloadURLLocal;
  resolved.value = true;
}, { immediate: true });
</script>
