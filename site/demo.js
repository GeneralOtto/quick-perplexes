(() => {
  const QUERY = 'what is the speed of light';
  const CHAR_DELAY = 50;   // ms per character
  const POST_TYPE_PAUSE = 800;
  const FADE_DURATION = 300;
  const IDLE_PAUSE = 1200;

  const wrapper = document.getElementById('demo-wrapper');
  const textEl = document.getElementById('demo-text');

  if (!wrapper || !textEl) return; // guard: elements must exist

  function fadeIn() {
    wrapper.style.opacity = '1';
  }

  function fadeOut() {
    wrapper.style.opacity = '0';
  }

  function typeQuery(callback) {
    let i = 0;
    const interval = setInterval(() => {
      textEl.textContent += QUERY[i];
      i++;
      if (i >= QUERY.length) {
        clearInterval(interval);
        callback();
      }
    }, CHAR_DELAY);
  }

  function clearQuery() {
    textEl.textContent = '';
  }

  function runLoop() {
    // Step 1: fade in
    fadeIn();

    // Step 2: type after fade settles
    setTimeout(() => {
      typeQuery(() => {

        // Step 3: pause after typing
        setTimeout(() => {

          // Step 4: fade out
          fadeOut();

          // Step 5: clear text after fade completes
          setTimeout(() => {
            clearQuery();

            // Step 6: idle pause, then loop
            setTimeout(runLoop, IDLE_PAUSE);
          }, FADE_DURATION);

        }, POST_TYPE_PAUSE);
      });
    }, FADE_DURATION);
  }

  // Start from faded-out state
  wrapper.style.opacity = '0';
  setTimeout(runLoop, 800); // initial delay before first loop
})();
