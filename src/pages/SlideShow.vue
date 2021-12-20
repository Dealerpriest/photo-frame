<template>
  <!-- <h1>Slide Show</h1> -->
  <!-- <q-btn label="next" @click="getNextImage" /> -->
  <div id="main-box" @click="showOverlay">
    <q-spinner size="xl" class="fixed-center" color="white" v-if="!initialized" />
    <template v-else-if="currentMediaItem">
      <img v-if="'photo' in currentMediaItem.mediaMetadata" id="main-image" :src="currentImageUrl" />
      <video loop :muted="!soundIsOnByDefault" @ended="onVideoEnded" ref="videoElement" v-else autoplay id="main-video" :src="currentVideoUrl" />
      <div v-if="!isShowingOverlay" id="description-box" ><h4 class="playful-font description-text">{{ currentMediaItem.description }}</h4></div>
      <!-- <img id="main-image" :src="currentImageUrl" /> -->
    </template>
  </div>
  <div v-if="showDebugBox" id="debug-box">
    <pre>{{ currentMediaItem }}</pre>
  </div>
  <transition name="fade">
    <div v-if="isShowingOverlay" id="overlay" @click.self="hideOverlay">
      <!-- <q-btn round icon="exit" @click="screenTouched" /> -->
      <div class="top">
        <q-btn class="" flat icon="menu" size="xl" round>
        <q-menu transition>
          <q-list>
            <q-item tag="label" v-ripple>
              <q-item-section>
                <q-item-label>Autoplay slideshow</q-item-label>
              </q-item-section>
              <q-item-section avatar>
                <q-toggle :model-value="autoPlaySlideshow" @update:model-value="toggleAutoplaySlideshow" />
              </q-item-section>
            </q-item>
            <q-item tag="label" v-ripple>
              <q-item-section>
                <q-item-label>Autohide overlay</q-item-label>
              </q-item-section>
              <q-item-section avatar>
                <q-toggle :model-value="autoHideOverlay" @update:model-value="toggleAutoHideOverlay" />
              </q-item-section>
            </q-item>
            <q-item tag="label" v-ripple>
              <q-item-section>
                <q-item-label>Autoplay sound in videos</q-item-label>
              </q-item-section>
              <q-item-section avatar>
                <q-toggle v-model="soundIsOnByDefault" />
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable @click="goToSettings">
              <q-item-section>Mer inställningar</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
        </q-btn>
      </div>
      <div class="footer">
        <h3 class="playful-font description-text">{{ currentMediaItem?.description? currentMediaItem?.description: '' }} </h3>
      </div>
      <q-btn class="q-ma-md left" flat icon="keyboard_arrow_left" size="xl" round  @click="getPrevImage" />
      <q-btn class="q-ma-md right" flat icon="keyboard_arrow_right" size="xl" round @click="getNextMediaItem" />

      <!-- <q-btn label="play/pause slideshow" @click="toggleAutoplaySliedshow" /> -->
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

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';

import { useGPhotos } from 'src/composables/useGPhotos';
import type { MediaItem } from 'src/composables/useGPhotos';
import { useWeightedDictionary } from 'src/composables/useWeightedRandomness';
import { useRouter } from 'vue-router';
const router = useRouter();
const initialized = ref<boolean>(false);
const millisPerImage = 5000;
const { getAlbumItems } = useGPhotos();
const { updateCandidateSpace, getRandomItem, getItem } = useWeightedDictionary<MediaItem>();
const currentImageUrl = ref<string>('');
const currentVideoUrl = ref<string | undefined>('');
const currentMediaItem = ref<MediaItem>();
const slideshowHistory = ref<string[]>([]);
const autoPlaySlideshow = ref<boolean>(true);
const autoHideOverlay = ref<boolean>(true);
const soundIsOnByDefault = ref<boolean>(false);
const currentIdx = ref<number>(0);
const showDebugBox = ref<boolean>(false);
const isShowingOverlay = ref<boolean>(false);
const videoElement = ref<HTMLVideoElement>();
let timeoutId: number;

function toggleAutoHideOverlay () {
  autoHideOverlay.value = !autoHideOverlay.value;
  if (autoHideOverlay.value) {
    hideOverlayIn(10000);
  } else {
    window.clearTimeout(hideOverlayTimeoutId);
  }
}

function showOverlay () {
  console.log('showing overlay');
  isShowingOverlay.value = true;
  if (autoHideOverlay.value) {
    hideOverlayIn(10000);
  }
}

function hideOverlay () {
  console.log('hiding overlay');
  isShowingOverlay.value = false;
}

let hideOverlayTimeoutId: number;
function hideOverlayIn (millis: number) {
  console.log('hiding overlay in (ms):', millis);
  window.clearTimeout(hideOverlayTimeoutId);
  hideOverlayTimeoutId = window.setTimeout(() => { isShowingOverlay.value = false; }, millis);
}

function addImageToHistory (id: string) {
  slideshowHistory.value.push(id);
}

function toggleAutoplaySlideshow () {
  autoPlaySlideshow.value = !autoPlaySlideshow.value;
  if (autoPlaySlideshow.value) {
    resetNextItemTimer();
  } else {
    clearNextItemTimer();
  }
}

