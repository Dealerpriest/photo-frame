<template>
  <!-- <h1>Slide Show</h1> -->
  <!-- <q-btn label="next" @click="getNextImage" /> -->
  <div id="main-box" @click="onMainBoxClicked">
    <q-spinner size="xl" class="fixed-center" color="white" v-if="!initialized" />
    <template v-else-if="currentMediaItem">
      <div class="row nowrap justify-center items-center content-center full-height">
        <img draggable="false" class="" v-show="'photo' in currentMediaItem.mediaMetadata" id="main-image" :src="currentImageUrl" ref="imageElement" />
        <video v-show="'video' in currentMediaItem.mediaMetadata" draggable="false"  :muted="!soundIsOn" @ended="onVideoEnded" ref="videoElement" autoplay id="main-video" :src="currentVideoUrl" :poster="currentImageUrl"/>
      </div>
      <div id="footer-box">
        <div id="description-box" ><h4 class="playful-font description-text">{{ currentMediaItem.description}}</h4></div>
        <q-btn :class="{ hiddenButton: !('video' in currentMediaItem.mediaMetadata) }" color="white" id="mute-button" @click.stop="toggleAudio" :icon="soundIsOn? 'volume_up': 'volume_off'" round flat />
      </div>
    </template>
  </div>
  <div v-if="showDebugBox" id="debug-box">
    <pre>{{ currentMediaItem }}</pre>
    <pre>{{ totalNrOfPicks }}</pre>
    <pre>{{weightedDictionary }}</pre>
  </div>
  <transition name="fade">
    <div v-if="isShowingOverlay" id="overlay" @click.self="hideOverlay">
      <!-- <q-btn round icon="exit" @click="screenTouched" /> -->
      <div class="top">
        <q-btn class="" flat icon="menu" size="xl" round>
        <q-menu v-model="menuIsOpen">
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
        <!-- <h3 class="playful-font description-text">{{ currentMediaItem?.description? currentMediaItem?.description: '' }} </h3> -->
      </div>
      <q-btn v-if="currentIdx !== 0" class="q-ma-md left" flat icon="keyboard_arrow_left" size="xl" round  @click="getPrevImage(), postponeHidingOfOverlay()" />
      <q-btn class="q-ma-md right" flat icon="keyboard_arrow_right" size="xl" round @click="getNextMediaItem(), postponeHidingOfOverlay()" />

      <!-- <q-btn label="save dictionary to storage" @click="saveToStorage" />
      <q-btn label="load dict from storage" @click="loadFromStorage" /> -->

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
import { ref, onBeforeUnmount, watch, nextTick } from 'vue';

import { useGPhotos } from 'src/composables/useGPhotos';
import type { MediaItem } from 'src/composables/useGPhotos';
import { useWeightedDictionary } from 'src/composables/useWeightedRandomness';
import { useRouter } from 'vue-router';
const router = useRouter();
const initialized = ref<boolean>(false);
const millisPerImage = 5000;
const { getAlbumItems } = useGPhotos();
const { weightedDictionary, totalNrOfPicks, updateCandidateSpace, getRandomItem, getItem, loadFromStorage } = useWeightedDictionary<MediaItem>();
const currentImageUrl = ref<string>('');
const currentVideoUrl = ref<string | undefined>('');
const currentMediaItem = ref<MediaItem>();
const slideshowHistory = ref<string[]>([]);
const autoPlaySlideshow = ref<boolean>(true);
const autoHideOverlay = ref<boolean>(true);
const soundIsOnByDefault = ref<boolean>(false);
const soundIsOn = ref<boolean>(false);
const menuIsOpen = ref<boolean>(false);
const currentIdx = ref<number>(0);
const showDebugBox = ref<boolean>(false);
const isShowingOverlay = ref<boolean>(false);
const videoElement = ref<HTMLVideoElement>();
const imageElement = ref<HTMLImageElement>();
let timeoutId: number;

// watch(imageElement, (newElement, oldElement) => {
//   console.log('imageElement changed!', newElement);
//   if (newElement) {
//     newElement.onload = (e) => console.log('img loaded: ', e);
//   }
// });

function saveSlideshowSettings () {
  console.log('saving slideshowSettings');
  const settings = {
    autoHideOverlay: autoHideOverlay.value,
    autoPlaySlideshow: autoPlaySlideshow.value,
    soundIsOnByDefault: soundIsOnByDefault.value,
  };
  const stringifiedSetting = JSON.stringify(settings);
  localStorage.setItem('slideshowSettings', stringifiedSetting);
}

