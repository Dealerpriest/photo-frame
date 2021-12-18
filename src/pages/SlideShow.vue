<template>
  <!-- <h1>Slide Show</h1> -->
  <!-- <q-btn label="next" @click="getNextImage" /> -->
  <div id="main-box" @click="screenTouched">
    <img id="main-image" :src="currentImageUrl" />
  </div>
  <transition name="fade">
    <div v-if="showOverlay" id="overlay">
      <!-- <q-btn round icon="exit" @click="screenTouched" /> -->
      <h3 class="footer">{{ currentImage?.description? currentImage?.description: '' }} </h3>
      <q-btn class="q-ma-md left" flat icon="keyboard_arrow_left" size="xl" round  @click="getPrevImage" />
      <q-btn class="q-ma-md right" flat icon="keyboard_arrow_right" size="xl" round @click="getNextImage" />
      <!-- <pre class="vignette-shadow"> currentIdx: {{currentIdx}} </pre>
      <pre> slideshowHistory  length: {{ slideshowHistory.length }} </pre>
      <pre> totalWeight: {{totalWeight}} </pre>
      <q-list>
        <q-item v-for="(imageName, index) in slideshowHistory" :key="imageName">
          <q-icon v-if="currentIdx === index" name="chevron_right" />
          {{ imageName }}
        </q-item>

      </q-list> -->
    </div>
  </transition>
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
  data () {
    return {
      showOverlay: false,
    };
  },
  methods: {
    screenTouched () {
      console.log('Overlay touched');
      this.showOverlay = !this.showOverlay;
    },
  },
  setup () {
    const millisPerImage = 5000;
    const { getAlbumItems } = useGPhotos();
    const { weightedDictionary, updateCandidateSpace, getRandomItem, getItem, totalWeight } = useWeightedDictionary<MediaItem>();
    // const mediaItems = ref<MediaItem[]>([]);
    // const currentImage = ref<MediaItem>();
    const currentImageUrl = ref<string>('');
    const currentImage = ref<MediaItem>();
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
      currentImage.value = fetchImageWithId(slideshowHistory.value[currentIdx.value]);
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
        currentImage.value = fetchImageWithId(slideshowHistory.value[currentIdx.value]);
      } else {
        const pickedImage = fetchRandomImage();
        currentImage.value = pickedImage;
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
    // currentImage.value?.mediaMetaData
    return { currentImageUrl, currentImage, currentIdx, getPrevImage, getNextImage, slideshowHistory, weightedDictionary, totalWeight };
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
  // background-color: hsla(0, 100%, 100%, 1);
  color: white;
  // & * {
  //   color: white;
  //   text-shadow: 0 0 10rem black ;
  // }
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  grid-template-areas:
    "title title title"
    "left center right"
    "footer footer footer";
  place-items: center;
}

.left {
  grid-area: left;
  justify-self: left;
}
.right {
  grid-area: right;
  justify-self: right;
}
.footer {
  grid-area: footer;
}

.vignette-shadow {
  text-shadow: 0 0 0.5rem black,
               0 0 1rem black,
               0 0 1rem black,
               0 0 1rem black,
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

</style>
