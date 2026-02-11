// 🔥 Firebase Preload - يحمّل البيانات قبل الصفحة
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

window._fbDB = getFirestore(app);
window._fbREF = doc(window._fbDB, "appData", "main");

function clean(obj) {
  var c = JSON.parse(JSON.stringify(obj));
  for (var k in c) if (typeof c[k] === 'string' && c[k].length > 900000) delete c[k];
  return c;
}
window._fbClean = clean;

try {
  var snap = await getDoc(window._fbREF);
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
    if (raw) await setDoc(window._fbREF, clean(JSON.parse(raw)));
    console.log("☁️ رفع أولي");
  }
} catch(e) {
  console.log("⚠️ offline");
}
