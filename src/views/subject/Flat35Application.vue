<template>
  <h3 class="font-medium h-12 flex items-center justify-center">中古住宅適合証明の申請</h3>
  <h4>資料のアップロード</h4>
  <label class="flex flex-col bg-blue-100 px-6 pt-8 pb-6 relative before:absolute before:inset-3 before:border before:border-dashed before:border-gray-500">
    <input type="file" @change="putFile" multiple>
    <p v-if="uploadedFiles.length" class="flex flex-wrap w-fit mt-6 gap-3">
      <img class="h-16 w-16" v-for="{ url, sumb } of uploadedFiles" :src="sumb" @click="view(url)">
    </p>
    <p v-else class="mt-4 mb-2 flex items-center justify-center text-gray-400 h-16">
      ここにアップロードされた資料が表示されます
    </p>
  </label>
  <h4>資料に含まれているもの</h4>
  <label class="flex items-center">
    <input type="checkbox" v-model="landDocumentUploaded">
    土地登記事項証明書の写し
  </label>
  <label class="flex items-center">
    <input type="checkbox" v-model="buildingDocumentUploaded">
    建物登記事項証明書の写し
  </label>
  <section class="grid grid-flow-row w-fit">
    <span class="row-span-3 flex items-center">申請者の</span>
    <label class="col-start-2 flex items-center">
      <input type="checkbox" v-model="customerNameUploaded" class="">
      氏名
    </label>
    <label class="flex items-center">
      <input type="checkbox" v-model="customerAddressUploaded" class="">
      現住所
    </label>
    <label class="flex items-center">
      <input type="checkbox" v-model="customerPhoneUploaded" class="">
      電話番号
    </label>
  </section>
  <h4>申請情報入力</h4>
  <label class="flex">
    申請者の氏名
    <input v-model="customerName" class="border">
  </label>
  <section>
    <h5>申請者の現住所</h5>
    <label class="flex">
      〒
      <input v-model="customerPostnumber" class="border">
    </label>
    <textarea v-model="customerAddress" class="border" />
  </section>
  <label class="flex">
    申請者の電話番号
    <input v-model="customerPhone" class="border">
  </label>
  <label class="flex">
    申請者の所属 (事業者の場合)
    <input v-model="customerContact" class="border">
  </label>
  <label class="flex">
    代理者の氏名
    <input v-model="agentName" class="border">
  </label>
  <label class="flex">
    代理者の住所
    <input v-model="agentAddress" class="border">
  </label>
  <label class="flex">
    代理者の電話番号
    <input v-model="agentPhone" class="border">
  </label>
  <label class="flex">
    代理者の所属 (事業者の場合)
    <input v-model="agentContact" class="border">
  </label>
  <fieldset>
    <legend>手数料の請求先</legend>
    <label class="flex items-center">
      <input type="radio" v-model="invoiceTo" value="customer">
      申請者
    </label>
    <label class="flex items-center">
      <input type="radio" v-model="invoiceTo" value="agent">
      代理者
    </label>
    <label class="flex items-center">
      <input type="radio" v-model="invoiceTo" value="other">
      その他
    </label>
    <textarea class="border" v-model="invoiceToDetail" v-if="invoiceTo === 'other'" />
  </fieldset>
  <label class="flex items-center">
    <input type="checkbox" v-model="applyS">
    フラット35S基準 (開口部断熱または外壁等断熱) の適用を希望する
  </label>
  <label class="flex items-center">
    <input type="checkbox" v-model="applyM">
    フラット35維持保全型基準の適用を希望する
  </label>
  <h4>連絡事項</h4>
  <fieldset>
    <legend>現地調査希望日時</legend>
    <input type="radio" id="datetime-offer-fastest" value="fastest" v-model="datetimeOffer">
    <label for="datetime-offer-fastest">最短でいつでも</label>
    <input type="radio" id="datetime-offer">
  </fieldset>
  <label class="flex items-center">
    <input type="checkbox" v-model="presence">
    現地調査に立ち会う
  </label>
  <fieldset v-if="presence">
    <legend>立会者</legend>
    <label class="flex items-center">
      <input type="radio" value="customer" v-model="guide">
      申請者
    </label>
    <label class="flex items-center">
      <input type="radio" value="agent" v-model="guide">
      代理者
    </label>
    <label class="flex items-center">
      <input type="radio" value="other" v-model="guide">
      その他
    </label>
  </fieldset>
  <fieldset v-else>
    <legend>鍵の受け渡し方法</legend>
    <input type="radio" id="key-delivering-method-keybox" value="keybox" v-model="keyDeliveringMethod">
    <label for="key-delivering-method-keybox">キーボックス</label>
    <input type="radio" id="key-delivering-method-office" value="office" v-model="keyDeliveringMethod">
    <label for="key-delivering-method-office">事務所での受け渡し</label>
  </fieldset>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { uploadBytes, ref as storageRef } from 'firebase/storage';
import { storage } from '../../firebase';

const route = useRoute();

const customerNameUploaded = ref(false);
const customerAddressUploaded = ref(false);
const customerPhoneUploaded = ref(false);
const customerName = ref('');
const customerAddress = ref('');
const customerPhone = ref('');
const agentName = ref('');
const agentAddress = ref('');
const agentPhone = ref('');
const invoiceTo = ref('customer');
const applyS = ref(true);
const applyM = ref(false);
const presence = ref(false);
const guide = ref('agent');
const keyDeliveringMethod = ref('keybox');
const uploadedFiles = ref([]);
const uploadedFilesRef = storageRef(storage, `subject_documents/${route.params.subjectId}/`);

function putFile({ target: { files } }) {
  for (let i = files.length; i >= 0; --i) {
    uploadBytes(uploadFilesRef, files[i]);
    uploadedFiles.value.push(files.map((file) => ({})));
  }
}
</script>

<style scoped>
input[type=checkbox] {
  @apply scale-150;
}
</style>
