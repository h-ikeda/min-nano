<template>
  <ul>
    <li v-for="{ description, confirmed }, i of list" class="flex items-center">
      <input :id="`checkbox-${i}`" type="checkbox" :value="confirmed" @change="toggle(i, $event.target.checked)" class="w-6 h-6">
      <label :for="`checkbox-${i}`" class="">
        {{ description }}
      </label>
      <button class="ml-2 w-4 h-4 bg-blue-400 rounded-full text-xs text-white flex items-center justify-center">
        ?
      </button>
    </li>
  </ul>
</template>

<script setup>
import { ref } from 'vue';
const list = ref([{
  description: '基礎の高さ40cm以上',
  confirmed: false,
}, {
  description: '小屋裏換気口2箇所以上',
  confirmed: false,
}]);

function toggle(i, checked) {
  list.value[i].confirmed = checked;
}
</script>
