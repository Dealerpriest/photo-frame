<template>
  <h2>Choose Album</h2>
  <!-- <p>{{albumName}}</p> -->
  <q-list>
    <q-item v-for="album in albums" :key="album.id">
      <q-toggle :label="album.title" v-model="toggleStates" :val="album" />
      <!-- <q-btn :label="album.title" @click="addAlbum" /> -->
    </q-item>
  </q-list>
  <pre>{{ toggleStates }} </pre>
  <pre>{{albums}}</pre>
</template>

<script lang="ts">
// import axios, { AxiosResponse } from 'axios';
import { defineComponent, ref, watch } from 'vue';
import { useGPhotos, Album } from 'src/composables/useGPhotos';

// interface Album {
//   title: string, id: string, productUrl: string, mediaItemsCount: string
// }

// interface AlbumListingResponse {
//   nextPageToken?: string,
//   albums?: Album[]
// }

export default defineComponent({
  name: 'ChooseAlbum',
  setup () {
    const { listAlbums, setActiveAlbums, albums } = useGPhotos();
    void listAlbums();

    const toggleStates = ref<Album[]>([]);

    watch(toggleStates, (states) => {
      setActiveAlbums(states);
      console.log('toggled with new value: ', states);
    });

    // const album = ref<Record<string, unknown>>(null);
    //   const albums = ref<AlbumListingResponse['albums']>([]);
    //   // const albumName = ref<string>('');
    //   async function listAlbums () {
    //     const accessToken = localStorage.getItem('accessToken');
    //     if (accessToken) {
    //       let response: AxiosResponse<AlbumListingResponse> = await axios.get('https://photoslibrary.googleapis.com/v1/albums', { headers: { Authorization: `Bearer ${accessToken}` } });
    //       console.log(response);
    //       if (response.data.nextPageToken) {
    //         const nextPageToken = response.data.nextPageToken;
    //         console.log('nextPageToken :>> ', nextPageToken);
    //         response = await axios.get('https://photoslibrary.googleapis.com/v1/albums', { params: { pageToken: nextPageToken }, headers: { Authorization: `Bearer ${accessToken}` } });
    //         console.log(response);
    //         albums.value = response.data.albums;
    //       }
    //     }
    //   }

    //   function saveAlbumId (album: Album) {
    //     localStorage.setItem('chosenAlbum', JSON.stringify(album));
    //   }

    //   void listAlbums();
    console.log(`albums ${JSON.stringify(albums)}`);
    return { albums, toggleStates };
  },
});
</script>

<style>

</style>
