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

export interface Album {
  title: string, id: string, productUrl: string, mediaItemsCount: number
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
  mediaMetadata: {
    width: string;
    height: string;
    creationTime: string;
    photo?: {
      cameraMake: string;
      cameraModel: string;
      focalLength: string;
      apertureFNumber: string;
      isoEquivalent: string;
      exposureTime: string;
    },
    video?: {
      cameraMake: string,
      cameraModel: string,
      fps: string,
      status: string
    },
  },
  filename: string,
  description: string
}

interface MediaItemsResponse {
  mediaItems: MediaItem[],
  nextPageToken: string,
}

const accessToken = ref<string>();
const tokenWillRefreshAt = ref<Date>();
// const refreshToken = ref<string>('');

const albums = ref<Album[]>([]);
const activeAlbums = ref<Album[]>();
// const mediaItems = ref<MediaItem[]>([]);

// let returnRoute: RouteLocationNormalizedLoaded;

let timeOut: number;
const creds = credentials.web;

export async function initialize (returnPath?: string) {
  console.log('initialize called');
  const dataString = localStorage.getItem('activeAlbums');
  if (dataString) {
    activeAlbums.value = JSON.parse(dataString) as Album[];
  }
  if (!accessToken.value ||
      !tokenWillRefreshAt.value) {
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
  }
}

function scheduleTokenRefreshIn (secondsUntil: number) {
  console.log(`scheduling Token refresh in ${secondsUntil} seconds`);
  if (timeOut) {
    clearTimeout(timeOut);
  }
  const tokenRefreshAt = new Date();
  tokenRefreshAt.setSeconds(tokenRefreshAt.getSeconds() + secondsUntil);
  tokenWillRefreshAt.value = tokenRefreshAt;

  setTimeout(() => {
    const refreshToken = loadTokenData();
    void fetchNewAccessToken(refreshToken);
  }, secondsUntil * 1000);
}

function serverAuth (returnPath : string) {
  console.log('triggered server auth');
  const authUrl = creds.auth_uri;
  const formData = `client_id=${creds.client_id}&redirect_uri=http://localhost:8080/auth/callback&response_type=code&scope=${scopes[0]}&access_type=offline&prompt=consent&include_granted_scopes=true`;

  const fullUrl = authUrl + '?' + formData;

  localStorage.setItem('returnPath', returnPath);
  console.log('requesting code by redirecting to: ', fullUrl);
  location.assign(fullUrl);
}

function saveTokenData (tokenResponse: TokenResponse) {
  if (!tokenResponse.refresh_token) {
    throw Error('no refreshtoken in provided tokenResponse');
  }
  const tokenData: TokenData = {
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
    throw Error('no tokenData in localstorage');
  }
}

async function fetchTokens (code: string) {
  console.log(`fetching tokens with code: ${code}`);
  const formData = `client_id=${creds.client_id}&client_secret=${creds.client_secret}&code=${code}&grant_type=authorization_code&redirect_uri=http://localhost:8080/auth/callback`;
  const response: AxiosResponse<TokenResponse> = await axios.post('https://oauth2.googleapis.com/token', formData);
  const tokenData = response.data;
  console.log('fetchTokens response: ', tokenData);
  saveTokenData(tokenData);
  accessToken.value = tokenData.access_token;

  // const expiresAt = new Date();
  // expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);
  // tokenExpiresAt.value = expiresAt;
  scheduleTokenRefreshIn(tokenData.expires_in);
  console.log(tokenData);
  return response.data;
}

async function fetchNewAccessToken (refreshToken: string) {
  console.log('fetching new accessToken');
  const formData = `client_id=${creds.client_id}&client_secret=${creds.client_secret}&refresh_token=${refreshToken}&grant_type=refresh_token`;
  const response: AxiosResponse<TokenResponse> = await axios.post('https://oauth2.googleapis.com/token', formData);
  const tokenData = response.data;
  console.log(`tokenData received: ${JSON.stringify(tokenData)}`);
  accessToken.value = tokenData.access_token;
  scheduleTokenRefreshIn(tokenData.expires_in - 10);
}

async function fetchAllAlbums () {
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
      if (data.albums) {
        albums.value = albums.value?.concat(data.albums);
      }
    }
  } else {
    console.error('no access token present. cant call API');
  }
}

function setActiveAlbums (albums: Album[]) {
  console.log('setting active albums to: ', albums);
  localStorage.setItem('activeAlbums', JSON.stringify(albums));
}

async function getAlbumItems () {
  // const accessToken: string = localStorage.getItem('accessToken') as string;
  if (!accessToken.value) {
    console.error('no accesstoken for fetching');
    return;
  }

  // const album: Album = JSON.parse(localStorage.getItem('chosenAlbum') as string) as Album;
  if (!activeAlbums.value) {
    console.error('no albums selected');
    return;
  }
  let totatlNrOfItems = 0;
  for (const album of activeAlbums.value) {
    totatlNrOfItems += album.mediaItemsCount;
  }
  console.log('expected nr of retrieved items:', totatlNrOfItems);
  const selectedAlbums = activeAlbums.value;

  const getNextPage = async (albumId: string, pageToken?: string) => {
    if (!accessToken.value) {
      // console.error('no accesstoken for fetching');
      return Promise.reject('No accesstoken available');
    }
    const params = {
      albumId: albumId,
      pageSize: '100',
      ...(pageToken && { pageToken: pageToken }),
    };
    const response: AxiosResponse<MediaItemsResponse> = await axios.post('https://photoslibrary.googleapis.com/v1/mediaItems:search', params, { headers: { Authorization: `Bearer ${accessToken.value}` } });
    console.log('getNextPage gave: ', response.data);
    return response.data;
  };
  const mediaItems: MediaItem[] = [];
  for (const album of selectedAlbums) {
    let retrievedData = await getNextPage(album.id);
    mediaItems.push(...retrievedData.mediaItems);
    while (retrievedData.nextPageToken) {
      retrievedData = await getNextPage(album.id, retrievedData.nextPageToken);
      mediaItems.push(...retrievedData.mediaItems);
    }
  }
  return mediaItems;
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
    fetchAllAlbums,
    setActiveAlbums,
    getAlbumItems,
    albums,
    activeAlbums,
    // mediaItems,
  };
}
