<template>
  <h2>Choose Album</h2>
  <!-- <p>{{albumName}}</p> -->
  <q-list>
    <q-item v-for="album in albums" :key="album.id">
      <q-btn :label="album.title" @click="setActiveAlbum(album)" />
    </q-item>
  </q-list>
  <pre>{{albums}}</pre>
</template>

<script lang="ts">
// import axios, { AxiosResponse } from 'axios';
import { defineComponent } from 'vue';
import { useGPhotos } from 'src/composables/useGPhotos';

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
    const { listAlbums, setActiveAlbum, albums } = useGPhotos();
    void listAlbums();
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
    return { albums, setActiveAlbum };
  },
});
</script>

<style>

</style>
