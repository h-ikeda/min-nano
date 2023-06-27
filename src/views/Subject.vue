<template>
  <nav class="flex border-b h-14 items-center">
    <button class="px-4">
      <img :src="arrowBackSvg">
    </button>
    <h2 class="grow" :title="title">{{ title }}</h2>
    <button class="px-4 border-l">
      <img :src="settingsSvg">
    </button>
  </nav>
  <router-view />
</template>

<script setup>
import settingsSvg from '@material-design-icons/svg/sharp/settings.svg';
import arrowBackSvg from '@material-design-icons/svg/sharp/arrow_back.svg';
import { doc } from 'firebase/firestore';
import { useRoute } from 'vue-router';
import { firestore } from '../firebase';

const route = useRoute();
const subject = doc(firestore, 'subjects', route.params.subjectId);
const title = '物件名';
</script>
