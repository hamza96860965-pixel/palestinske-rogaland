// ============================================
// 🔥 Firebase v8 - Real-time sync
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
var saving = false;

function cleanForFirestore(obj) {
  var clean = JSON.parse(JSON.stringify(obj));
  for (var key in clean) {
    if (typeof clean[key] === 'string' && clean[key].length > 900000) {
      delete clean[key];
    }
  }
  return clean;
}

// ═══ save - يحفظ محلي + Firebase ═══
var _origSave = window.save;
window.save = function() {
  saving = true;
  if (_origSave) { try { _origSave(); } catch(e) {} }
  try {
    var raw = localStorage.getItem("appData");
    if (raw) {
      setDoc(REF, cleanForFirestore(JSON.parse(raw)))
        .then(function() {
          console.log("✅ Firebase: محفوظ");
          setTimeout(function() { saving = false; }, 2000);
        })
        .catch(function(e) {
          console.error("❌ Firebase:", e);
          saving = false;
        });
    }
  } catch(e) { saving = false; }
};

// ═══ Real-time: لما تتغير البيانات على Firebase ═══
var isFirstLoad = true;
onSnapshot(REF, function(snap) {
  if (!snap.exists()) {
    // أول مرة - رفع البيانات المحلية
    if (isFirstLoad) {
      isFirstLoad = false;
      var raw = localStorage.getItem("appData");
      if (raw) {
        setDoc(REF, cleanForFirestore(JSON.parse(raw)))
          .then(function() { console.log("☁️ رفع أولي"); });
      }
    }
    return;
  }

  var cloudData = snap.data();

  if (isFirstLoad) {
    // أول تحميل - حط بيانات Firebase بـ localStorage وأعد تحميل الصفحة
    isFirstLoad = false;
    var localRaw = localStorage.getItem("appData");
    var localData = localRaw ? JSON.parse(localRaw) : {};
    // احتفظ بالlogo المحلي
    var logo = localData.logo;
    Object.assign(localData, cloudData);
    if (logo && !localData.logo) localData.logo = logo;
    localStorage.setItem("appData", JSON.stringify(localData));
    console.log("✅ Firebase: تحميل أولي - إعادة تحميل");
    location.reload();
    return;
  }

  // تحديث من جهاز آخر - بس لو مش أنا اللي حفظت
  if (saving) return;

  var localRaw = localStorage.getItem("appData");
  var localData = localRaw ? JSON.parse(localRaw) : {};
  var logo = localData.logo;
  Object.assign(localData, cloudData);
  if (logo && !localData.logo) localData.logo = logo;
  localStorage.setItem("appData", JSON.stringify(localData));
  console.log("⚡ Firebase: تحديث من جهاز آخر - إعادة تحميل");
  location.reload();
});

console.log("🔥 Firebase v8 - Real-time!");
