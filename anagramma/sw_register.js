// Registers the offline service worker (anagramma_sw.js) once the page has
// loaded, and lets the game know when a newer build is fully downloaded.
//
// Nothing here is waited for: the game starts first, and any failure is
// swallowed. The game reads `window.anagrammaUpdate`:
//   ready   true once a complete newer build is waiting
//   apply() asks it to take over (the page reloads when it does)
//   supported, checking, failed, latest (the newest published build id),
//   check() looks now. The page also looks when it is shown again after ten
//   minutes away, and hourly while it stays open.
//
// BUILD_ID is stamped at deploy time (tools/stamp_offline_build.py). A local
// build keeps the token and registers nothing.
(function () {
  var buildId = "20261111.3769313";
  var state = (window.anagrammaUpdate = {
    ready: false,
    apply: function () {},
    supported: false,
    checking: false,
    failed: false,
    latest: null,
    check: function () {},
  });
  if (buildId === "__BUILD_" + "ID__" || !("serviceWorker" in navigator)) return;
  state.supported = true;
  var registration = null;
  var lastCheck = 0;

  // Asks the worker to look for a new build, and reads the newest published
  // build id from the manifest (always fetched from the network). A failure
  // is only noted: the game never depends on this.
  state.check = function () {
    if (state.checking) return;
    state.checking = true;
    state.failed = false;
    lastCheck = Date.now();
    try {
      if (registration) registration.update().catch(function () {});
    } catch (e) {}
    fetch("offline-manifest.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (manifest) {
        if (manifest && typeof manifest.buildId === "string") {
          state.latest = manifest.buildId;
        }
      })
      .catch(function () {
        state.failed = true;
      })
      .then(function () {
        state.checking = false;
      });
  };

  document.addEventListener("visibilitychange", function () {
    if (
      document.visibilityState === "visible" &&
      registration &&
      Date.now() - lastCheck > 10 * 60 * 1000
    ) {
      state.check();
    }
  });
  setInterval(function () {
    if (registration) state.check();
  }, 60 * 60 * 1000);

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
        .then(function (reg) {
          registration = reg;
          watch(reg);
          state.check();
        })
        .catch(function () {
          /* offline caching is an extra; the game plays without it */
        });
    }, 2000);
  });
})();
