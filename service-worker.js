const VERSION = "v2.0.0";
const STATIC_CACHE = `static-${VERSION}`;
const DYNAMIC_CACHE = `dynamic-${VERSION}`;
const IMAGE_CACHE = `images-${VERSION}`;

const STATIC_ASSETS = [
  // pages
  "/",
  "/index.html",
  "/offline.html",
  // files
  "/assets/css/styles.css",
  "/assets/js/script.js",
  "/assets/pwa/manifest.json",
  "/assets/pwa/pwa.js",
];

const DEBUG = true;

function log(message) {
  if (DEBUG) {
    // console.log(`[Service Worker ${VERSION}] ${message}`);
  }
}

// مسیرهایی که نباید کش شوند
const NO_CACHE_PATHS = ["/api/"];

// پارامترهای دور زدن کش
const BYPASS_PARAMS = ["nocache", "timestamp", "t", "_", "preview"];

self.addEventListener("install", (event) => {
  log("📦 در حال نصب سرویس ورکر...");

  event.waitUntil(
    (async () => {
      // پرش به فعال‌سازی
      self.skipWaiting();

      // ایجاد و پر کردن کش استاتیک
      const cache = await caches.open(STATIC_CACHE);
      log("📂 در حال کش دارایی‌های استاتیک...");

      // استفاده از addAll برای کارایی بهتر
      try {
        await cache.addAll(STATIC_ASSETS);
        log(`✅ ${STATIC_ASSETS.length} دارایی کش شد`);
      } catch (error) {
        log(`⚠️ خطا در کش کردن دارایی‌ها: ${error.message}`);

        // اگر addAll شکست خورد، تک‌تک اضافه کن
        for (const asset of STATIC_ASSETS) {
          try {
            await cache.add(asset);
            log(`✅ کش شد: ${asset}`);
          } catch (err) {
            log(`❌ خطا در کش کردن ${asset}: ${err.message}`);
          }
        }
      }

      log("✅ نصب کامل شد");
    })(),
  );
});

self.addEventListener("activate", (event) => {
  log("🔧 در حال فعال‌سازی...");

  event.waitUntil(
    (async () => {
      // حذف کش‌های قدیمی
      const cacheNames = await caches.keys();
      const deletePromises = cacheNames.map(async (cacheName) => {
        if (
          !cacheName.startsWith("static-") &&
          !cacheName.startsWith("dynamic-") &&
          !cacheName.startsWith("images-")
        ) {
          // کش‌های قدیمی غیراستاندارد
          log(`🗑️ حذف کش قدیمی: ${cacheName}`);
          await caches.delete(cacheName);
        } else if (
          cacheName !== STATIC_CACHE &&
          cacheName !== DYNAMIC_CACHE &&
          cacheName !== IMAGE_CACHE
        ) {
          // کش‌های نسخه‌های قبلی
          log(`🗑️ حذف کش نسخه قدیمی: ${cacheName}`);
          await caches.delete(cacheName);
        }
      });

      await Promise.all(deletePromises);

      // ادعای کنترل روی کلاینت‌ها
      await self.clients.claim();

      log("✅ فعال‌سازی کامل شد - نسخه: " + VERSION);

      // اطلاع به کلاینت‌ها
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: "SW_READY",
          version: VERSION,
          cacheNames: [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE],
        });
      });
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  // فقط GET را هندل کن
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  // فقط منابع هم‌منبع (مگر اینکه CDN مجاز باشد)
  if (url.origin !== self.location.origin) {
    // برای منابع خارجی می‌توانی استراتژی خاص پیاده‌سازی کنی
    return;
  }

  // بررسی مسیرهای no-cache
  const pathname = url.pathname;
  for (const path of NO_CACHE_PATHS) {
    if (pathname.startsWith(path)) {
      log(`🚫 مسیر no-cache: ${pathname}`);
      event.respondWith(fetchWithoutCache(event.request));
      return;
    }
  }

  // بررسی پارامترهای دور زدن کش
  for (const param of BYPASS_PARAMS) {
    if (url.searchParams.has(param)) {
      log(`🚫 پارامتر bypass: ${param}=${url.searchParams.get(param)}`);
      event.respondWith(fetchWithoutCache(event.request));
      return;
    }
  }

  // استراتژی بر اساس نوع درخواست
  const request = event.request;

  // صفحات HTML
  if (request.mode === "navigate") {
    event.respondWith(handlePageRequest(request));
    return;
  }

  // API calls
  if (
    pathname.includes("/api/") ||
    request.headers.get("Accept")?.includes("application/json")
  ) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // تصاویر
  if (/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(pathname)) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // فایل‌های استاتیک (CSS, JS, فونت‌ها)
  if (/\.(css|js|woff2?|ttf|eot|json)$/i.test(pathname)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // سایر درخواست‌ها
  event.respondWith(handleGenericRequest(request));
});

