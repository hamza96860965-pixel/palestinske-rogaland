// ============================================
// 🔥 Firebase Integration for palestinske-rogaland
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
const COLLECTION = "appData";
const DOC_ID = "main";

function cleanForFirestore(obj) {
  var clean = JSON.parse(JSON.stringify(obj));
  // حذف الحقول الكبيرة (أكبر من 900KB) - Firestore حد 1MB
  for (var key in clean) {
    if (typeof clean[key] === 'string' && clean[key].length > 900000) {
      console.log("⚠️ تم تخطي حقل كبير:", key, "(" + Math.round(clean[key].length/1024) + "KB)");
      delete clean[key];
    }
  }
  return clean;
}

// ═══ استبدال دالة save ═══
const _origSave = window.save;
window.save = function() {
  if (_origSave) {
    try { _origSave(); } catch(e) {}
  }
  try {
    var data = JSON.parse(localStorage.getItem("appData"));
    if (data) {
      var ref = doc(db, COLLECTION, DOC_ID);
      setDoc(ref, cleanForFirestore(data), { merge: true })
        .then(function() { console.log("✅ تم الحفظ في Firebase"); })
        .catch(function(e) { console.error("❌ خطأ Firebase save:", e); });
    }
  } catch(e) {
    console.error("❌ خطأ في الحفظ:", e);
  }
};

// ═══ استبدال دالة loadFromCloud ═══
const _origLoad = window.loadFromCloud;
window.loadFromCloud = function(callback) {
  var ref = doc(db, COLLECTION, DOC_ID);
  getDoc(ref).then(function(snap) {
    if (snap.exists()) {
      var cloudData = snap.data();
      console.log("✅ تم تحميل البيانات من Firebase");
      var local = localStorage.getItem("appData");
      var localData = local ? JSON.parse(local) : {};
      Object.assign(localData, cloudData);
      localStorage.setItem("appData", JSON.stringify(localData));
      if (window.appData !== undefined) {
        Object.assign(window.appData, localData);
        if (window.appData.adminPass) window.adminPass = window.appData.adminPass;
      }
      if (callback) callback();
    } else {
      console.log("📄 لا توجد بيانات في Firebase - رفع المحلية");
      var localRaw = localStorage.getItem("appData");
      if (localRaw) {
        setDoc(ref, cleanForFirestore(JSON.parse(localRaw)))
          .then(function() { console.log("☁️ تم رفع البيانات المحلية إلى Firebase"); })
          .catch(function(e) { console.error("❌ خطأ رفع:", e); });
      }
      if (callback) callback();
    }
  }).catch(function(e) {
    console.error("❌ خطأ في التحميل:", e);
    if (_origLoad) { _origLoad(callback); }
    else if (callback) { callback(); }
  });
};

console.log("🔥 Firebase patch v3 loaded!");
