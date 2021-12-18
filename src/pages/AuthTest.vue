<template>
  <h3>
    Auth test page!
  </h3>
  <!-- <q-btn color="accent" label="fetch auth codes (device)" @click="fetchAuthCodes" /> -->
  <p>{{deviceCode}}</p>
  <q-btn color="primary" label="fetch token" @click="fetchToken" />
  <q-btn label="redirect to login (response type token)" @click="webAuth" color="secondary" />
  <q-btn label="redirect to server login (response type code)" @click="serverAuth" color="accent" />
</template>

<script setup lang="ts">
import axios from 'axios';
import credentials from '../../credentials.json';
import scopes from '../../scopes.json';
import { ref } from 'vue';
import { useGPhotos } from 'src/composables/useGPhotos';

// const authCodes = ref<string>('');
const deviceCode = ref<string>('');
const { serverAuth } = useGPhotos();

const creds = credentials.web;

function webAuth () {
  const authUrl = creds.auth_uri;
  const formData = `client_id=${creds.client_id}&redirect_uri=http://localhost:8080/auth/callback&response_type=token&scope=${scopes[0]}&include_granted_scopes=true`;

  location.assign(authUrl + '?' + formData);
  // const response: Record<string, unknown> = await axios.post('https://accounts.google.com/o/oauth2/v2/auth', formData);
  // console.log(response);
}

async function fetchToken () {
  const grantType = 'urn:ietf:params:oauth:grant-type:device_code';
  const formData = `client_id=${creds.client_id}&client_secret=${creds.client_secret}&device_code=${deviceCode.value}&grant_type=${grantType}`;

  console.log(formData);
  const response = await axios.post('https://oauth2.googleapis.com/token', formData);
  console.log(response);
}

</script>