// ========== استراتژی‌های مختلف ==========

// استراتژی برای صفحات
async function handlePageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const url = new URL(request.url);

  try {
    // ابتدا از شبکه بگیر
    const networkResponse = await fetch(request);

    // اگر موفق بود، در پس‌زمینه ذخیره کن
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      cache
        .put(request, responseToCache)
        .then(() => {
          log(`📄 صفحه ذخیره شد: ${url.pathname}`);
        })
        .catch((err) => {
          log(`⚠️ خطا در ذخیره صفحه: ${err.message}`);
        });
    }

    return networkResponse;
  } catch (error) {
    log(`🌐 خطای شبکه برای صفحه: ${error.message}`);

    // از کش جستجو کن
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      log(`📂 صفحه از کش: ${url.pathname}`);
      return cachedResponse;
    }

    // اگر صفحه اصلی بود، از کش استاتیک بگیر
    if (url.pathname === "/" || url.pathname === "/") {
      const staticCache = await caches.open(STATIC_CACHE);
      const homePage = await staticCache.match("/");
      if (homePage) {
        log(`🏠 صفحه اصلی از کش استاتیک`);
        return homePage;
      }
    }

    // صفحه آفلاین
    log(`📴 نمایش صفحه آفلاین برای: ${url.pathname}`);
    return getOfflinePage();
  }
}

// استراتژی برای API
async function handleApiRequest(request) {
  try {
    // API ها همیشه از شبکه (بدون کش)
    const response = await fetch(request);
    return response;
  } catch (error) {
    log(`🔌 خطای API در حالت آفلاین: ${error.message}`);

    // برای برخی APIها می‌توانی پاسخ کش‌شده برگردانی
    // یا یک پاسخ پیش‌فرض

    return new Response(
      JSON.stringify({
        error: true,
        message: "اتصال اینترنت برقرار نیست",
        offline: true,
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

// استراتژی برای تصاویر
async function handleImageRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(IMAGE_CACHE);

  // بررسی اولیه کش
  const cachedResponse = await cache.match(request);

  // استراتژی: Stale-While-Revalidate
  // اول کش را برگردان، سپس در پس‌زمینه به‌روز کن

  if (cachedResponse) {
    // در پس‌زمینه به‌روزرسانی کن
    updateImageInBackground(request, cache);
    return cachedResponse;
  }

  // اگر در کش نبود، از شبکه بگیر
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // در کش ذخیره کن
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache).then(() => {
        log(`🖼️ تصویر ذخیره شد: ${url.pathname}`);

        // مدیریت سایز کش
        manageCacheSize(cache, 200); // حداکثر 200 تصویر
      });
    }

    return networkResponse;
  } catch (error) {
    log(`❌ خطا در دریافت تصویر: ${error.message}`);

    // تصویر placeholder
    if (url.pathname.includes("/uploads/")) {
      return createUploadPlaceholder();
    }

    return createImagePlaceholder();
  }
}

// استراتژی برای فایل‌های استاتیک
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  // استراتژی: Cache First با به‌روزرسانی در پس‌زمینه

  // اگر در کش بود، برگردان و در پس‌زمینه چک کن
  if (cachedResponse) {
    updateStaticInBackground(request, cache);
    return cachedResponse;
  }

  // اگر در کش نبود، از شبکه بگیر
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      log(`📁 فایل استاتیک ذخیره شد: ${new URL(request.url).pathname}`);
    }

    return networkResponse;
  } catch (error) {
    log(`⚠️ خطا در دریافت فایل استاتیک: ${error.message}`);

    // پاسخ جایگزین بر اساس نوع فایل
    const url = new URL(request.url);

    if (url.pathname.endsWith(".css")) {
      return new Response("/* فایل CSS موقتاً در دسترس نیست */", {
        headers: { "Content-Type": "text/css" },
      });
    }

    if (url.pathname.endsWith(".js")) {
      return new Response("// فایل JS موقتاً در دسترس نیست", {
        headers: { "Content-Type": "application/javascript" },
      });
    }

    throw error;
  }
}

