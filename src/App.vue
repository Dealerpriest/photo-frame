<template>
  <router-view />
</template>
<script lang="ts">
import { defineComponent } from 'vue';
// import { useGPhotos } from 'src/composables/useGPhotos';

export default defineComponent({
  name: 'App',
  setup () {
    // const { initialize } = useGPhotos();
    // initialize();
  },
});
</script>
