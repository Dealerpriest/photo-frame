<template>
  <!-- <h1>Slide Show</h1> -->
  <!-- <q-btn label="next" @click="getNextImage" /> -->
  <div id="main-box" @click="screenTouched">
    <template v-if="currentMediaItem">
      <!-- <img v-if="'photo' in currentMediaItem?.mediaMetaData" id="main-image" :src="currentImageUrl" />
      <video v-else id="main-video" :src="currentVideoUrl" /> -->
      <img id="main-image" :src="currentImageUrl" />
    </template>
  </div>
  <div id="debug-box">
    <pre>{{ currentMediaItem }}</pre>
  </div>
  <transition name="fade">
    <div v-if="showOverlay" id="overlay">
      <!-- <q-btn round icon="exit" @click="screenTouched" /> -->
      <h3 class="footer">{{ currentMediaItem?.description? currentMediaItem?.description: '' }} </h3>
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
    const currentImageUrl = ref<string>('');
    const currentVideoUrl = ref<string>('');
    const currentMediaItem = ref<MediaItem>();
    const slideshowHistory = ref<string[]>([]);
    const currentIdx = ref<number>(0);
    let timeoutId: number;

    function addImageToHistory (id: string) {
      slideshowHistory.value.push(id);
    }

    function resetImageTimer () {
      console.log('resetting image timer');
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(getNextImage, millisPerImage);
    }

    function assignPickedMediaItem (mediaItem: MediaItem) {
      if (!mediaItem) {
        console.error('something is wrong!, mediaItem is', mediaItem);
        return;
      }
      currentMediaItem.value = mediaItem;
      console.log('new mediaItem picked');
      resetImageTimer();
      // if ('video' in currentMediaItem.value.mediaMetaData) {
      //   console.log('this was a video mediaItem');
      // }
      const pickedBaseUrl = mediaItem.baseUrl;
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      currentImageUrl.value = `${pickedBaseUrl}=w${width}-h${height}`;
    }

    function getPrevImage () {
      if (currentIdx.value <= 0) {
        console.log('already at first image');
        return;
      }
      // resetImageTimer();
      currentIdx.value--;
      try {
        const pickedItem = fetchImageWithId(slideshowHistory.value[currentIdx.value]);
        assignPickedMediaItem(pickedItem);
      } catch (e) {
        console.error(e);
      }
    }

    function getNextImage () {
      console.log('getting next image');

      currentIdx.value++;
      if (currentIdx.value < slideshowHistory.value.length) {
        const pickedItem = fetchImageWithId(slideshowHistory.value[currentIdx.value]);
        assignPickedMediaItem(pickedItem);
      } else {
        const pickedItem = fetchRandomImage();
        assignPickedMediaItem(pickedItem);
        // currentMediaItem.value = pickedImage;
        addImageToHistory(pickedItem.id);
      }
    }

    function fetchImageWithId (id:string) {
      const mediaItem = getItem(id);
      if (!mediaItem) {
        console.error('no image with that id found');
        // return;
        throw new Error('no image with that id found');
      }
      // const baseUrl = image.baseUrl;
      // const width = document.documentElement.clientWidth;
      // const height = document.documentElement.clientHeight;
      // currentImageUrl.value = `${baseUrl}=w${width}-h${height}`;
      return mediaItem;
    }

    function fetchRandomImage () {
      const mediaItem = getRandomItem();
      // const pickedBaseUrl = image.baseUrl;
      // const width = document.documentElement.clientWidth;
      // const height = document.documentElement.clientHeight;
      // currentImageUrl.value = `${pickedBaseUrl}=w${width}-h${height}`;
      return mediaItem;
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

    // Initialize
    void (async () => {
      await refetchMediaItems();

      setInterval(() => void refetchMediaItems(), 30000);
      const pickedItem = fetchRandomImage();
      addImageToHistory(pickedItem.id);
      assignPickedMediaItem(pickedItem);
      // resetImageTimer();
    })();

    return { currentImageUrl, currentVideoUrl, currentMediaItem, currentIdx, getPrevImage, getNextImage, slideshowHistory, weightedDictionary, totalWeight };
  },
});

</script>

<style lang="scss">
#debug-box {
  z-index: 2500;
  position: absolute;
  left: 1rem;
  top: 1rem;
  background-color: rgba($color: #505050, $alpha: 0.7);
  color: white;
}

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
