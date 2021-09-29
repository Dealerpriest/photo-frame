<template>
  <!-- <h1>Slide Show</h1> -->
  <!-- <q-btn label="next" @click="getNextImage" /> -->
  <div id="main-box">
    <img id="main-image" :src="currentImageUrl" />
  </div>
  <div id="overlay">
    <q-btn label="prev" @click="getPrevImage" />
    <q-btn label="next" @click="getNextImage" />
    <pre> currentIdx: {{currentIdx}} </pre>
    <pre> slideshowHistory  length: {{ slideshowHistory.length }} </pre>
    <pre> totalWeight: {{totalWeight}} </pre>
    <q-list>
      <q-item v-for="[key, weightedItem] in weightedDictionary" :key="key">
{{key}} -->{{weightedItem.timesPicked}}:{{weightedItem.weight}}
      </q-item>
    </q-list>
    <q-list>
      <q-item v-for="(imageName, index) in slideshowHistory" :key="imageName">
        <q-icon v-if="currentIdx === index" name="chevron_right" />
        {{ imageName }}
      </q-item>

    </q-list>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

import { useGPhotos, MediaItem } from 'src/composables/useGPhotos';
import { useWeightedDictionary } from 'src/composables/useWeightedRandomness';

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
    const { getAlbumItems } = useGPhotos();
    const { weightedDictionary, setCandidateSpace, updateCandidateSpace, getRandomItem, getItem, totalWeight } = useWeightedDictionary<MediaItem>();
    // const mediaItems = ref<MediaItem[]>([]);
    // const currentImage = ref<MediaItem>();
    const currentImageUrl = ref<string>('');
    const slideshowHistory = ref<string[]>([]);
    const currentIdx = ref<number>(0);
    let timeoutId: number;

    function addImageToHistory (id: string) {
      slideshowHistory.value.push(id);
    }

    function resetImageTimer () {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(getNextImage, millisPerImage);
    }

    function getPrevImage () {
      resetImageTimer();
      currentIdx.value--;
      fetchImageWithId(slideshowHistory.value[currentIdx.value]);
    }

    function getNextImage () {
      console.log('getting next image');
      // TODO: replace this check with
      // if (!mediaItems.value.length) {
      //   return;
      // }

      resetImageTimer();
      // if (timeoutId) {
      //   clearTimeout(timeoutId);
      // }

      currentIdx.value++;
      if (currentIdx.value < slideshowHistory.value.length) {
        fetchImageWithId(slideshowHistory.value[currentIdx.value]);
      } else {
        const pickedImage = fetchRandomImage();
        addImageToHistory(pickedImage.id);
      }

      // timeoutId = window.setTimeout(getNextImage, millisPerImage);
    }

    function fetchImageWithId (id:string) {
      const image = getItem(id);
      // const image = mediaItems.value.find((item) => item.id === id);
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
      // const idx = Math.floor(Math.random() * mediaItems.value.length);
      // const image = mediaItems.value[idx];
      const image = getRandomItem();
      const pickedBaseUrl = image.baseUrl;
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      currentImageUrl.value = `${pickedBaseUrl}=w${width}-h${height}`;
      return image;
    }

    async function refetchMediaItems () {
      console.log('refetching mediaItems');
      const fetchedMediaItems = await getAlbumItems();
      if (fetchedMediaItems) {
        const mediaItemsMap = new Map<string, MediaItem>();
        fetchedMediaItems.forEach((mediaItem) => {
          mediaItemsMap.set(mediaItem.id, mediaItem);
        });
        updateCandidateSpace(mediaItemsMap);
      }
    }

    void (async () => {
      await refetchMediaItems();

      setInterval(() => void refetchMediaItems(), 30000);
      const pickedImage = fetchRandomImage();
      addImageToHistory(pickedImage.id);
      resetImageTimer();
    })();
    return { currentImageUrl, currentIdx, getPrevImage, getNextImage, slideshowHistory, weightedDictionary, totalWeight };
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
#overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: hsla(0, 100%, 100%, 0.5);
}

</style>
