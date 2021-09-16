<template>
<h2>Auth Callback </h2>
<!-- <p>{{accessToken}}</p> -->
<!-- <p>{{refreshToken}}</p> -->
</template>

<script lang="ts">
// import axios from 'axios';
// import credentials from '../../credentials.json';
import { defineComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGPhotos } from 'src/composables/useGPhotos';

export default defineComponent({
  name: 'AuthCallback',
  setup () {
    const { fetchTokens, goToReturnRoute } = useGPhotos();
    const router = useRouter();
    const route = useRoute();
    // const code = ref<string>('');
    // const accessToken = ref<string>('');
    // const refreshToken = ref<string>('');
    // const creds = credentials.web;
    // const cleanedUrl: string = route.query;
    console.log(route.query);
    // code.value = route.query?.code as string;
    const code = route.query?.code as string;
    const handleCallback = async () => {
      console.log('fetching tokens');
      await fetchTokens(code);
      // console.log('going to return url');
      goToReturnRoute(router);
    };
    void handleCallback();
    // const cleanedUrl = route.hash.replace('#', '?');
    // const urlParams = new URLSearchParams(cleanedUrl);
    // urlParams.forEach((value, key) => {
    //   console.log(`${key}: ${value}`);
    // });
    // if (urlParams.has('token')) {
    //   token.value = urlParams.get('token') as string;
    // }

    // async function fetchTokens (code: string) {
    //   const formData = `client_id=${creds.client_id}&client_secret=${creds.client_secret}&code=${code}&grant_type=authorization_code&redirect_uri=http://localhost:8080/auth/callback`;
    //   const response = await axios.post('https://oauth2.googleapis.com/token', formData);
    //   const data: Record<string, string> = response.data as Record<string, string>;
    //   if (data.access_token) {
    //     localStorage.setItem('accessToken', data.access_token);
    //     localStorage.setItem('refreshToken', data.refresh_token);
    //   }
    //   console.log(response);
    // }
    // void fetchTokens(code.value);
  },
});
</script>

<style>

</style>
