<template>
  <!-- <h1>Slide Show</h1> -->
  <!-- <q-btn label="next" @click="getNextImage" /> -->
  <div id="main-box">
    <q-btn label="prev" @click="getPrevImage" />
    <img id="main-image" :src="currentImageUrl" />
    <q-btn label="next" @click="getNextImage" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

import { useGPhotos, MediaItem } from 'src/composables/useGPhotos';

// interface AlbumListingResponse {
//   nextPageToken?: string,
//   albums?: Album[]
// }
// interface MediaItem {
//   id: string,
//   productUrl: string,
//   baseUrl: string,
//   mimeType: string,
//   mediaMetaData: Record<string, unknown>,
//   filename: string,
// }

// interface MediaItemResponse {
//   mediaItems: MediaItem[],
//   nextPageToken: string,
// }

// import axios, { AxiosResponse } from 'axios';
export default defineComponent({
  setup () {
    const millisPerImage = 5000;
    const { mediaItems, getAlbumItems } = useGPhotos();
    // const mediaItems = ref<MediaItem[]>([]);
    // const currentImage = ref<MediaItem>();
    const currentImageUrl = ref<string>('');
    const slideShowHistory = ref<string[]>([]);
    const currentIdx = ref<number>(0);
    let timeoutId: number;

    function addImageToHistory (id: string) {
      slideShowHistory.value.push(id);
    }

    function resetImageTimer () {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(getNextImage, millisPerImage);
      }
    }

    function getPrevImage () {
      resetImageTimer();
      currentIdx.value--;
      fetchImageWithId(slideShowHistory.value[currentIdx.value]);
    }

    function getNextImage () {
      console.log('getting next image');
      if (!mediaItems.value.length) {
        return;
      }

      resetImageTimer();
      // if (timeoutId) {
      //   clearTimeout(timeoutId);
      // }

      currentIdx.value++;
      if (currentIdx.value < slideShowHistory.value.length) {
        fetchImageWithId(slideShowHistory.value[currentIdx.value]);
      } else {
        const pickedImage = fetchRandomImage();
        addImageToHistory(pickedImage.id);
      }

      // timeoutId = window.setTimeout(getNextImage, millisPerImage);
    }

    function fetchImageWithId (id:string) {
      const image = mediaItems.value.find((item) => item.id === id);
      if (!image) {
        console.error('no image with that id found');
        return;
      }
      // currentImage.value = image;
      const baseUrl = image.baseUrl;
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      currentImageUrl.value = `${baseUrl}=w${width}-h${height}`;
      return image;
    }

    function fetchRandomImage () {
      const idx = Math.floor(Math.random() * mediaItems.value.length);
      const image = mediaItems.value[idx];
      const pickedBaseUrl = image.baseUrl;
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      currentImageUrl.value = `${pickedBaseUrl}=w${width}-h${height}`;
      return image;
    }

    void (async () => {
      await getAlbumItems();
      getNextImage();
    })();
    return { currentImageUrl, getPrevImage, getNextImage, slideShowHistory };
  },
});

</script>

<style lang="scss">
#main-box {
  width: 100%;
  height: 100%;
  background: $dark;
  margin: 0;
}
#main-image {
  display: block;
  margin: auto ;
  // text-align: center;
  /* position:absolute; */
  z-index: -1;
}

</style>
