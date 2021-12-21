<template>
  <q-page padding>
    <div id="page-box">

      <q-card>
        <h5>Picked albums</h5>
        <q-option-group :options="albumOptions" v-model="pickedAlbums" type="checkbox" />
        <q-spinner v-if="loading" />
      </q-card>
      <q-card>
        <h5>Reset stuff</h5>
            <q-btn class="block q-my-md" color="negative" label="reset show counter" @click="resetWeightedDictionary"/>
            <q-btn class="block q-my-md" color="negative" label="clear slideshow history" @click="clearSlideshowHistory"/>
      </q-card>
    </div>
    <q-btn class="q-mt-xl" color="primary" to="/" label="return to slideshow" />
  </q-page>
</template>

<script setup lang="ts">
// import axios, { AxiosResponse } from 'axios';
import { ref, watch, computed } from 'vue';
import { useGPhotos, Album, MediaItem } from 'src/composables/useGPhotos';
import { useWeightedDictionary } from 'src/composables/useWeightedRandomness';

// interface Album {
//   title: string, id: string, productUrl: string, mediaItemsCount: string
// }

// interface AlbumListingResponse {
//   nextPageToken?: string,
//   albums?: Album[]
// }

const { fetchAllAlbums, setActiveAlbums, albums, activeAlbums } = useGPhotos();
const { resetWeightedDictionary } = useWeightedDictionary<MediaItem>();

// const toggleStates = ref<Album[]>([]);

// if (activeAlbums.value) {
//   toggleStates.value = activeAlbums.value;
// }

// interface albumOption {
//   label: string,
//   value: Album,
// }

// const albumOptions = ref<albumOption[]>([]);
const pickedAlbums = ref<Album[]>([]);
const loading = ref<boolean>(true);
void (async () => {
  await fetchAllAlbums();
  loading.value = false;
})();
const albumOptions = computed(() => albums.value.map(album => ({ label: album.title, value: album })));
watch(albumOptions, (options) => {
  // albumOptions.value = [];
  // for (const oneAlbum of albums) {
  //   const option = {
  //     label: oneAlbum.title,
  //     value: oneAlbum,
  //   };
  //   albumOptions.value.push(option);
  // // console.log('one options', oneAlbum);
  // }
  // console.log('albumOptions', albumOptions.value);
  if (activeAlbums.value?.length) {
    console.log('activeAlbums :>> ', activeAlbums.value);
    pickedAlbums.value = [];
    for (const album of activeAlbums.value) {
      const foundOption = options.find((option) => option.value.id === album.id);
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

const clearSlideshowHistory = () => {
  localStorage.removeItem('slideshowHistory');
};

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
</script>

<style lang="scss">

#page-box {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  align-items: flex-start;
  // grid-template-columns: auto 1fr;
  // grid-template-columns: repeat(auto-fit, minmax(min-content, 1fr));
  // grid-auto-columns: minmax(max-content, 1fr);
  // grid-auto-columns: min-content;
  // grid-template-columns: repeat(3, 1fr);
  // grid-auto-columns: fit-content(400px);
  // grid-template-columns: repeat(auto-fill, minmax(, 1fr));
  & > * {
    padding: 1rem;
    width: fit-content;
    // width: 40vw;
    h5 {
      margin: 0;
    }
  }
}
</style>