// استراتژی عمومی برای سایر درخواست‌ها
async function handleGenericRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);

  try {
    // اول شبکه
    const networkResponse = await fetch(request);

    // اگر موفق بود و قابل کش کردن است
    if (
      networkResponse.ok &&
      networkResponse.status === 200 &&
      !request.url.includes("/api/")
    ) {
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache).catch((err) => {
        log(`⚠️ خطا در ذخیره کش: ${err.message}`);
      });
    }

    return networkResponse;
  } catch (error) {
    log(`🌐 خطای شبکه: ${error.message}`);

    // از کش جستجو کن
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // پاسخ پیش‌فرض
    return new Response(
      "منبع در دسترس نیست. لطفاً اتصال اینترنت را بررسی کنید.",
      {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  }
}

// ========== توابع کمکی ==========

// صفحه آفلاین
async function getOfflinePage() {
  try {
    // اول از کش استاتیک بگیر
    const staticCache = await caches.open(STATIC_CACHE);
    const offlinePage = await staticCache.match("/offline");

    if (offlinePage) {
      return offlinePage;
    }

    // اگر در کش نبود، صفحه ساده بساز
    return createSimpleOfflinePage();
  } catch (error) {
    log(`❌ خطا در دریافت صفحه آفلاین: ${error.message}`);
    return createSimpleOfflinePage();
  }
}

// ساخت صفحه آفلاین ساده
function createSimpleOfflinePage() {
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>حالت آفلاین | ${document.title || "وبسایت"}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: #333;
        }
        .offline-container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
        }
        .icon {
            font-size: 80px;
            margin-bottom: 20px;
            color: #667eea;
        }
        h1 {
            color: #2d3748;
            margin-bottom: 15px;
            font-size: 28px;
        }
        p {
            color: #4a5568;
            line-height: 1.6;
            margin-bottom: 25px;
            font-size: 16px;
        }
        .buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        button {
            padding: 12px 30px;
            border: none;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 140px;
        }
        .retry-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .retry-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }
        .home-btn {
            background: #edf2f7;
            color: #4a5568;
        }
        .home-btn:hover {
            background: #e2e8f0;
            transform: translateY(-2px);
        }
        .tips {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: right;
        }
        .tips h3 {
            color: #2d3748;
            margin-bottom: 10px;
            font-size: 18px;
        }
        .tips ul {
            list-style: none;
            text-align: right;
        }
        .tips li {
            margin-bottom: 8px;
            color: #4a5568;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
        }
        .tips li::before {
            content: "•";
            color: #667eea;
            font-size: 20px;
        }
        @media (max-width: 480px) {
            .offline-container {
                padding: 30px 20px;
            }
            .buttons {
                flex-direction: column;
            }
            button {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="offline-container">
        <div class="icon">📶</div>
        <h1>اتصال اینترنت قطع است</h1>
        <p>
            در حال حاضر به اینترنت متصل نیستید. برخی امکانات ممکن است در دسترس نباشند.
            پس از اتصال مجدد، صفحه را Refresh کنید.
        </p>
        
        <div class="buttons">
            <button class="retry-btn" onclick="window.location.reload()">
                🔄 تلاش مجدد
            </button>
            <button class="home-btn" onclick="window.location.href='/'">
                🏠 بازگشت به خانه
            </button>
        </div>
        
        <div class="tips">
            <h3>راهنمایی:</h3>
            <ul>
                <li>اتصال Wi-Fi یا اینترنت خود را بررسی کنید</li>
                <li>صفحاتی که قبلاً مشاهده کرده‌اید، در دسترس هستند</li>
                <li>می‌توانید به حالت آنلاین بازگردید</li>
            </ul>
        </div>
    </div>
    
    <script>
        // بررسی وضعیت آنلاین/آفلاین
        function updateOnlineStatus() {
            if (navigator.onLine) {
                // اگر آنلاین شد، اطلاع بده
                if (Notification.permission === 'granted') {
                    new Notification('📱 اتصال اینترنت برقرار شد', {
                        body: 'می‌توانید ادامه دهید',
                        icon: '/assets/images/icons/icon-6.png'
                    });
                }
                
                // بعد از 2 ثانیه رفرresh کن
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        }
        
        // رویدادهای وضعیت شبکه
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', () => {
            console.log('آفلاین شدید');
        });
        
        // بررسی اولیه
        if (navigator.onLine) {
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
        
        // درخواست مجوز نوتیفیکیشن
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        // ارسال پیام به سرویس ورکر
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'OFFLINE_PAGE_VIEWED',
                timestamp: Date.now(),
                url: window.location.href
            });
        }
    </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    statusText: "OK",
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

