// Registers the offline service worker (anagramma_sw.js) once the page has
// loaded, and lets the game know when a newer build is fully downloaded.
//
// Nothing here is waited for: the game starts first, and any failure is
// swallowed. The game reads `window.anagrammaUpdate`:
//   ready   true once a complete newer build is waiting
//   apply() asks it to take over (the page reloads when it does)
//
// BUILD_ID is stamped at deploy time (tools/stamp_offline_build.py). A local
// build keeps the token and registers nothing.
(function () {
  var buildId = "20261111.a7bbf6b";
  var state = (window.anagrammaUpdate = { ready: false, apply: function () {} });
  if (buildId === "__BUILD_" + "ID__" || !("serviceWorker" in navigator)) return;

  var reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    // Only after the player approved the restart (apply below).
    if (reloading || !state.applying) return;
    reloading = true;
    window.location.reload();
  });

  function watch(registration) {
    function waiting() {
      var worker = registration.waiting;
      // A waiting worker is a newer, fully downloaded build (its install only
      // succeeds once every file is checked), and only counts when a worker is
      // already in control (otherwise it is just the first install).
      if (!worker || !navigator.serviceWorker.controller) return;
      state.ready = true;
      state.apply = function () {
        state.applying = true;
        worker.postMessage("SKIP_WAITING");
      };
    }
    waiting();
    registration.addEventListener("updatefound", function () {
      var installing = registration.installing;
      if (!installing) return;
      installing.addEventListener("statechange", function () {
        if (installing.state === "installed") waiting();
      });
    });
  }

  window.addEventListener("load", function () {
    // After load, away from the first screen: setTimeout lets the game's own
    // start-up finish first.
    setTimeout(function () {
      navigator.serviceWorker
        .register("anagramma_sw.js")
        .then(function (registration) {
          watch(registration);
          return registration.update();
        })
        .catch(function () {
          /* offline caching is an extra; the game plays without it */
        });
    }, 2000);
  });
})();
