import { ref } from 'vue';
import axios, { AxiosResponse } from 'axios';
import credentials from '../../credentials.json';
import { Router } from 'vue-router';
const scopes = ['https://www.googleapis.com/auth/photoslibrary.readonly'];

interface TokenResponse {
  // eslint-disable-next-line camelcase
  access_token: string,
  // eslint-disable-next-line camelcase
  expires_in: number,
  // eslint-disable-next-line camelcase
  refresh_token?: string,
}
interface TokenData {
  // accessToken: string,
  refreshToken: string,
  // accessExpiresAt: Date,
}

interface Album {
  title: string, id: string, productUrl: string, mediaItemsCount: string
}

interface AlbumListingResponse {
  nextPageToken?: string,
  albums?: Album[]
}

export interface MediaItem {
  id: string,
  productUrl: string,
  baseUrl: string,
  mimeType: string,
  mediaMetaData: Record<string, unknown>,
  filename: string,
}

interface MediaItemsResponse {
  mediaItems: MediaItem[],
  nextPageToken: string,
}

const accessToken = ref<string>();
const tokenExpiresAt = ref<Date>();
// const refreshToken = ref<string>('');

const albums = ref<AlbumListingResponse['albums']>([]);
const activeAlbum = ref<Album>();
// const mediaItems = ref<MediaItem[]>([]);

// let returnRoute: RouteLocationNormalizedLoaded;

let timeOut: number;
const creds = credentials.web;

export async function initialize (returnPath?: string) {
  console.log('initialize called');
  const dataString = localStorage.getItem('activeAlbum');
  if (dataString) {
    activeAlbum.value = JSON.parse(dataString) as Album;
  }
  if (!accessToken.value ||
      // !refreshToken.value ||
      !tokenExpiresAt.value) {
    console.log('tokenData not set. Will init from localstorage');
    try {
      const refreshToken = loadTokenData();
      console.log(`refreshToken loaded: ${refreshToken}`);
      await fetchNewAccessToken(refreshToken);
    } catch (e) {
      console.error(e);
      if (returnPath) {
        serverAuth(returnPath);
      } else {
        serverAuth('/');
      }
    }
    // scheduleTokenRefresh();
  }
}
// initialize();

function scheduleTokenRefreshIn (secondsUntil: number) {
  console.log(`scheduling Token refresh in ${secondsUntil - 10} seconds`);
  if (timeOut) {
    clearTimeout(timeOut);
  }
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + secondsUntil);
  tokenExpiresAt.value = expiresAt;

  setTimeout(() => {
    const refreshToken = loadTokenData();
    void fetchNewAccessToken(refreshToken);
  }, (secondsUntil - 10) * 1000);
}

function serverAuth (returnPath : string) {
  console.log('triggered server auth');
  // const returnRoute = '/';
  // try {
  //   const route = useRoute();
  // } catch (e) {
  //   console.error(e);
  //   console.log('using default returnRoute');
  // }

  const authUrl = creds.auth_uri;
  const formData = `client_id=${creds.client_id}&redirect_uri=http://localhost:8080/auth/callback&response_type=code&scope=${scopes[0]}&access_type=offline&include_granted_scopes=true`;

  const fullUrl = authUrl + '?' + formData;

  // returnRoute = route;
  // route.fullPath
  localStorage.setItem('returnPath', returnPath);
  // console.log(route.fullPath);
  console.log(fullUrl);
  location.assign(fullUrl);
}

function saveTokenData (tokenResponse: TokenResponse) {
  if (!tokenResponse.refresh_token) {
    throw Error('no rereshtoken in provided tokenResponse');
  }
  // tokenData.timeStamp = new Date();
  // const expiresAt = new Date();
  // expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);
  const tokenData: TokenData = {
    // accessExpiresAt: expiresAt,
    // accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
  };
  localStorage.setItem('tokenData', JSON.stringify(tokenData));
}

function loadTokenData () {
  console.log('loading tokenData');
  const dataString = localStorage.getItem('tokenData');
  if (dataString) {
    const loadedData: TokenData = JSON.parse(dataString) as TokenData;
    // accessToken.value = loadedData.accessToken;
    // refreshToken.value = loadedData.refreshToken;
    console.log(`loadedData: ${dataString}`);
    return loadedData.refreshToken;
  } else {
    throw Error('no tokeData in localstorage');
  }
}

async function fetchTokens (code: string) {
  console.log(`fetching tokens with code: ${code}`);
  const formData = `client_id=${creds.client_id}&client_secret=${creds.client_secret}&code=${code}&grant_type=authorization_code&redirect_uri=http://localhost:8080/auth/callback`;
  const response: AxiosResponse<TokenResponse> = await axios.post('https://oauth2.googleapis.com/token', formData);
  const tokenData = response.data;
  saveTokenData(tokenData);
  accessToken.value = tokenData.access_token;

  // const expiresAt = new Date();
  // expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);
  // tokenExpiresAt.value = expiresAt;
  scheduleTokenRefreshIn(tokenData.expires_in);
  console.log(tokenData);
}

