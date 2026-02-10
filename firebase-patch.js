// ============================================
// 🔥 Firebase Integration for palestinske-rogaland
// ============================================
// هذا الملف يستبدل JSONBin بـ Firebase Firestore
// أضفه في index.html قبل </body>:
// <script type="module" src="firebase-patch.js"></script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔑 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB2vd10mZBfvZ9_NxpjzT07ih0m5cOTOgo",
  authDomain: "palestinske-rogaland.firebaseapp.com",
  projectId: "palestinske-rogaland",
  storageBucket: "palestinske-rogaland.firebasestorage.app",
  messagingSenderId: "228379992371",
  appId: "1:228379992371:web:56577dc6e553ef39d91e46"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTION = "appData";
const DOC_ID = "main";

// تنظيف البيانات (Firestore لا يقبل undefined)
function cleanForFirestore(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ═══ استبدال دالة save ═══
const originalSave = window.save || null;
window.save = async function() {
  try {
    // حفظ adminPass
    if (typeof appData !== 'undefined') {
      appData.adminPass = typeof adminPass !== 'undefined' ? adminPass : appData.adminPass;
    }
    
    // حفظ محلي أولاً (سريع)
    localStorage.setItem("appData", JSON.stringify(appData));
    
    // حفظ في Firebase
    const ref = doc(db, COLLECTION, DOC_ID);
    await setDoc(ref, cleanForFirestore(appData), { merge: true });
    console.log("✅ تم الحفظ في Firebase");
  } catch (err) {
    console.error("❌ خطأ في الحفظ:", err);
    // البيانات محفوظة محلياً على الأقل
  }
};

// ═══ استبدال دالة loadFromCloud ═══
window.loadFromCloud = async function(callback) {
  try {
    const ref = doc(db, COLLECTION, DOC_ID);
    const snap = await getDoc(ref);
    
    if (snap.exists()) {
      const cloudData = snap.data();
      console.log("✅ تم تحميل البيانات من Firebase");
      
      // تطبيق البيانات
      if (typeof appData !== 'undefined') {
        Object.assign(appData, cloudData);
        if (appData.adminPass) {
          window.adminPass = appData.adminPass;
        }
        localStorage.setItem("appData", JSON.stringify(appData));
      }
      
      if (callback) callback();
    } else {
      console.log("📄 لا توجد بيانات في Firebase - رفع المحلية");
      
      // رفع البيانات المحلية لـ Firebase
      const localRaw = localStorage.getItem("appData");
      if (localRaw) {
        const localData = JSON.parse(localRaw);
        const ref2 = doc(db, COLLECTION, DOC_ID);
        await setDoc(ref2, cleanForFirestore(localData));
        console.log("☁️ تم رفع البيانات المحلية إلى Firebase");
      }
      
      if (callback) callback();
    }
  } catch (err) {
    console.error("❌ خطأ في التحميل:", err);
    if (callback) callback();
  }
};

console.log("🔥 Firebase patch loaded successfully!");
