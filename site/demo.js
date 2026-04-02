/**
 * Cycles through sample queries in the hero demo box.
 */
(() => {
  const QUERIES = [
    'what is the speed of light',
    'best way to learn Rust',
    'explain quantum entanglement',
    'why is the sky blue',
    'summarise this article for me',
    'latest news on fusion energy',
  ];

  const CHAR_DELAY       = 52;
  const POST_TYPE_PAUSE  = 900;
  const FADE_DURATION    = 300;
  const IDLE_PAUSE       = 900;

  const wrapper = document.getElementById('demo-wrapper');
  const textEl  = document.getElementById('demo-text');
  if (!wrapper || !textEl) return;

  let idx = 0;

  function typeQuery(text, done) {
    let i = 0;
    const t = setInterval(() => {
      textEl.textContent += text[i++];
      if (i >= text.length) { clearInterval(t); done(); }
    }, CHAR_DELAY);
  }

  function loop() {
    const query = QUERIES[idx++ % QUERIES.length];
    wrapper.style.opacity = '1';

    setTimeout(() => {
      typeQuery(query, () => {
        setTimeout(() => {
          wrapper.style.opacity = '0';
          setTimeout(() => {
            textEl.textContent = '';
            setTimeout(loop, IDLE_PAUSE);
          }, FADE_DURATION);
        }, POST_TYPE_PAUSE);
      });
    }, FADE_DURATION);
  }

  wrapper.style.opacity = '0';
  setTimeout(loop, 900);
})();
