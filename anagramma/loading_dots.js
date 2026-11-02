// The page's loading dots (see index.html), in a file of their own so the
// Content-Security-Policy needs no inline script.
(function () {
  var shown = document.getElementById('loading-shown');
  var rest = document.getElementById('loading-rest');
  var count = 1;
  var timer = setInterval(function () {
    if (!shown || !rest || count >= 10) { clearInterval(timer); return; }
    count++;
    shown.textContent = '.'.repeat(count);
    rest.textContent = '.'.repeat(10 - count);
  }, 500);
})();
// After 3 seconds a quiet line fades in under the dots (never on a fast load);
// with reduced motion it appears without the fade. Its words are
// PlayText.loadingSlow in lib/strings.dart.
setTimeout(function () {
  var note = document.getElementById('loading-note');
  if (!note) return;
  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  note.style.transition = reduced ? 'none' : 'opacity 400ms ease-out';
  note.style.opacity = '1';
}, 3000);
// If the game is still not ready after a minute (a very slow connection), the
// dots stay and the line changes to say so, rather than the page going blank.
// The words are PlayText.loadingStuck in lib/strings.dart. The game takes the
// whole thing down itself (lib/services/page_loading.dart) once its own
// screen is ready.
setTimeout(function () {
  var note = document.getElementById('loading-note');
  if (!note) return;
  note.textContent = 'Still loading \u2014 this is taking longer than usual.';
  note.style.transition = 'none';
  note.style.opacity = '1';
}, 60000);
