'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"version.json": "5f5437807efa9025726e7d69c65cb0d0",
"index.html": "aeb05d47f85dcc23c7e508c0b31f26bf",
"/": "aeb05d47f85dcc23c7e508c0b31f26bf",
"main.dart.js": "1ed33f6bc5ecc332ddfabe853d0b37a1",
"flutter.js": "7d69e653079438abfbb24b82a655b0a4",
"favicon.png": "7dcd6cc2e65ba65dfb9c3dd3442391f2",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"manifest.json": "cc4fe8d6c5b568cfbb4497b8a9eda23b",
"assets/AssetManifest.json": "7d1ae9546c4ef0a3ea9fafd04135b8ef",
"assets/NOTICES": "0efa65be3f2b58926a65381f7a9f5584",
"assets/FontManifest.json": "9b910aec0e74868f94a1ec3b5fd6a4ed",
"assets/AssetManifest.bin.json": "b056fbe3acbbe73d5c0fb896fc4f53ea",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "89ed8f4e49bcdfc0b5bfc9b24591e347",
"assets/shaders/ink_sparkle.frag": "4096b5150bac93c41cbc9b45276bd90f",
"assets/AssetManifest.bin": "7e6e850790a53c17fcac42f1ed1f4c9c",
"assets/fonts/MaterialIcons-Regular.otf": "393b1a02528646bd2e940e7788c8a80a",
"assets/assets/images/rooftopFarm.jpeg": "333aa5dc8b683d258b309238a4327860",
"assets/assets/images/pre_Milwaukee_spatial_distribu.png": "d60a728d30eec17f8c05c3661a1d2a0e",
"assets/assets/images/MountainsFromOldRanchRoad.jpeg": "3873c5e8574efb9b71b7c8084ea4d1e8",
"assets/assets/images/pro_pic2.jpg": "b70b146a95c954aebf06ae93c9c86819",
"assets/assets/images/HumboldtParkPond.jpeg": "d786c54631f424028d872899dd5a9ff8",
"assets/assets/images/wetForest.jpeg": "eeb260caa603ff7967c563320790e88a",
"assets/assets/images/resume.pdf": "86d29facd1310ffc534da180dedfadd0",
"assets/assets/images/pre_SimpleStaticMobilePage.PNG": "5d66209861ae5b64554181d9c85ed4c6",
"assets/assets/images/bug_in_box.png": "b59c09ab4a188e563f70c7bb201fb2af",
"assets/assets/images/JokulsarlonIceland.jpg": "33fbb1c3d20603ada496484a3e0d5b6c",
"assets/assets/images/HammockView.jpeg": "547045d9a757838144200d583a7a4b5d",
"assets/assets/images/Milwaukee_spatial_distribu.png": "f915ba178878bf6754c30ef3e25ba12d",
"assets/assets/images/pre_inc_tri.jpeg": "a43525a2fd2fb81a3d35598a2c9032bd",
"assets/assets/images/724WinterBackyard.jpeg": "11df5f929b999510fe2c9aac7e604241",
"assets/assets/images/cc_view.jpeg": "2f7953fdb93763f866b035a7e242c499",
"assets/assets/images/pre_shell_intro.png": "4787afa0668abadc49c6c5db4aecf29e",
"assets/assets/images/pro_pic.jpg": "048fcbee38a794b6e4d28588727e27c0",
"assets/assets/images/inc_tri.png": "cae367bebf1e6bbd54a71750f0e9d323",
"assets/assets/images/SimpleStaticMobilePage.png": "675d722aa8ef28e48e65cc6cc26b4424",
"assets/assets/images/fire_place.png": "24d06b91cc89fa73b9cfd69c6d41cf03",
"assets/assets/images/the_bug.png": "802ed412d0fec8f59d760356a213d55f",
"assets/assets/images/NokomisFromGreenBenches.jpeg": "2fc5755b540dbb5e44585aa77936fe6f",
"assets/assets/journal_pdf/Interactivity_Navigation.pdf": "94b0ed88fc3fcf845285e0d7a25dc383",
"assets/assets/journal_pdf/Projections.pdf": "db26ac3574dd2a64afc04c25a6e67f79",
"assets/assets/journal_pdf/TheDartLanguage.pdf": "8776f585d940ace018c7806f1deb1b67",
"assets/assets/journal_pdf/shell_intro.pdf": "cce021b1c6f5f5641c445fd9f67bae44",
"assets/assets/journals.json": "0d3eacdb1df41504a85e9fb243b65324",
"assets/assets/fonts/Tourney-Regular.ttf": "ec36595c8ff771a8c01e4cf67e475f54",
"assets/assets/fonts/Montserrat-Bold.ttf": "88932dadc42e1bba93b21a76de60ef7a",
"assets/assets/fonts/Montserrat-Regular.ttf": "9c46095118380d38f12e67c916b427f9",
"assets/assets/fonts/IMFellDoublePicaSC-Regular.ttf": "4ca892b1eebe0ab12efbb377f5cd0af8",
"canvaskit/skwasm.js": "87063acf45c5e1ab9565dcf06b0c18b8",
"canvaskit/skwasm.wasm": "2fc47c0a0c3c7af8542b601634fe9674",
"canvaskit/chromium/canvaskit.js": "0ae8bbcc58155679458a0f7a00f66873",
"canvaskit/chromium/canvaskit.wasm": "143af6ff368f9cd21c863bfa4274c406",
"canvaskit/canvaskit.js": "eb8797020acdbdf96a12fb0405582c1b",
"canvaskit/canvaskit.wasm": "73584c1a3367e3eaf757647a8f5c5989",
"canvaskit/skwasm.worker.js": "bfb704a6c714a75da9ef320991e88b03"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"assets/AssetManifest.json",
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
