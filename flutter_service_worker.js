'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"flutter_bootstrap.js": "5754afcb5ada23e8e3e8cf989995eb1b",
"version.json": "91ba842f0cc32f36db7907b113e3d0a8",
"index.html": "66849a0568eecd82678b704077d044c4",
"/": "66849a0568eecd82678b704077d044c4",
"main.dart.js": "8ff0b9fbf21dacbda3916fd300d1a385",
"flutter.js": "383e55f7f3cce5be08fcf1f3881f585c",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"manifest.json": "d4b927232804df370c6f9ace37d1b8fe",
"assets/AssetManifest.json": "1e686eeb4927f41e0ff266617a6e5336",
"assets/NOTICES": "23793a3a2db3e7d5e3b3eee111ccc2ea",
"assets/FontManifest.json": "9b910aec0e74868f94a1ec3b5fd6a4ed",
"assets/AssetManifest.bin.json": "875e21fd793bfba41df4b3421056ca97",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "89ed8f4e49bcdfc0b5bfc9b24591e347",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"assets/AssetManifest.bin": "6a97d8c35bf134ed3c921bfe1f6fed8f",
"assets/fonts/MaterialIcons-Regular.otf": "2e62172d7ee01a5bdff0077f24febd8b",
"assets/assets/images/para_page_image/rooftopFarm.jpeg": "333aa5dc8b683d258b309238a4327860",
"assets/assets/images/para_page_image/MountainsFromOldRanchRoad.jpeg": "3873c5e8574efb9b71b7c8084ea4d1e8",
"assets/assets/images/para_page_image/mush_eco.jpeg": "345cb3a58554bf19befbd1267b1d2db3",
"assets/assets/images/para_page_image/cc_view_1920x1280.webp": "19eccbf1ed611e9b3ed74888c5149deb",
"assets/assets/images/para_page_image/Backyard_1920x1280_1920x1280.webp": "6d709b6d5bb5af7be940f653c4a65edd",
"assets/assets/images/para_page_image/HumboldtParkPond.jpeg": "d786c54631f424028d872899dd5a9ff8",
"assets/assets/images/para_page_image/wetForest.jpeg": "eeb260caa603ff7967c563320790e88a",
"assets/assets/images/para_page_image/Rock_Garden_1920x1280.jpeg": "d010ec391d81da6de24bd3be85c3c3d8",
"assets/assets/images/para_page_image/wetForest_1920x1280.webp": "5d8dd462707f453555d5db4d5cb7db3a",
"assets/assets/images/para_page_image/rooftopFarm_1920x1280.webp": "73bb2d6cea1cebbd5c5a9cb076b03039",
"assets/assets/images/para_page_image/Backyard_1920x1280.jpeg": "384f8012b0e74b3df98fd51796edf1a6",
"assets/assets/images/para_page_image/HammockView.jpeg": "547045d9a757838144200d583a7a4b5d",
"assets/assets/images/para_page_image/JokulsarlonIceland_1920x1280.webp": "fc6d9af099333c76481a4d4319984332",
"assets/assets/images/para_page_image/Rock_Garden.jpeg": "0ada4fc582889bbcd0614e9769cf4204",
"assets/assets/images/para_page_image/MountainsFromOldRanchRoad_1920x1280.webp": "af4bc7792971d566896e4fec9c172382",
"assets/assets/images/para_page_image/pre_inc_tri.jpeg": "a43525a2fd2fb81a3d35598a2c9032bd",
"assets/assets/images/para_page_image/mush_eco_1920x1280.webp": "3997e540cba194576b2020c51fc5db51",
"assets/assets/images/para_page_image/JokulsarlonIceland_1920_1280.webp": "fc6d9af099333c76481a4d4319984332",
"assets/assets/images/para_page_image/HumboldtParkPond_1920x1280.webp": "5e869383aed5f93827038058bccc0407",
"assets/assets/images/para_page_image/724WinterBackyard.jpeg": "11df5f929b999510fe2c9aac7e604241",
"assets/assets/images/para_page_image/724WinterBackyard_1920x1280.webp": "b88d5b88e01bc9e87659c82a5774c982",
"assets/assets/images/para_page_image/cc_view.jpeg": "2f7953fdb93763f866b035a7e242c499",
"assets/assets/images/para_page_image/para_ready_web_image.sh": "e58bf9a63e4dab1a9c74ab5fa81f3f0c",
"assets/assets/images/para_page_image/Rock_Garden_1920x1280_1920x1280.webp": "8549e021017d72c9d3552bb3daa341fb",
"assets/assets/images/para_page_image/pre_inc_tri_1920x1280.webp": "67ed9aa0a8cc77b6065374bb7ec50f39",
"assets/assets/images/para_page_image/Rock_Garden_1920x1280.webp": "0d916c6913852d3448bc1445963175d3",
"assets/assets/images/para_page_image/NokomisFromGreenBenches_1920x1280.webp": "1559397a2f0b4b226cd44d4c50161cc5",
"assets/assets/images/para_page_image/HammockView_1920x1280.webp": "32a45c345d93c37c7d35553279ff1981",
"assets/assets/images/para_page_image/NokomisFromGreenBenches.jpeg": "2fc5755b540dbb5e44585aa77936fe6f",
"assets/assets/images/rooftopFarm.jpeg": "333aa5dc8b683d258b309238a4327860",
"assets/assets/images/pre_Milwaukee_spatial_distribu.png": "d60a728d30eec17f8c05c3661a1d2a0e",
"assets/assets/images/MountainsFromOldRanchRoad.jpeg": "3873c5e8574efb9b71b7c8084ea4d1e8",
"assets/assets/images/IMG_4423_pic.HEIC": "1f542bf74b8294037e5cb41b1c4e6008",
"assets/assets/images/mush_eco.jpeg": "345cb3a58554bf19befbd1267b1d2db3",
"assets/assets/images/mush_eco.png": "cbe8f873c46d2d47cb0b7428e2675dcf",
"assets/assets/images/pro_pic2.jpg": "b70b146a95c954aebf06ae93c9c86819",
"assets/assets/images/HumboldtParkPond.jpeg": "d786c54631f424028d872899dd5a9ff8",
"assets/assets/images/wetForest.jpeg": "eeb260caa603ff7967c563320790e88a",
"assets/assets/images/resume.pdf": "af0c3150c93e5396c6ec952704e83a59",
"assets/assets/images/Rock_Garden_1920x1280.jpeg": "d010ec391d81da6de24bd3be85c3c3d8",
"assets/assets/images/pre_SimpleStaticMobilePage.PNG": "5d66209861ae5b64554181d9c85ed4c6",
"assets/assets/images/JokulsarlonIceland_1920x_1280.webp": "fc6d9af099333c76481a4d4319984332",
"assets/assets/images/bug_in_box.png": "b59c09ab4a188e563f70c7bb201fb2af",
"assets/assets/images/ee.png": "bdad5b9f546865f4d19827fd77c10ab5",
"assets/assets/images/Backyard_1920x1280.jpeg": "384f8012b0e74b3df98fd51796edf1a6",
"assets/assets/images/JokulsarlonIceland.jpg": "33fbb1c3d20603ada496484a3e0d5b6c",
"assets/assets/images/HammockView.jpeg": "547045d9a757838144200d583a7a4b5d",
"assets/assets/images/Rock_Garden.jpeg": "0ada4fc582889bbcd0614e9769cf4204",
"assets/assets/images/Milwaukee_spatial_distribu.png": "f915ba178878bf6754c30ef3e25ba12d",
"assets/assets/images/pre_inc_tri.jpeg": "a43525a2fd2fb81a3d35598a2c9032bd",
"assets/assets/images/724WinterBackyard.jpeg": "11df5f929b999510fe2c9aac7e604241",
"assets/assets/images/cc_view.jpeg": "2f7953fdb93763f866b035a7e242c499",
"assets/assets/images/pro_pic.jpg": "048fcbee38a794b6e4d28588727e27c0",
"assets/assets/images/inc_tri.png": "cae367bebf1e6bbd54a71750f0e9d323",
"assets/assets/images/the_bug.pdf": "933b70fa569a9aa9f793c09cd1e5b620",
"assets/assets/images/SimpleStaticMobilePage.png": "675d722aa8ef28e48e65cc6cc26b4424",
"assets/assets/images/the_bug.png": "802ed412d0fec8f59d760356a213d55f",
"assets/assets/images/NokomisFromGreenBenches.jpeg": "2fc5755b540dbb5e44585aa77936fe6f",
"assets/assets/fonts/Tourney-Regular.ttf": "ec36595c8ff771a8c01e4cf67e475f54",
"assets/assets/fonts/Montserrat-Bold.ttf": "88932dadc42e1bba93b21a76de60ef7a",
"assets/assets/fonts/Montserrat-Regular.ttf": "9c46095118380d38f12e67c916b427f9",
"assets/assets/fonts/IMFellDoublePicaSC-Regular.ttf": "4ca892b1eebe0ab12efbb377f5cd0af8",
"canvaskit/skwasm.js": "5d4f9263ec93efeb022bb14a3881d240",
"canvaskit/skwasm.js.symbols": "c3c05bd50bdf59da8626bbe446ce65a3",
"canvaskit/canvaskit.js.symbols": "74a84c23f5ada42fe063514c587968c6",
"canvaskit/skwasm.wasm": "4051bfc27ba29bf420d17aa0c3a98bce",
"canvaskit/chromium/canvaskit.js.symbols": "ee7e331f7f5bbf5ec937737542112372",
"canvaskit/chromium/canvaskit.js": "901bb9e28fac643b7da75ecfd3339f3f",
"canvaskit/chromium/canvaskit.wasm": "399e2344480862e2dfa26f12fa5891d7",
"canvaskit/canvaskit.js": "738255d00768497e86aa4ca510cce1e1",
"canvaskit/canvaskit.wasm": "9251bb81ae8464c4df3b072f84aa969b",
"canvaskit/skwasm.worker.js": "bfb704a6c714a75da9ef320991e88b03"};
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
