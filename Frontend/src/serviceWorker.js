/* eslint-disable no-restricted-globals */

import { precacheAndRoute } from 'workbox-precaching';

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    precacheAndRoute(self.__WB_MANIFEST)
  );
});

// ... rest of your service worker code ...

self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
  });
  
  self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activated');
  });
  
  self.addEventListener('fetch', (event) => {
    console.log('Service Worker: Fetching', event.request.url);
  });