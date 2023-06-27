<template>
  <p class="h-full w-fit mx-auto flex flex-col justify-center gap-y-4">
    <RouterLink :to="createInspectionApplicationLink" class="link bg-gray-900 text-gray-100">新規に依頼する</RouterLink>
    <RouterLink :to="listInspectionApplicationsLink" class="link border border-gray-600 text-gray-600">直近の依頼を確認する</RouterLink>
  </p>
</template>

<script setup>
import { CreateInspectionApplication, ListInspectionApplications } from '../../routes';

const createInspectionApplicationLink = { name : CreateInspectionApplication };
const listInspectionApplicationsLink = { name: ListInspectionApplications };
</script>

<style scoped>
.link {
  @apply px-6 py-3 rounded-full text-center font-medium;
}
</style>