function resetNextItemTimer () {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  console.log('resetting media item timer');
  timeoutId = window.setTimeout(getNextMediaItem, millisPerImage);
}

function clearNextItemTimer () {
  if (!timeoutId) {
    console.error('no timeOutId found');
    return;
  }
  console.log('clearing mediaItem timer');
  clearTimeout(timeoutId);
}

function assignPickedMediaItem (mediaItem: MediaItem) {
  console.log('new mediaItem picked');
  console.log(mediaItem);
  // console.log('isRef:', isRef(mediaItem));
  // console.log('isProxy:', isProxy(mediaItem));
  // console.log('isReactive', isReactive(mediaItem));
  if (!mediaItem) {
    console.error('something is wrong!, mediaItem is', mediaItem);
    return;
  }
  currentMediaItem.value = mediaItem;
  const pickedBaseUrl = mediaItem.baseUrl;
  const width = document.documentElement.clientWidth;
  const height = document.documentElement.clientHeight;
  currentImageUrl.value = `${pickedBaseUrl}=w${width}-h${height}`;
  if (mediaItem.mediaMetadata.video) {
    if (mediaItem.mediaMetadata.video.status === 'READY') {
      console.log('this was a video mediaItem');
      currentVideoUrl.value = `${pickedBaseUrl}=dv`;
      clearNextItemTimer();
    }
  } else {
    if (autoPlaySlideshow.value) {
      resetNextItemTimer();
    }
    currentVideoUrl.value = undefined;
  }
}

function getPrevImage () {
  if (currentIdx.value <= 0) {
    console.log('already at first image');
    return;
  }
  currentIdx.value--;
  try {
    const pickedItem = fetchMediaItemWithId(slideshowHistory.value[currentIdx.value]);
    assignPickedMediaItem(pickedItem);
  } catch (e) {
    console.error(e);
  }
}

function getNextMediaItem () {
  console.log('getting next image');

  currentIdx.value++;
  if (currentIdx.value < slideshowHistory.value.length) {
    const pickedItem = fetchMediaItemWithId(slideshowHistory.value[currentIdx.value]);
    assignPickedMediaItem(pickedItem);
  } else {
    const pickedItem = fetchRandomMediaItem();
    assignPickedMediaItem(pickedItem);
    addImageToHistory(pickedItem.id);
  }
}

function fetchMediaItemWithId (id:string) {
  const mediaItem = getItem(id);
  if (!mediaItem) {
    console.error('no image with that id found');
    throw new Error('no image with that id found');
  }
  return mediaItem;
}

function fetchRandomMediaItem () {
  const mediaItem = getRandomItem();
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
  // console.log('initialize in slideshow triggered! --------------');
  await refetchMediaItems();

  updateAlbumsTimerId = window.setInterval(() => void refetchMediaItems(), 3 * 60 * 1000);
  const pickedItem = fetchRandomMediaItem();
  addImageToHistory(pickedItem.id);
  assignPickedMediaItem(pickedItem);
  initialized.value = true;
})();

let updateAlbumsTimerId: number;
// onBeforeMount(() => {
//   console.log('onBeforeMount!!!! -------------------->');
// });
onBeforeUnmount(() => {
  console.log('BEFORE UNMOUNT CALLED -------------');
  clearNextItemTimer();
  clearInterval(updateAlbumsTimerId);
});

window.addEventListener('keyup', (ev) => {
  console.log('a key was pressed');
  if (ev.key === 'd') {
    console.log('debug toggled');
    showDebugBox.value = !showDebugBox.value;
  }
});

function onVideoEnded (ev: Event) {
  console.log('video ended: ', ev);
  // resetNextItemTimer();
  if (autoPlaySlideshow.value) {
    getNextMediaItem();
  }
}
function goToSettings () {
  console.log('settings clicked');
  void router.push({ name: 'settings' });
}

</script>

<style lang="scss">
#debug-box {
  z-index: 2500;
  position: absolute;
  left: 1rem;
  top: 1rem;
  background-color: rgba($color: #505050, $alpha: 0.7);
  color: white;
  pointer-events: none;
}

#main-box {
  // width: 100%;
  // height: 100%;
  width: 100vw;
  height: 100vh;
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

#main-video {
  display: block;
  margin: auto ;
  height: 100%;
  max-width: 100%;
  max-width: 100%;
  // text-align: center;
  /* position:absolute; */
  z-index: -1;
}

#description-box {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  color: white;
  * {
    margin: 0;
  }
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
  align-content: stretch;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  grid-template-areas:
    "top top top"
    "left center right"
    "footer footer footer";
  place-items: center;
}

.top {
  grid-area: top;
  // place-self: stretch stretch;
  place-self: start end;
  // background-color: lightblue;

}

.left {
  grid-area: left;
  justify-self: left;
  // background-color: yellow;
}
.right {
  grid-area: right;
  justify-self: right;
  // background-color: magenta;
}
.footer {
  grid-area: footer;
  place-self: end center;
}

.description-text {
  font-size: 3rem;
  text-shadow: 1px 1px 2px rgb(0, 0, 0), 0 0 1em rgb(0, 0, 0), 0 0 0.2em rgb(0, 0, 0);
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
