/* Service Worker للجالية الفلسطينية في روغالاند
   ينظّم cache للملفات بشكل آمن — يتجاهل chrome-extension و POST/PUT/DELETE */

var CACHE_NAME = 'palestinske-rogaland-v3';
var urlsToCache = [
    './',
    './index.html',
    './translate.js',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

// التثبيت — preload الملفات الأساسية
self.addEventListener('install', function(event){
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache){
            console.log('✅ Cache opened');
            // add لكل ملف منفرد — لو فشل واحد، الباقي يكمل
            return Promise.all(urlsToCache.map(function(url){
                return cache.add(url).catch(function(e){
                    console.warn('⚠️ تعذّر تخزين ' + url + ' في الـ cache:', e.message);
                });
            }));
        }).then(function(){ return self.skipWaiting(); })
    );
});

// التفعيل — احذف الـ caches القديمة
self.addEventListener('activate', function(event){
    event.waitUntil(
        caches.keys().then(function(names){
            return Promise.all(
                names.filter(function(n){ return n !== CACHE_NAME; })
                     .map(function(n){ return caches.delete(n); })
            );
        }).then(function(){ return self.clients.claim(); })
    );
});

// ═══ هل الطلب قابل للـ cache؟ ═══
function isCacheable(request){
    // فقط GET requests
    if(request.method !== 'GET') return false;
    var url = request.url;
    // تجاهل بروتوكولات غير http(s)
    if(url.indexOf('chrome-extension://') === 0) return false;
    if(url.indexOf('chrome://') === 0) return false;
    if(url.indexOf('edge://') === 0) return false;
    if(url.indexOf('moz-extension://') === 0) return false;
    if(url.indexOf('safari-extension://') === 0) return false;
    if(url.indexOf('about:') === 0) return false;
    if(url.indexOf('data:') === 0) return false;
    if(url.indexOf('blob:') === 0) return false;
    // فقط http و https
    if(url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) return false;
    // تجاهل طلبات Firebase الديناميكية و API (دائماً نجيب أحدث بيانات)
    if(url.indexOf('firestore.googleapis.com') > -1) return false;
    if(url.indexOf('firebaseio.com') > -1) return false;
    if(url.indexOf('identitytoolkit.googleapis.com') > -1) return false;
    if(url.indexOf('/api/') > -1) return false;
    return true;
}

// ═══ fetch handler — network first ثم cache ═══
self.addEventListener('fetch', function(event){
    var request = event.request;
    
    // غير قابل للـ cache → اتركه يمر طبيعياً بدون تدخّل
    if(!isCacheable(request)) return;
    
    event.respondWith(
        fetch(request).then(function(response){
            // نسخة للـ cache + نسخة للمستخدم
            if(response && response.status === 200 && response.type === 'basic'){
                var clone = response.clone();
                caches.open(CACHE_NAME).then(function(cache){
                    try { cache.put(request, clone); } catch(e){ /* تجاهل أخطاء الـ cache */ }
                }).catch(function(){});
            }
            return response;
        }).catch(function(){
            // الشبكة فشلت → ارجع من الـ cache
            return caches.match(request);
        })
    );
});

// رسائل من الصفحة (مثل skipWaiting)
self.addEventListener('message', function(event){
    if(event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
