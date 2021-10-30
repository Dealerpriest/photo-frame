<template>
  <h2>Choose Album</h2>
  <!-- <p>{{albumName}}</p> -->
  <!-- <q-list> -->
    <!-- <q-item v-for="album in albums" :key="album.id"> -->
      <!-- <q-checkbox :label="album.title" v-model="toggleStates" :val="album.id" /> -->
      <q-option-group :options="albumOptions" v-model="pickedAlbums" type="checkbox" />
      <!-- <q-btn :label="album.title" @click="addAlbum" /> -->
    <!-- </q-item> -->
  <!-- </q-list> -->
  <pre>{{ albumOptions }} </pre>
  <pre>{{albums}}</pre>
</template>

<script lang="ts">
// import axios, { AxiosResponse } from 'axios';
import { defineComponent, ref, watch, computed } from 'vue';
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
    const { fetchAllAlbums, setActiveAlbums, albums, activeAlbums } = useGPhotos();

    // const toggleStates = ref<Album[]>([]);

    // if (activeAlbums.value) {
    //   toggleStates.value = activeAlbums.value;
    // }

    interface albumOption {
      label: string,
      value: Album,
    }

    const albumOptions = ref<albumOption[]>([]);
    const pickedAlbums = ref<Album[]>([]);
    void fetchAllAlbums().then(() => {
      for (const oneAlbum of albums.value) {
        const option = {
          label: oneAlbum.title,
          value: oneAlbum,
        };
        albumOptions.value.push(option);
      // console.log('one options', oneAlbum);
      }
      console.log('albumOptions', albumOptions.value);
      if (activeAlbums.value?.length) {
        console.log('activeAlbums :>> ', activeAlbums.value);
        for (const album of activeAlbums.value) {
        // const modelObj = {
        //   label: album.title,
        //   value: album,
        // };
          const foundOption = albumOptions.value.find((option) => option.value.id === album.id);
          if (foundOption?.value) {
            pickedAlbums.value.push(foundOption.value);
          }
        }
      }
    });

    watch(pickedAlbums, (states) => {
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
    return { albums, albumOptions, pickedAlbums };
  },
});
</script>

<style>

</style>