// تصویر placeholder
function createImagePlaceholder() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
    <rect width="200" height="150" fill="#f8f9fa"/>
    <rect x="50" y="40" width="100" height="70" fill="#e9ecef" stroke="#adb5bd" stroke-width="1"/>
    <circle cx="100" cy="75" r="15" fill="#6c757d" opacity="0.5"/>
    <text x="100" y="120" text-anchor="middle" font-family="Arial" font-size="12" fill="#6c757d">
      تصویر در دسترس نیست
    </text>
  </svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000",
    },
  });
}

// placeholder برای تصاویر آپلود شده
function createUploadPlaceholder() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
    <rect width="200" height="150" fill="#f1f3f5"/>
    <path d="M60 50 L140 50 L160 70 L160 120 L40 120 L40 70 Z" fill="white" stroke="#ced4da" stroke-width="1"/>
    <path d="M80 80 L120 80 M100 60 L100 100" stroke="#adb5bd" stroke-width="2" stroke-linecap="round"/>
    <text x="100" y="140" text-anchor="middle" font-family="Arial" font-size="10" fill="#868e96">
      تصویر آپلود شده - آفلاین
    </text>
  </svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

// به‌روزرسانی تصویر در پس‌زمینه
async function updateImageInBackground(request, cache) {
  setTimeout(async () => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
        log(`🔄 تصویر به‌روزرسانی شد: ${new URL(request.url).pathname}`);
      }
    } catch (error) {
      // خطا در به‌روزرسانی مشکلی ندارد
    }
  }, 1000);
}

// به‌روزرسانی فایل استاتیک در پس‌زمینه
async function updateStaticInBackground(request, cache) {
  setTimeout(async () => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
        log(`🔄 فایل استاتیک به‌روزرسانی شد: ${new URL(request.url).pathname}`);
      }
    } catch (error) {
      // خطا در به‌روزرسانی مشکلی ندارد
    }
  }, 2000);
}

