// ============================================
// 🔥 Firebase FINAL - بدون reload
// ============================================
if (window._fbOK) throw "";
window._fbOK = true;

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

function clean(obj) {
  var c = JSON.parse(JSON.stringify(obj));
  for (var k in c) if (typeof c[k] === 'string' && c[k].length > 900000) delete c[k];
  return c;
}

// ═══ save: محلي + Firebase ═══
var _orig = window.save;
window.save = function() {
  if (_orig) try { _orig(); } catch(e) {}
  try {
    var raw = localStorage.getItem("appData");
    if (raw) setDoc(REF, clean(JSON.parse(raw))).then(function() {
      console.log("✅ محفوظ");
    }).catch(function(e) { console.error("❌", e); });
  } catch(e) {}
};

// ═══ loadFromCloud: من Firebase ═══
window.loadFromCloud = function(cb) {
  getDoc(REF).then(function(s) {
    if (s.exists()) {
      var raw = localStorage.getItem("appData");
      var local = raw ? JSON.parse(raw) : {};
      var logo = local.logo;
      Object.assign(local, s.data());
      if (logo && !local.logo) local.logo = logo;
      localStorage.setItem("appData", JSON.stringify(local));
    }
    if (cb) cb();
  }).catch(function() { if (cb) cb(); });
};

// ═══ أول تحميل: sync من Firebase ثم حدّث localStorage ═══
getDoc(REF).then(function(snap) {
  if (snap.exists()) {
    var raw = localStorage.getItem("appData");
    var local = raw ? JSON.parse(raw) : {};
    var logo = local.logo;
    Object.assign(local, snap.data());
    if (logo && !local.logo) local.logo = logo;
    localStorage.setItem("appData", JSON.stringify(local));
    console.log("✅ بيانات Firebase جاهزة");
  } else {
    var raw = localStorage.getItem("appData");
    if (raw) setDoc(REF, clean(JSON.parse(raw)));
    console.log("☁️ رفع أولي");
  }
}).catch(function() {});

console.log("🔥 Firebase OK");
