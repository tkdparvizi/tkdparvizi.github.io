let deferredPrompt = null;
let installShown = false;
let lastStatus = navigator.onLine;

// تنظیمات ریسپانسیو
function getResponsiveConfig() {
  const width = window.innerWidth;
  
  if (width <= 480) { // موبایل
    return {
      padding: "16px",
      minWidth: "280px",
      maxWidth: "85%",
      fontSize: "14px",
      buttonPadding: "10px 16px",
      iconSize: "20px",
      gap: "8px",
      position: "center"
    };
  } else if (width <= 768) { // تبلت
    return {
      padding: "18px",
      minWidth: "320px",
      maxWidth: "80%",
      fontSize: "15px",
      buttonPadding: "12px 20px",
      iconSize: "22px",
      gap: "10px",
      position: "center"
    };
  } else { // دسکتاپ
    return {
      padding: "20px",
      minWidth: "350px",
      maxWidth: "400px",
      fontSize: "16px",
      buttonPadding: "12px 24px",
      iconSize: "24px",
      gap: "12px",
      position: width > 1024 ? "flex-start" : "center"
    };
  }
}

function createCustomToast(options) {
  const {
    message,
    isConfirmDialog = false,
    confirmText = "نصب",
    cancelText = "بعداً",
    type = "info",
    duration = 3000
  } = options;

  const responsive = getResponsiveConfig();

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    box-sizing: border-box;
  `;

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: #1a1a1a;
    color: #ffffff;
    border-radius: 12px;
    padding: ${responsive.padding};
    min-width: ${responsive.minWidth};
    max-width: ${responsive.maxWidth};
    width: 100%;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    text-align: center;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: ${responsive.fontSize};
    box-sizing: border-box;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid #cc0000;
  `;

  const iconMap = {
    success: '✅',
    error: '❌',
    info: ''
  };

  const icon = iconMap[type] || '';
  
  if (isConfirmDialog) {
    toast.innerHTML = `
      <div style="font-size: ${responsive.iconSize}; margin-bottom: 10px;">${icon}</div>
      <h3 style="margin: 10px 0; color: #ffffff; font-size: ${parseInt(responsive.fontSize) + 2}px; line-height: 1.4;">${message}</h3>
      <div style="display: flex; flex-direction: ${window.innerWidth <= 480 ? 'column' : 'row'}; gap: ${responsive.gap}; justify-content: center; margin-top: 20px;">
        <button id="cancelBtn" style="
          padding: ${responsive.buttonPadding};
          border: none;
          border-radius: 8px;
          background: #333333;
          color: #ffffff;
          cursor: pointer;
          font-size: ${responsive.fontSize};
          transition: all 0.3s;
          flex: ${window.innerWidth <= 480 ? 'none' : '1'};
          order: ${window.innerWidth <= 480 ? '2' : '1'};
          border: 1px solid #cc0000;
        ">${cancelText}</button>
        <button id="confirmBtn" style="
          padding: ${responsive.buttonPadding};
          border: none;
          border-radius: 8px;
          background: #cc0000;
          color: #ffffff;
          cursor: pointer;
          font-size: ${responsive.fontSize};
          transition: all 0.3s;
          flex: ${window.innerWidth <= 480 ? 'none' : '1'};
          order: ${window.innerWidth <= 480 ? '1' : '2'};
        ">${confirmText}</button>
      </div>
    `;
  } else {
    toast.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: ${responsive.gap}; flex-wrap: wrap;">
        <span style="font-size: ${responsive.iconSize}; flex-shrink: 0;">${icon}</span>
        <span style="text-align: ${icon ? 'right' : 'center'}; flex: 1; min-width: 0; color: #ffffff;">${message}</span>
      </div>
    `;
  }

  if (isConfirmDialog) {
    setTimeout(() => {
      const confirmBtn = toast.querySelector('#confirmBtn');
      const cancelBtn = toast.querySelector('#cancelBtn');
      
      // افکت hover برای دسکتاپ
      if (window.innerWidth > 768) {
        confirmBtn.addEventListener('mouseenter', () => {
          confirmBtn.style.background = '#ff0000';
          confirmBtn.style.transform = 'translateY(-2px)';
        });
        confirmBtn.addEventListener('mouseleave', () => {
          confirmBtn.style.background = '#cc0000';
          confirmBtn.style.transform = 'translateY(0)';
        });
        
        cancelBtn.addEventListener('mouseenter', () => {
          cancelBtn.style.background = '#444444';
          cancelBtn.style.transform = 'translateY(-2px)';
        });
        cancelBtn.addEventListener('mouseleave', () => {
          cancelBtn.style.background = '#333333';
          cancelBtn.style.transform = 'translateY(0)';
        });
      }
      
      // افکت تاچ برای موبایل
      confirmBtn.addEventListener('touchstart', () => {
        confirmBtn.style.background = '#ff0000';
        confirmBtn.style.transform = 'scale(0.98)';
      });
      confirmBtn.addEventListener('touchend', () => {
        setTimeout(() => {
          confirmBtn.style.background = '#cc0000';
          confirmBtn.style.transform = 'scale(1)';
        }, 150);
      });
      
      cancelBtn.addEventListener('touchstart', () => {
        cancelBtn.style.background = '#444444';
        cancelBtn.style.transform = 'scale(0.98)';
      });
      cancelBtn.addEventListener('touchend', () => {
        setTimeout(() => {
          cancelBtn.style.background = '#333333';
          cancelBtn.style.transform = 'scale(1)';
        }, 150);
      });
    }, 0);
  }

  overlay.appendChild(toast);
  document.body.appendChild(overlay);

  // محاسبه موقعیت برای نمایش در قسمت بالا در موبایل
  const updateToastPosition = () => {
    if (!isConfirmDialog && options.isOnline !== undefined) {
      const config = getResponsiveConfig();
      toast.style.position = 'fixed';
      
      if (window.innerWidth <= 768) {
        // در موبایل و تبلت از بالا نمایش داده شود
        toast.style.top = '20px';
        toast.style.right = '50%';
        toast.style.transform = 'translateX(50%)';
        toast.style.left = 'auto';
        toast.style.margin = '0';
        overlay.style.background = 'transparent';
        overlay.style.justifyContent = 'flex-start';
        overlay.style.alignItems = 'flex-start';
        overlay.style.padding = '20px';
      } else {
        // در دسکتاپ از بالا و راست
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.left = 'auto';
        toast.style.transform = 'none';
        toast.style.margin = '0';
        overlay.style.background = 'transparent';
        overlay.style.justifyContent = 'flex-start';
        overlay.style.alignItems = 'flex-start';
        overlay.style.padding = '0';
      }
      
      overlay.style.pointerEvents = 'none';
    }
  };

  // موقعیت اولیه
  updateToastPosition();

  // گوش دادن به تغییر سایز صفحه
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateToastPosition();
      
      // به‌روزرسانی طرح‌بندی برای دیالوگ تایید
      if (isConfirmDialog) {
        const buttonsContainer = toast.querySelector('div');
        if (buttonsContainer) {
          buttonsContainer.style.flexDirection = window.innerWidth <= 480 ? 'column' : 'row';
          const cancelBtn = toast.querySelector('#cancelBtn');
          const confirmBtn = toast.querySelector('#confirmBtn');
          if (cancelBtn && confirmBtn) {
            cancelBtn.style.flex = window.innerWidth <= 480 ? 'none' : '1';
            confirmBtn.style.flex = window.innerWidth <= 480 ? 'none' : '1';
            cancelBtn.style.order = window.innerWidth <= 480 ? '2' : '1';
            confirmBtn.style.order = window.innerWidth <= 480 ? '1' : '2';
          }
        }
      }
    }, 250);
  });

  if (!isConfirmDialog) {
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
            window.removeEventListener('resize', updateToastPosition);
          }
        }, 300);
      }
    }, duration);
  }

  return {
    overlay,
    toast,
    close: () => {
      if (document.body.contains(overlay)) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
            window.removeEventListener('resize', updateToastPosition);
          }
        }, 300);
      }
    }
  };
}

function showInstallToast() {
  const toast = createCustomToast({
    message: "مایلید برنامه را نصب کنید؟",
    isConfirmDialog: true,
    type: "info"
  });

  toast.toast.querySelector('#confirmBtn').addEventListener('click', () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          toast.close();
          setTimeout(() => {
            createCustomToast({
              message: "نصب برنامه آغاز شد 🚀",
              type: "success",
              duration: 3000
            });
          }, 500);
        }
        deferredPrompt = null;
      });
    }
    toast.close();
  });

  toast.toast.querySelector('#cancelBtn').addEventListener('click', () => {
    toast.close();
  });
}

function showNetToast(isOnline) {
  const toast = createCustomToast({
    message: isOnline ? "اینترنت وصل شد ✅" : "اینترنت قطع شد ❌",
    type: isOnline ? "success" : "error",
    duration: 3000,
    isOnline: isOnline
  });
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('PWA SW REGISTERED');
      })
      .catch((error) => {
        console.log('PWA SW UNREGISTERED', error);
      });
  });
}

// PWA Installation Events
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (!installShown) {
    // تاخیر برای نمایش بهتر در موبایل
    setTimeout(() => {
      showInstallToast();
    }, 10000);
    installShown = true;
  }
});

window.addEventListener('appinstalled', () => {
  console.log('PWA INSTALLED');
  deferredPrompt = null;
});

// Network Status Events
window.addEventListener('online', () => {
  if (!lastStatus) {
    showNetToast(true);
    lastStatus = true;
  }
});

window.addEventListener('offline', () => {
  if (lastStatus) {
    showNetToast(false);
    lastStatus = false;
  }
});

// Initial Load
window.addEventListener('DOMContentLoaded', () => {
  if (!navigator.onLine) {
    showNetToast(false);
    lastStatus = false;
  }
});

// پشتیبانی از viewport موبایل
function setViewportMeta() {
  if (!document.querySelector('meta[name="viewport"]')) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
    document.head.appendChild(meta);
  }
}

// جلوگیری از زوم در موبایل هنگام تاچ
document.addEventListener('touchstart', function(event) {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// اجرای اولیه
setViewportMeta();