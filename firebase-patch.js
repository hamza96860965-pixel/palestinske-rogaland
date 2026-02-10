// ============================================
// 🔥 Firebase Integration v6 - palestinske-rogaland
// Smart merge - يدمج البيانات بدل ما يستبدلها
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

// ═══ دمج ذكي للمصفوفات (arrays) ═══
// بيدمج العناصر حسب id بدل ما يستبدل
function mergeArraysById(localArr, cloudArr) {
  if (!Array.isArray(localArr)) return cloudArr || [];
  if (!Array.isArray(cloudArr)) return localArr || [];
  var map = {};
  // حط كل عناصر السحابة أولاً
  cloudArr.forEach(function(item) {
    var key = item.id || JSON.stringify(item);
    map[key] = item;
  });
  // أضف العناصر المحلية اللي مش موجودة
  localArr.forEach(function(item) {
    var key = item.id || JSON.stringify(item);
    if (!map[key]) map[key] = item;
  });
  return Object.values(map);
}

// الحقول اللي فيها مصفوفات لازم تُدمج
var ARRAY_FIELDS = ['news', 'members', 'approved', 'pending', 'votes', 'messages', 'tx', 'gallery', 'events'];

// دمج ذكي لكل البيانات
function smartMerge(localData, cloudData) {
  var merged = JSON.parse(JSON.stringify(localData));
  for (var key in cloudData) {
    if (ARRAY_FIELDS.indexOf(key) > -1) {
      // دمج المصفوفات حسب id
      merged[key] = mergeArraysById(localData[key], cloudData[key]);
    } else if (typeof cloudData[key] === 'object' && cloudData[key] !== null && !Array.isArray(cloudData[key])) {
      // دمج الكائنات
      merged[key] = Object.assign({}, localData[key] || {}, cloudData[key]);
    } else {
      // القيم العادية - السحابة لها الأولوية
      merged[key] = cloudData[key];
    }
  }
  return merged;
}

// ═══ save - محلي + Firebase مع دمج ═══
var _origSave = window.save;
window.save = function() {
  if (_origSave) { try { _origSave(); } catch(e) {} }
  try {
    var localData = JSON.parse(localStorage.getItem("appData"));
    if (!localData) return;
    // أولاً نجيب بيانات السحابة وندمج معها
    getDoc(REF).then(function(snap) {
      var dataToSave;
      if (snap.exists()) {
        dataToSave = smartMerge(localData, snap.data());
        // حدّث المحلي كمان بالنسخة المدمجة
        localStorage.setItem("appData", JSON.stringify(dataToSave));
        if (window.appData) Object.assign(window.appData, dataToSave);
      } else {
        dataToSave = localData;
      }
      return setDoc(REF, cleanForFirestore(dataToSave));
    }).then(function() {
      console.log("✅ Firebase: تم الحفظ مع الدمج");
    }).catch(function(e) { console.error("❌ Firebase save:", e); });
  } catch(e) { console.error("❌ Save error:", e); }
};

// ═══ loadFromCloud ═══
window.loadFromCloud = function(callback) {
  getDoc(REF).then(function(snap) {
    if (snap.exists()) {
      var cloudData = snap.data();
      var localRaw = localStorage.getItem("appData");
      var localData = localRaw ? JSON.parse(localRaw) : {};
      var merged = smartMerge(localData, cloudData);
      localStorage.setItem("appData", JSON.stringify(merged));
      if (window.appData) {
        Object.assign(window.appData, merged);
        if (window.appData.adminPass) window.adminPass = window.appData.adminPass;
      }
    }
    if (callback) callback();
  }).catch(function(e) {
    console.error("❌ Firebase load:", e);
    if (callback) callback();
  });
};

// ═══ مزامنة تلقائية عند فتح الصفحة ═══
function autoSync() {
  var localRaw = localStorage.getItem("appData");
  var localData = localRaw ? JSON.parse(localRaw) : {};
  
  getDoc(REF).then(function(snap) {
    var merged;
    if (snap.exists()) {
      merged = smartMerge(localData, snap.data());
    } else {
      merged = localData;
    }
    // حفظ المدمج محلياً
    localStorage.setItem("appData", JSON.stringify(merged));
    if (window.appData) {
      Object.assign(window.appData, merged);
      if (window.appData.adminPass) window.adminPass = window.appData.adminPass;
    }
    // رفع المدمج للسحابة
    setDoc(REF, cleanForFirestore(merged)).catch(function(e) {});
    // إعادة عرض الصفحة
    try { if (typeof renderHomePage === 'function') renderHomePage(); } catch(e) {}
    try { if (typeof renderHomeNews === 'function') renderHomeNews(); } catch(e) {}
    try { if (typeof renderHomeEvents === 'function') renderHomeEvents(); } catch(e) {}
    console.log("✅ Firebase: تم المزامنة والدمج");
  }).catch(function(e) { console.error("❌ Firebase sync:", e); });
}

if (document.readyState === 'complete') {
  setTimeout(autoSync, 1500);
} else {
  window.addEventListener('load', function() {
    setTimeout(autoSync, 1500);
  });
}

console.log("🔥 Firebase patch v6 loaded!");
