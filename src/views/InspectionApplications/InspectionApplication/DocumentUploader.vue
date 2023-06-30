<template>
  <label>
    {{ label }}
    <input type="file" @change="uploadDocuments" multiple :disabled="disabled">
    <Spinner v-show="uploading" class="fixed inset-0 bg-white/80 backdrop-blur z-20"/>
  </label>
</template>

<script setup>
import { toRefs, ref as vueRef } from 'vue';
import { ref, uploadBytes } from 'firebase/storage';
import { getDocument } from 'pdfjs-dist';
import { storage } from '../../../firebase';
import Spinner from '../../../components/Spinner.vue';

const props = defineProps({
  belongsTo: { type: String, required: true },
  label: { type: String, required: true },
  disabled: { type: Boolean },
});
const { belongsTo } = toRefs(props);

const emit = defineEmits({
  complete: (payload) => typeof payload === 'string',
});

const uploading = vueRef(0);

function uploadDocuments(event) {
  const { files } = event.target;
  for (let i = files.length - 1; i >= 0; --i) {
    const file = files.item(i);
    uploadDocument(file);
  }
  event.target.value = '';
}

async function uploadDocument(file) {
  ++uploading.value;
  const uuid = crypto.randomUUID();
  const original = `${belongsTo.value}/${uuid}/original`;
  const preview = `${belongsTo.value}/${uuid}/preview`;
  const originalRef = ref(storage, original);
  const previewRef = ref(storage, preview);
  const { metadata: { contentType, timeCreated } } = await uploadBytes(originalRef, file);
  const converted = contentType === 'application/pdf' ? await getPdfPreview(file) : file;
  await uploadBytes(previewRef, converted);
  const { name } = file;
  --uploading.value;
  emit('complete', uuid, { original, preview, timeCreated, name });
}

async function getPdfPreview(original) {
  const data = await original.arrayBuffer();
  const pdfDocument = await getDocument(data).promise;
  const firstPage = await pdfDocument.getPage(1);
  const viewport = firstPage.getViewport({ scale: 1.0 });
  const { width, height } = viewport;
  const canvas = document.createElement('canvas');
  Object.assign(canvas, { width, height });
  const canvasContext = canvas.getContext('2d');
  await firstPage.render({ canvasContext, viewport }).promise;
  return new Promise((resolve) => canvas.toBlob(resolve));
}
</script>

<style scoped>
input {
  @apply hidden;
}
label {
  @apply cursor-pointer;
}
</style>
