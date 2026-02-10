// ============================================
// 🔥 Firebase Integration v4 - palestinske-rogaland
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

// ═══ استبدال save - يحفظ محلي + Firebase ═══
var _origSave = window.save;
window.save = function() {
  // حفظ محلي أولاً
  if (_origSave) { try { _origSave(); } catch(e) {} }
  // حفظ في Firebase
  try {
    var data = JSON.parse(localStorage.getItem("appData"));
    if (data) {
      setDoc(REF, cleanForFirestore(data), { merge: true })
        .then(function() { console.log("✅ Firebase: تم الحفظ"); })
        .catch(function(e) { console.error("❌ Firebase save error:", e); });
    }
  } catch(e) { console.error("❌ Save error:", e); }
};

// ═══ استبدال loadFromCloud - يحمّل من Firebase ═══
window.loadFromCloud = function(callback) {
  getDoc(REF).then(function(snap) {
    if (snap.exists()) {
      var cloudData = snap.data();
      console.log("✅ Firebase: تم التحميل");
      if (window.appData) {
        Object.assign(window.appData, cloudData);
        if (window.appData.adminPass) window.adminPass = window.appData.adminPass;
        localStorage.setItem("appData", JSON.stringify(window.appData));
      }
      if (callback) callback();
    } else {
      // لا بيانات بالسحابة - رفع المحلية
      var raw = localStorage.getItem("appData");
      if (raw) {
        setDoc(REF, cleanForFirestore(JSON.parse(raw)))
          .then(function() { console.log("☁️ Firebase: تم رفع البيانات المحلية"); });
      }
      if (callback) callback();
    }
  }).catch(function(e) {
    console.error("❌ Firebase load error:", e);
    if (callback) callback();
  });
};

// ═══ تحميل تلقائي من Firebase عند فتح الصفحة ═══
function autoLoadFromFirebase() {
  getDoc(REF).then(function(snap) {
    if (snap.exists()) {
      var cloudData = snap.data();
      console.log("🔄 Firebase: تحميل تلقائي عند فتح الصفحة");
      if (window.appData) {
        // دمج البيانات - Firebase له الأولوية
        Object.assign(window.appData, cloudData);
        if (window.appData.adminPass) window.adminPass = window.appData.adminPass;
        localStorage.setItem("appData", JSON.stringify(window.appData));
        // إعادة عرض الصفحة
        if (typeof renderAll === 'function') renderAll();
        else if (typeof renderHome === 'function') renderHome();
        else if (typeof showSection === 'function') showSection('home');
      }
      console.log("✅ Firebase: البيانات محدّثة!");
    }
  }).catch(function(e) {
    console.error("❌ Firebase auto-load error:", e);
  });
}

// انتظر حتى يكتمل تحميل الصفحة ثم حمّل من Firebase
if (document.readyState === 'complete') {
  setTimeout(autoLoadFromFirebase, 1000);
} else {
  window.addEventListener('load', function() {
    setTimeout(autoLoadFromFirebase, 1000);
  });
}

console.log("🔥 Firebase patch v4 loaded!");