function loadSlideshowSettings () {
  const stringifiedSettings = localStorage.getItem('slideshowSettings');
  if (stringifiedSettings) {
    const parsedSettings = JSON.parse(stringifiedSettings) as {autoHideOverlay: boolean, autoPlaySlideshow: boolean, soundIsOnByDefault: boolean};
    autoHideOverlay.value = parsedSettings.autoHideOverlay;
    autoPlaySlideshow.value = parsedSettings.autoPlaySlideshow;
    soundIsOnByDefault.value = parsedSettings.soundIsOnByDefault;
    console.log('slideShowSettings loaded');
  } else {
    console.warn('no slideshow settings found in localstorage');
  }
}

function toggleAudio () {
  if (!videoElement.value) {
    console.error('videoElement is undefined');
    return;
  }
  soundIsOn.value = !soundIsOn.value;
  videoElement.value.muted = !soundIsOn.value;
}

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
  window.clearTimeout(hideOverlayTimeoutId);
  isShowingOverlay.value = false;
}

let hideOverlayTimeoutId: number;
function hideOverlayIn (millis: number) {
  console.log('hiding overlay in (ms):', millis);
  window.clearTimeout(hideOverlayTimeoutId);
  hideOverlayTimeoutId = window.setTimeout(() => {
    if (menuIsOpen.value) {
      console.log('menu is open, reschedule hiding of overlay');
      hideOverlayIn(10000);
      return;
    }
    isShowingOverlay.value = false;
  }, millis);
}

function postponeHidingOfOverlay () {
  if (autoHideOverlay.value) {
    hideOverlayIn(10000);
  }
}

function addMediaItemToHistory (id: string) {
  slideshowHistory.value.push(id);
  const stringifiedHistory = JSON.stringify(slideshowHistory.value);
  // console.log('saving slideshowHistory to localstorage');
  localStorage.setItem('slideshowHistory', stringifiedHistory);
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
  // console.log('resetting media item timer');
  timeoutId = window.setTimeout(getNextMediaItem, millisPerImage);
}

function clearNextItemTimer () {
  if (!timeoutId) {
    console.error('no timeOutId found');
    return;
  }
  // console.log('clearing mediaItem timer');
  clearTimeout(timeoutId);
}

