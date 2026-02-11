// 🔥 Firebase Save Override - يستبدل save بعد الكود الأصلي
(function() {
  var _orig = window.save;
  window.save = function() {
    if (_orig) try { _orig(); } catch(e) {}
    try {
      var raw = localStorage.getItem("appData");
      if (raw && window._fbREF && window._fbClean) {
        var setDoc = window._fbSetDoc;
        if (!setDoc) {
          import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js").then(function(mod) {
            window._fbSetDoc = mod.setDoc;
            mod.setDoc(window._fbREF, window._fbClean(JSON.parse(raw)))
              .then(function() { console.log("✅ محفوظ"); })
              .catch(function(e) { console.error("❌", e); });
          });
        } else {
          setDoc(window._fbREF, window._fbClean(JSON.parse(raw)))
            .then(function() { console.log("✅ محفوظ"); })
            .catch(function(e) { console.error("❌", e); });
        }
      }
    } catch(e) {}
  };
  console.log("🔥 Firebase save override OK");
})();
