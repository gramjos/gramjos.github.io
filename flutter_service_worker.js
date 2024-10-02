'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"flutter_bootstrap.js": "beb22a05556494510395d1711e020fa7",
"version.json": "91ba842f0cc32f36db7907b113e3d0a8",
"index.html": "66849a0568eecd82678b704077d044c4",
"/": "66849a0568eecd82678b704077d044c4",
"main.dart.js": "5e5a57cc8ef1af34b9919dffe0d1d330",
"flutter.js": "f393d3c16b631f36852323de8e583132",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"manifest.json": "d4b927232804df370c6f9ace37d1b8fe",
"assets/AssetManifest.json": "2904012bd53e41012d5fba20c44d8ac8",
"assets/NOTICES": "ef463f026d674a3abb847a0999c3db15",
"assets/FontManifest.json": "9b910aec0e74868f94a1ec3b5fd6a4ed",
"assets/AssetManifest.bin.json": "572ff52b3d704ca8d6a59db675138de5",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "89ed8f4e49bcdfc0b5bfc9b24591e347",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"assets/AssetManifest.bin": "7da31a9669a51189a1b14a9c46eccbdc",
"assets/fonts/MaterialIcons-Regular.otf": "2e62172d7ee01a5bdff0077f24febd8b",
"assets/assets/images/art_images_parallax/mush_eco.jpeg": "345cb3a58554bf19befbd1267b1d2db3",
"assets/assets/images/art_images_parallax/door_1920x1280.jpg": "15edaf5a9c89fe40144e3e057f0562c2",
"assets/assets/images/art_images_parallax/firePlace_1920x1280.webp": "8c6c495d051d2790810127d60e566cb2",
"assets/assets/images/art_images_parallax/bush_1920x1280.webp": "15e97bfb88da21e6846784d735373a66",
"assets/assets/images/art_images_parallax/by_1920x1280.webp": "968e8b6b7930b5fa6f0bdece1a80fb7f",
"assets/assets/images/art_images_parallax/by_1920x1280.jpg": "abbd6b07ffee55d18d5083775445adac",
"assets/assets/images/art_images_parallax/firePlace_1920x1280%2520copy.jpg": "068f9c244581e218aaac65f098b6405d",
"assets/assets/images/art_images_parallax/mush_eco_1920x1280.webp": "3997e540cba194576b2020c51fc5db51",
"assets/assets/images/art_images_parallax/para_ready_web_image.sh": "e58bf9a63e4dab1a9c74ab5fa81f3f0c",
"assets/assets/images/art_images_parallax/treeUp_1920x1280.webp": "3e468b3dacab4f02323867c31e182d8e",
"assets/assets/images/art_images_parallax/door_1920x1280.webp": "3b0e9bab0001caa71bc3c39613e42e8b",
"assets/assets/images/art_images_parallax/bush_1920x1280.jpg": "60492954178227ef227bbe7bb49291ea",
"assets/assets/images/pre_Milwaukee_spatial_distribu.png": "d60a728d30eec17f8c05c3661a1d2a0e",
"assets/assets/images/IMG_4423_pic.HEIC": "1f542bf74b8294037e5cb41b1c4e6008",
"assets/assets/images/mush_eco.png": "cbe8f873c46d2d47cb0b7428e2675dcf",
"assets/assets/images/pro_pic2.jpg": "b70b146a95c954aebf06ae93c9c86819",
"assets/assets/images/resume.pdf": "af0c3150c93e5396c6ec952704e83a59",
"assets/assets/images/pre_SimpleStaticMobilePage.PNG": "5d66209861ae5b64554181d9c85ed4c6",
"assets/assets/images/JokulsarlonIceland_1920x_1280.webp": "fc6d9af099333c76481a4d4319984332",
"assets/assets/images/bug_in_box.png": "b59c09ab4a188e563f70c7bb201fb2af",
"assets/assets/images/ee.png": "bdad5b9f546865f4d19827fd77c10ab5",
"assets/assets/images/JokulsarlonIceland.jpg": "33fbb1c3d20603ada496484a3e0d5b6c",
"assets/assets/images/Milwaukee_spatial_distribu.png": "f915ba178878bf6754c30ef3e25ba12d",
"assets/assets/images/pro_pic.jpg": "048fcbee38a794b6e4d28588727e27c0",
"assets/assets/images/inc_tri.png": "cae367bebf1e6bbd54a71750f0e9d323",
"assets/assets/images/the_bug.pdf": "933b70fa569a9aa9f793c09cd1e5b620",
"assets/assets/images/SimpleStaticMobilePage.png": "675d722aa8ef28e48e65cc6cc26b4424",
"assets/assets/images/the_bug.png": "802ed412d0fec8f59d760356a213d55f",
"assets/assets/fonts/Tourney-Regular.ttf": "ec36595c8ff771a8c01e4cf67e475f54",
"assets/assets/fonts/Montserrat-Bold.ttf": "88932dadc42e1bba93b21a76de60ef7a",
"assets/assets/fonts/Montserrat-Regular.ttf": "9c46095118380d38f12e67c916b427f9",
"assets/assets/fonts/IMFellDoublePicaSC-Regular.ttf": "4ca892b1eebe0ab12efbb377f5cd0af8",
"canvaskit/skwasm.js": "694fda5704053957c2594de355805228",
"canvaskit/skwasm.js.symbols": "262f4827a1317abb59d71d6c587a93e2",
"canvaskit/canvaskit.js.symbols": "48c83a2ce573d9692e8d970e288d75f7",
"canvaskit/skwasm.wasm": "9f0c0c02b82a910d12ce0543ec130e60",
"canvaskit/chromium/canvaskit.js.symbols": "a012ed99ccba193cf96bb2643003f6fc",
"canvaskit/chromium/canvaskit.js": "671c6b4f8fcc199dcc551c7bb125f239",
"canvaskit/chromium/canvaskit.wasm": "b1ac05b29c127d86df4bcfbf50dd902a",
"canvaskit/canvaskit.js": "66177750aff65a66cb07bb44b8c6422b",
"canvaskit/canvaskit.wasm": "1f237a213d7370cf95f443d896176460",
"canvaskit/skwasm.worker.js": "89990e8c92bcb123999aa81f7e203b1c"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"flutter_bootstrap.js",
"assets/AssetManifest.bin.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