// مدیریت سایز کش
async function manageCacheSize(cache, maxItems) {
  try {
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      // قدیمی‌ترین آیتم را حذف کن
      await cache.delete(keys[0]);
      log(`🗑️ آیتم قدیمی حذف شد. باقی مانده: ${keys.length - 1}`);

      // اگر هنوز بیشتر از حد مجاز است، ادامه بده
      if (keys.length - 1 > maxItems) {
        manageCacheSize(cache, maxItems);
      }
    }
  } catch (error) {
    log(`⚠️ خطا در مدیریت سایز کش: ${error.message}`);
  }
}

// درخواست بدون کش
async function fetchWithoutCache(request) {
  try {
    return await fetch(request);
  } catch (error) {
    log(`❌ خطا در دریافت بدون کش: ${error.message}`);

    // اگر صفحه بود، صفحه آفلاین برگردان
    if (request.mode === "navigate") {
      return getOfflinePage();
    }

    // برای APIها
    if (request.url.includes("/api/")) {
      return new Response(
        JSON.stringify({
          error: "network_error",
          message: "خطا در ارتباط با سرور",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    throw error;
  }
}

// ========== مدیریت پیام‌ها ==========

self.addEventListener("message", async (event) => {
  if (!event.data) return;

  const { type, data } = event.data;

  switch (type) {
    case "GET_CACHE_INFO":
      const cacheInfo = await getCacheInfo();
      event.ports?.[0]?.postMessage({
        type: "CACHE_INFO",
        data: cacheInfo,
      });
      break;

    case "CLEAR_CACHE":
      await clearAllCaches();
      log("🗑️ تمام کش‌ها پاک شدند");
      event.ports?.[0]?.postMessage({ success: true });
      break;

    case "UPDATE_CACHE":
      await updateStaticAssets();
      log("🔄 کش به‌روزرسانی شد");
      event.ports?.[0]?.postMessage({ success: true });
      break;

    case "FORCE_UPDATE":
      self.skipWaiting();
      log("🔄 به‌روزرسانی اجباری");
      break;

    case "CHECK_OFFLINE":
      const isOffline = !navigator.onLine;
      event.ports?.[0]?.postMessage({
        type: "OFFLINE_STATUS",
        offline: isOffline,
      });
      break;
  }
});

// دریافت اطلاعات کش
async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const info = {};

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    info[name] = {
      count: keys.length,
      urls: keys.slice(0, 10).map((req) => ({
        url: req.url,
        method: req.method,
      })),
    };
  }

  return {
    version: VERSION,
    caches: info,
    totalSize: Object.values(info).reduce((sum, cache) => sum + cache.count, 0),
  };
}

// پاک کردن تمام کش‌ها
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
}

// به‌روزرسانی دارایی‌های استاتیک
async function updateStaticAssets() {
  const cache = await caches.open(STATIC_CACHE);

  for (const asset of STATIC_ASSETS) {
    try {
      const response = await fetch(asset, { cache: "no-cache" });
      if (response.ok) {
        await cache.put(asset, response);
        log(`✅ به‌روزرسانی: ${asset}`);
      }
    } catch (error) {
      log(`⚠️ خطا در به‌روزرسانی ${asset}`);
    }
  }
}

// ========== هندل خطاها ==========

self.addEventListener("error", (event) => {
  log(`💥 خطا: ${event.error?.message || "ناشناخته"}`);
});

self.addEventListener("unhandledrejection", (event) => {
  log(`💥 Promise rejection: ${event.reason?.message || "ناشناخته"}`);
});

// ========== هندل رویدادهای Push ==========

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || "اطلاعیه جدید",
      icon: "/assets/images/icons/icon-6.png",
      badge: "/assets/images/icons/icon-6.png",
      vibrate: [200, 100, 200],
      data: {
        url: data.url || "/",
        timestamp: Date.now(),
      },
      actions: [
        {
          action: "open",
          title: "مشاهده",
        },
        {
          action: "close",
          title: "بستن",
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "اطلاعیه", options),
    );
  } catch (error) {
    log(`⚠️ خطا در پردازش Push: ${error.message}`);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "open") {
    event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
  }
});

log("✅ سرویس ورکر لود شد و آماده است");
