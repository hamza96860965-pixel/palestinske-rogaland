// ============================================
// 🔥 Firebase v7 - Firebase = المصدر الوحيد
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

// تحديث appData وإعادة عرض الصفحة
function applyData(data) {
  if (!window.appData) return;
  // احتفظ بالlogo المحلي لأنه كبير ومش بنرفعه
  var localLogo = window.appData.logo;
  Object.keys(window.appData).forEach(function(k) { delete window.appData[k]; });
  Object.assign(window.appData, data);
  if (localLogo && !window.appData.logo) window.appData.logo = localLogo;
  if (window.appData.adminPass) window.adminPass = window.appData.adminPass;
  localStorage.setItem("appData", JSON.stringify(window.appData));
}

function refreshUI() {
  try { if (typeof renderHomePage === 'function') renderHomePage(); } catch(e) {}
  try { if (typeof renderHomeNews === 'function') renderHomeNews(); } catch(e) {}
  try { if (typeof renderHomeEvents === 'function') renderHomeEvents(); } catch(e) {}
  try { if (typeof renderSocialLinks === 'function') renderSocialLinks(); } catch(e) {}
  try { if (typeof loadHomeSettings === 'function') loadHomeSettings(); } catch(e) {}
}

// ═══ save - يحفظ على Firebase فوراً ═══
var _origSave = window.save;
window.save = function() {
  // حفظ محلي أولاً (سريع)
  if (_origSave) { try { _origSave(); } catch(e) {} }
  // رفع لـ Firebase
  try {
    var data = window.appData || JSON.parse(localStorage.getItem("appData"));
    if (data) {
      setDoc(REF, cleanForFirestore(data))
        .then(function() { console.log("✅ Firebase: محفوظ"); })
        .catch(function(e) { console.error("❌ Firebase:", e); });
    }
  } catch(e) {}
};

// ═══ loadFromCloud ═══
window.loadFromCloud = function(callback) {
  getDoc(REF).then(function(snap) {
    if (snap.exists()) {
      applyData(snap.data());
    }
    if (callback) callback();
  }).catch(function(e) {
    if (callback) callback();
  });
};

// ═══ Real-time listener - تحديث فوري! ═══
// لما أي جهاز يحفظ، كل الأجهزة الثانية بتتحدث فوراً
var firstSnapshot = true;
onSnapshot(REF, function(snap) {
  if (snap.exists()) {
    var data = snap.data();
    applyData(data);
    if (firstSnapshot) {
      firstSnapshot = false;
      console.log("🔄 Firebase: تحميل أولي");
    } else {
      console.log("⚡ Firebase: تحديث فوري من جهاز آخر!");
    }
    refreshUI();
  }
}, function(error) {
  console.error("❌ Listener error:", error);
});

// رفع أولي لو Firebase فاضي
getDoc(REF).then(function(snap) {
  if (!snap.exists()) {
    var raw = localStorage.getItem("appData");
    if (raw) {
      console.log("☁️ رفع أولي للبيانات");
      setDoc(REF, cleanForFirestore(JSON.parse(raw)));
    }
  }
});

console.log("🔥 Firebase v7 - Real-time sync!");
