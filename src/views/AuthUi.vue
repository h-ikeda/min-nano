<template>
  <ul class="w-fit mx-auto h-full flex flex-col justify-center">
    <li>
      <button @click="signInWithGoogle">
        Googleでログイン
      </button>
    </li>
  </ul>
</template>

<script setup>
import { GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';
import { auth } from '../firebase';

function signInWithGoogle() {
  signInWithRedirect(auth, new GoogleAuthProvider());
}
</script>