async function fetchNewAccessToken (refreshToken: string) {
  console.log('fetching new accessToken');
  const formData = `client_id=${creds.client_id}&client_secret=${creds.client_secret}&refresh_token=${refreshToken}&grant_type=refresh_token`;
  const response: AxiosResponse<TokenResponse> = await axios.post('https://oauth2.googleapis.com/token', formData);
  const tokenData = response.data;
  console.log(`tokenData received: ${JSON.stringify(tokenData)}`);
  accessToken.value = tokenData.access_token;
  scheduleTokenRefreshIn(tokenData.expires_in);
}

async function listAlbums () {
  const getNextPage = async (pageToken: string) => {
    if (accessToken.value) {
      // const response: AxiosResponse<AlbumListingResponse> = await axios.get('https://photoslibrary.googleapis.com/v1/albums', { headers: { Authorization: `Bearer ${accessToken.value}` } });
      const response: AxiosResponse<AlbumListingResponse> = await axios.get('https://photoslibrary.googleapis.com/v1/albums', { params: { pageToken: pageToken }, headers: { Authorization: `Bearer ${accessToken.value}` } });
      console.log('retrieved:', response.data);
      return response.data;
    }

    return Promise.reject('failed to fetch new album page');
  };
  if (accessToken.value) {
    let { data }: AxiosResponse<AlbumListingResponse> = await axios.get('https://photoslibrary.googleapis.com/v1/albums', { headers: { Authorization: `Bearer ${accessToken.value}` } });
    console.log('retrieved:', data);
    if (data.albums) {
      albums.value = data.albums;
    }
    while (data.nextPageToken) {
      const nextPageToken = data.nextPageToken;
      data = await getNextPage(nextPageToken);
      albums.value?.push(data);
    }

    // if (response.data.nextPageToken) {
    //   const nextPageToken = response.data.nextPageToken;
    //   console.log('nextPageToken :>> ', nextPageToken);
    //   response = await axios.get('https://photoslibrary.googleapis.com/v1/albums', { params: { pageToken: nextPageToken }, headers: { Authorization: `Bearer ${accessToken.value}` } });
    //   console.log(response);
    //   albums.value = response.data.albums;
    //   return albums.value;
    // }
  } else {
    console.error('no access token present. cant call API');
  }
}

function setActiveAlbum (album: Album) {
  localStorage.setItem('activeAlbum', JSON.stringify(album));
}

async function getAlbumItems () {
  // const accessToken: string = localStorage.getItem('accessToken') as string;
  if (!accessToken.value) {
    console.error('no accesstoken for fetching');
    return;
  }

  // const album: Album = JSON.parse(localStorage.getItem('chosenAlbum') as string) as Album;
  if (!activeAlbum.value) {
    console.error('no album selected');
    return;
  }
  console.log('expected nr of retrieved items:', activeAlbum.value.mediaItemsCount);
  const album = activeAlbum.value;
  // const formData = '';
  // const retrievedItemsCount = 0;
  let response: AxiosResponse<MediaItemsResponse> = await axios.post('https://photoslibrary.googleapis.com/v1/mediaItems:search', { albumId: album.id, pageSize: '100' }, { headers: { Authorization: `Bearer ${accessToken.value}` } });
  console.log('response.data:>> ', response.data);
  // retrievedItemsCount += response.data.mediaItems.length;
  // mediaItems.value = [...response.data.mediaItems];
  const mediaItems = [...response.data.mediaItems];
  while (response.data.nextPageToken) {
    response = await axios.post('https://photoslibrary.googleapis.com/v1/mediaItems:search', { albumId: album.id, pageSize: '100', pageToken: response.data.nextPageToken }, { headers: { Authorization: `Bearer ${accessToken.value}` } });
    // retrievedItemsCount += response.data.mediaItems.length;
    console.log(' response.data :>> ', response.data);
    mediaItems.push(...response.data.mediaItems);
  }
  return mediaItems;
  // console.log('nr of retrieved items: ', retrievedItemsCount);
}

export function useGPhotos () {
  function goToReturnRoute (router: Router) {
    // const router = useRouter();
    const returnPath = localStorage.getItem('returnPath');
    console.log('router is', router);
    console.log('returnPath:', returnPath);
    if (returnPath) {
      // console.log(`going to return url: ${returnRoute.fullPath}`);
      void router.replace({ path: returnPath });
    } else {
      void router.replace({ path: '/' });
    }
  }
  return {
    // initialize,
    serverAuth,
    goToReturnRoute,
    fetchTokens,
    listAlbums,
    setActiveAlbum,
    albums,
    getAlbumItems,
    // mediaItems,
  };
}
