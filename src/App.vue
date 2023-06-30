<template>
  <h1 class="order-last text-center text-xs font-light py-2 bg-gray-200" :class="{ 'after:content-[\'*\']': currentUser && !currentUser.isAnonymous }">
    みんなの支え 二級建築士事務所
  </h1>
  <main class="grow min-h-0">
    <RouterView/>
  </main>
  <Spinner v-if="!currentUser" class="fixed inset-0 bg-zinc-50 z-50"/>
</template>

<script setup>
import { signInAnonymously, onAuthStateChanged, setPersistence, browserSessionPersistence, browserLocalPersistence } from '@firebase/auth';
import { onBeforeUnmount, ref } from 'vue';
import { auth } from './firebase';
import Spinner from './components/Spinner.vue';

const currentUser = ref(null);
onBeforeUnmount(onAuthStateChanged(auth, (user) => {
  if (!user) {
    setPersistence(auth, browserSessionPersistence).then(() => {
      signInAnonymously(auth);
    });
  } else if (!user.isAnonymous) {
    setPersistence(auth, browserLocalPersistence);
  }
  currentUser.value = user;
}));
</script>

<style>
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  @apply h-full;
}

body {
  @apply container h-full flex flex-col mx-auto;
}
</style>
