// ============================================
// 🔥 Firebase Integration v5 - palestinske-rogaland
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB2vd10mZBfvZ9_NxpjzT07ih0m5cOTOgo",
  authDomain: "palestinske-rogaland.firebaseapp.com",
  projectId: "palestinske-rogaland",
  storageBucket: "palestinske-rogaland.firebasestorage.app",
  messagingSenderId: "228379992371",
  appId: "1:228379992371:web:56577dc6e553ef39d91e46"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const REF = doc(db, "appData", "main");

function cleanForFirestore(obj) {
  var clean = JSON.parse(JSON.stringify(obj));
  for (var key in clean) {
    if (typeof clean[key] === 'string' && clean[key].length > 900000) {
      delete clean[key];
    }
  }
  return clean;
}

// ═══ save - محلي + Firebase ═══
var _origSave = window.save;
window.save = function() {
  if (_origSave) { try { _origSave(); } catch(e) {} }
  try {
    var data = JSON.parse(localStorage.getItem("appData"));
    if (data) {
      setDoc(REF, cleanForFirestore(data), { merge: true })
        .then(function() { console.log("✅ Firebase: تم الحفظ"); })
        .catch(function(e) { console.error("❌ Firebase save:", e); });
    }
  } catch(e) { console.error("❌ Save error:", e); }
};

// ═══ loadFromCloud - من Firebase ═══
window.loadFromCloud = function(callback) {
  getDoc(REF).then(function(snap) {
    if (snap.exists()) {
      var cloudData = snap.data();
      if (window.appData) {
        Object.assign(window.appData, cloudData);
        if (window.appData.adminPass) window.adminPass = window.appData.adminPass;
        localStorage.setItem("appData", JSON.stringify(window.appData));
      }
      if (callback) callback();
    } else {
      var raw = localStorage.getItem("appData");
      if (raw) {
        setDoc(REF, cleanForFirestore(JSON.parse(raw)));
      }
      if (callback) callback();
    }
  }).catch(function(e) {
    console.error("❌ Firebase load:", e);
    if (callback) callback();
  });
};

// ═══ تحميل تلقائي + إعادة عرض الصفحة ═══
function autoSync() {
  getDoc(REF).then(function(snap) {
    if (snap.exists()) {
      var cloudData = snap.data();
      if (window.appData) {
        Object.assign(window.appData, cloudData);
        if (window.appData.adminPass) window.adminPass = window.appData.adminPass;
        localStorage.setItem("appData", JSON.stringify(window.appData));
        // إعادة عرض كل أقسام الصفحة
        try { if (typeof renderHomePage === 'function') renderHomePage(); } catch(e) {}
        try { if (typeof renderHomeNews === 'function') renderHomeNews(); } catch(e) {}
        try { if (typeof renderHomeEvents === 'function') renderHomeEvents(); } catch(e) {}
        try { if (typeof renderQuickAccessBtns === 'function') renderQuickAccessBtns(); } catch(e) {}
        try { if (typeof loadHomeSettings === 'function') loadHomeSettings(); } catch(e) {}
        console.log("✅ Firebase: تم المزامنة وتحديث الصفحة");
      }
    } else {
      // أول مرة - رفع البيانات المحلية
      var raw = localStorage.getItem("appData");
      if (raw) {
        setDoc(REF, cleanForFirestore(JSON.parse(raw)))
          .then(function() { console.log("☁️ Firebase: رفع أولي للبيانات"); });
      }
    }
  }).catch(function(e) { console.error("❌ Firebase sync:", e); });
}

// تشغيل المزامنة بعد تحميل الصفحة
if (document.readyState === 'complete') {
  setTimeout(autoSync, 1500);
} else {
  window.addEventListener('load', function() {
    setTimeout(autoSync, 1500);
  });
}

console.log("🔥 Firebase patch v5 loaded!");
