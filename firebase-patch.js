// ============================================
// 🔥 Firebase FINAL - palestinske-rogaland
// ============================================

// منع التحميل المتكرر
if (window._firebaseLoaded) { throw new Error("already loaded"); }
window._firebaseLoaded = true;

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyB2vd10mZBfvZ9_NxpjzT07ih0m5cOTOgo",
  authDomain: "palestinske-rogaland.firebaseapp.com",
  projectId: "palestinske-rogaland",
  storageBucket: "palestinske-rogaland.firebasestorage.app",
  messagingSenderId: "228379992371",
  appId: "1:228379992371:web:56577dc6e553ef39d91e46"
});

const db = getFirestore(app);
const REF = doc(db, "appData", "main");
var lastSaveTime = 0;

function clean(obj) {
  var c = JSON.parse(JSON.stringify(obj));
  for (var k in c) {
    if (typeof c[k] === 'string' && c[k].length > 900000) delete c[k];
  }
  return c;
}

function updateLocal(cloudData) {
  var raw = localStorage.getItem("appData");
  var local = raw ? JSON.parse(raw) : {};
  var logo = local.logo; // احتفظ بالlogo المحلي
  Object.assign(local, cloudData);
  if (logo && !local.logo) local.logo = logo;
  localStorage.setItem("appData", JSON.stringify(local));
}

// ═══ save ═══
var _orig = window.save;
window.save = function() {
  lastSaveTime = Date.now();
  if (_orig) { try { _orig(); } catch(e) {} }
  try {
    var raw = localStorage.getItem("appData");
    if (raw) {
      setDoc(REF, clean(JSON.parse(raw)))
        .then(function() { console.log("✅ محفوظ"); })
        .catch(function(e) { console.error("❌", e); });
    }
  } catch(e) {}
};

// ═══ loadFromCloud ═══
window.loadFromCloud = function(cb) {
  getDoc(REF).then(function(s) {
    if (s.exists()) updateLocal(s.data());
    if (cb) cb();
  }).catch(function() { if (cb) cb(); });
};

// ═══ Sync Logic ═══
var synced = sessionStorage.getItem("fb_ok");

if (!synced) {
  // أول زيارة بهاد التاب
  getDoc(REF).then(function(snap) {
    if (snap.exists()) {
      updateLocal(snap.data());
      sessionStorage.setItem("fb_ok", Date.now().toString());
      location.reload();
    } else {
      // Firebase فاضي - ارفع المحلي
      var raw = localStorage.getItem("appData");
      if (raw) setDoc(REF, clean(JSON.parse(raw)));
      sessionStorage.setItem("fb_ok", Date.now().toString());
    }
  }).catch(function() {
    // offline - كمّل عادي
    sessionStorage.setItem("fb_ok", Date.now().toString());
  });
} else {
  // Real-time listener
  var skip = true;
  onSnapshot(REF, function(snap) {
    if (!snap.exists()) return;
    if (skip) { skip = false; return; }
    // تجاهل لو أنا حفظت خلال آخر 5 ثواني
    if (Date.now() - lastSaveTime < 5000) return;
    updateLocal(snap.data());
    console.log("⚡ تحديث!");
    location.reload();
  }, function() {
    // error - تجاهل (offline مثلاً)
  });
}

console.log("🔥 Firebase OK");
