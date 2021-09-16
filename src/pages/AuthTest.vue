<template>
  <h3>
    Auth test page!
  </h3>
  <q-btn color="accent" label="fetch auth codes" @click="fetchAuthCodes" />
  <p>{{deviceCode}}</p>
  <q-btn color="primary" label="fetch token" @click="fetchToken" />
  <q-btn label="redirect to login" @click="webAuth" color="secondary" />
  <q-btn label="redirect to server login" @click="serverAuth" color="accent" />

  <q-btn label="useGphoto init" @click="initialize" />
</template>

<script lang="ts">
import axios from 'axios';
// import { OAuth2Client } from 'google-auth-library';
import credentials from '../../credentials.json';
import scopes from '../../scopes.json';
import { defineComponent, ref } from 'vue';
// import { useGPhotos } from 'src/composables/useGPhotos';

export default defineComponent({
  name: 'AuthTest',

  components: {
  },

  setup () {
    const authCodes = ref<string>('');
    const deviceCode = ref<string>('');
    // const { initialize } = useGPhotos();

    const creds = credentials.web;
    // getAuthenticatedClient(){
    //   const oAuth2Client = new OAuth2Client(credentials.installed.client_id, credentials.installed.client_secret, credentials.installed.redirect_uris[0]);
    //   const authUrl = oAuth2Client.generateAuthUrl();
    //   console.log(authUrl);
    // }
    function webAuth () {
      const authUrl = creds.auth_uri;
      const formData = `client_id=${creds.client_id}&redirect_uri=http://localhost:8080/auth/callback&response_type=token&scope=${scopes[0]}&include_granted_scopes=true`;

      location.assign(authUrl + '?' + formData);
      // const response: Record<string, unknown> = await axios.post('https://accounts.google.com/o/oauth2/v2/auth', formData);
      // console.log(response);
    }

    function serverAuth () {
      console.log('triggered server auth');
      const authUrl = creds.auth_uri;
      const formData = `client_id=${creds.client_id}&redirect_uri=http://localhost:8080/auth/callback&response_type=code&scope=${scopes[0]}&access_type=offline&include_granted_scopes=true`;

      const fullUrl = authUrl + '?' + formData;
      console.log(fullUrl);
      location.assign(fullUrl);
    }

    async function fetchAuthCodes () {
      // const {clientId: client_id, clientSecret: client_secret } = credentials.installed;
      // const scopes: string[] = JSON.parse(process.env.API_SCOPES as string) as string[];
      console.log(scopes);

      const response: Record<string, unknown> = await axios.post('https://oauth2.googleapis.com/device/code', `client_id=${creds.client_id}&scope=photoslibrary.readonly`);
      const data: Record<string, string> = response.data as Record<string, string>;
      deviceCode.value = data.device_code;
      console.log(response);
    }

    async function fetchToken () {
      const grantType = 'urn:ietf:params:oauth:grant-type:device_code';
      const formData = `client_id=${creds.client_id}&client_secret=${creds.client_secret}&device_code=${deviceCode.value}&grant_type=${grantType}`;

      console.log(formData);
      const response = await axios.post('https://oauth2.googleapis.com/token', formData);
      console.log(response);
    }

    return { deviceCode, authCodes, fetchAuthCodes, fetchToken, webAuth, serverAuth };
  },
});
</script>
