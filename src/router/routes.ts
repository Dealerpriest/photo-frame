import { RouteRecordRaw } from 'vue-router';
import { initialize } from 'src/composables/useGPhotos';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/BasicLayout.vue'),
    children: [
      { path: 'auth/callback', component: () => import('pages/AuthCallback.vue') },
    ],
  },
  {
    name: 'userRoute',
    path: '',
    component: () => import('layouts/BasicLayout.vue'),
    beforeEnter: async (to, from, next) => {
      await initialize(to.path);
      next();
    },
    children: [
      // { path: '', component: () => import('pages/AuthTest.vue') },
      { path: 'album', component: () => import('src/pages/ChooseAlbum.vue') },
      { path: 'frame', component: () => import('src/pages/SlideShow.vue'), alias: '' },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
  },
];

export default routes;
