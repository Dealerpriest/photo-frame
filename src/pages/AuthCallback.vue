<template>
  <h2>Auth Callback </h2>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { useGPhotos } from 'src/composables/useGPhotos';

const { fetchTokens, goToReturnRoute } = useGPhotos();
const router = useRouter();
const route = useRoute();
console.log(route.query);
const code = route.query?.code as string;

const handleCallback = async () => {
  await fetchTokens(code);
  goToReturnRoute(router);
};

void handleCallback();
</script>

<style>

</style>