function assignPickedMediaItem (mediaItem: MediaItem) {
  // console.log('new mediaItem picked');
  // console.log(mediaItem);
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

  // Handle sliding stuff
  // if (videoElement.value) {
  //   // console.log('clearing videoElement mouseMove');
  //   videoElement.value.onmousemove = null;
  // }
  // if (imageElement.value) {
  //   // console.log('clearing imageElement mouseMove');
  //   imageElement.value.onmousemove = null;
  // }

  if (mediaItem.mediaMetadata.video) {
    // void nextTick(() => {
    // console.log('videoElement: ', videoElement.value);
    if (videoElement.value) {
      // console.log('attaching mousemove event');
      // videoElement.value.onmousedown = onMouseDown;
      // videoElement.value.style.removeProperty('transform');
    }
    // });
    if (mediaItem.mediaMetadata.video.status === 'READY') {
      console.log('this was a video mediaItem');
      soundIsOn.value = soundIsOnByDefault.value;
      currentVideoUrl.value = `${pickedBaseUrl}=dv`;
      clearNextItemTimer();
    }
  } else {
    // void nextTick(() => {
    // console.log('imageElement: ', imageElement.value);
    if (imageElement.value) {
      // console.log('attaching mousemove event');
      // imageElement.value.onmousedown = onMouseDown;
      // imageElement.value.style.removeProperty('transform');
    }
    // });
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
  // console.log('getting next image');

  currentIdx.value++;
  if (currentIdx.value < slideshowHistory.value.length) {
    const pickedItem = fetchMediaItemWithId(slideshowHistory.value[currentIdx.value]);
    assignPickedMediaItem(pickedItem);
  } else {
    const pickedItem = fetchRandomMediaItem();
    assignPickedMediaItem(pickedItem);
    addMediaItemToHistory(pickedItem.id);
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
  loadFromStorage();
  await refetchMediaItems();
  initialized.value = true;

  const slideHistoryString = localStorage.getItem('slideshowHistory');
  if (slideHistoryString) {
    console.log('found saved slideshow history');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const recalledHistory = JSON.parse(slideHistoryString) as string[];
    // console.log('parsed slideshowHistory', recalledHistory);
    slideshowHistory.value = recalledHistory;
    currentIdx.value = recalledHistory.length;
  }

  // console.log(videoElement.value);
  void nextTick(() => {
    // console.log('nextTick from initialize called');
    // console.log('imageElement: ', imageElement.value);
    // console.log('videoElement: ', videoElement.value);

    if (videoElement.value) {
      videoElement.value.onloadstart = () => {
        console.log('videoElement loading');
        if (videoElement.value) {
          videoElement.value.onmousedown = onMouseDown;
          videoElement.value.onmousemove = null;
          videoElement.value.style.removeProperty('transform');
        }
      };
    }
    if (imageElement.value) {
      imageElement.value.onload = () => {
        console.log('imageElement loaded');
        if (imageElement.value) {
          imageElement.value.onmousedown = onMouseDown;
          imageElement.value.onmousemove = null;
          imageElement.value.style.removeProperty('transform');
        }
      };
    }
  });

  loadSlideshowSettings();

  updateAlbumsTimerId = window.setInterval(() => void refetchMediaItems(), 3 * 60 * 1000);
  // getNextMediaItem();
  const pickedItem = fetchRandomMediaItem();
  addMediaItemToHistory(pickedItem.id);
  assignPickedMediaItem(pickedItem);

  watch([autoHideOverlay, autoPlaySlideshow, soundIsOnByDefault], () => {
    saveSlideshowSettings();
  });
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
  } else {
    videoElement.value?.play();
  }
}

function onMainBoxClicked () {
  if (!isDragging) {
    showOverlay();
  }
}

function onMouseDown (e: MouseEvent) {
  const listeningElement = e.currentTarget as HTMLElement;
  xOffset = 0;
  listeningElement.onmousemove = mouseMoved;
}

let xOffset = 0;
const distanceForSwipe = 150;
let isDragging = false;
function mouseMoved (e: MouseEvent) {
  // console.log(e);
  const listeningElement = e.currentTarget as HTMLElement;
  // console.log(listeningElement.style);
  isDragging = e.buttons === 1;
  if (isDragging) {
    if (Math.abs(xOffset) > distanceForSwipe) {
      xOffset < 0 ? getNextMediaItem() : getPrevImage();
      // listeningElement.removeEventListener('mousemove', mouseMoved);
      listeningElement.onmousemove = null;
      // xOffset = 0;
      // listeningElement.style.removeProperty('transform');
    } else {
      xOffset += e.movementX;
      console.log(xOffset);
      listeningElement.style.transform = `translate3d(${xOffset}px, 0, 0)`;
    }
    // listeningElement.addEventListener('mouseup', () => {
    //   console.log('mouseup triggers');
    //   // xOffset = 0;
    // }, { once: true });
  }
}

// function handleSwipe ({ evt, direction }) {
//   console.log('handleSwipe triggered');
//   console.log(evt);
//   if (direction === 'left') {
//     getNextMediaItem();
//   } else {
//     getPrevImage();
//   }
// }

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
  // position: absolute;
  width: 100vw;
  height: 100vh;
  background: black;
  margin: 0;
}

#main-image {
  display: block;
  // margin: auto ;
  // text-align: center;
  /* position:absolute; */
  // z-index: -1;
}

#main-video {
  // display: block;
  // margin: auto 0;
  height: 100%;
  max-width: 100%;
  max-width: 100%;

  // left: auto;
  // right: auto;
  // text-align: center;
  // position:absolute;
  // z-index: -1;
}

#mute-button {
  // background-color: lightseagreen;
  // position: absolute;
  // right: 1rem;
  // bottom: 1rem;
  // margin-right: 1rem;
  flex: 0 0 auto;
  align-self: flex-end;
}

#footer-box {
  // background-color: lightpink;
  z-index: 20;
  position: absolute;
  bottom: 0;
  padding: 2rem;
  width: 100vw;
  // height: 30rem;
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: nowrap;
  justify-content: space-between;
}

#description-box {
  flex-grow: 1;
  // background-color: lightskyblue;
  margin-left: 5rem;
  // position: absolute;
  // left: auto;
  // right: auto;
  // bottom: 1rem;
  * {
    // background-color: lightsteelblue;
    // margin-left: auto;
    // margin-right: auto;
    margin: auto;
    line-height: 3.25rem;
    // display: inline-block;
    width: fit-content;
    // text-align: center;
  }
}

.description-text {
  color: white;
  font-size: 3rem;
  text-shadow: 1px 1px 2px rgb(0, 0, 0), 0 0 1em rgb(0, 0, 0), 0 0 0.2em rgb(0, 0, 0);
}

#overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
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

.vignette-shadow {
  text-shadow: 0 0 0.5rem black,
               0 0 1rem black,
               0 0 1rem black,
               0 0 1rem black,
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.hiddenButton {
  visibility: hidden;
}

</style>
