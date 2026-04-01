(() => {
  let host = null;
  let shadowRoot = null;
  let isOpen = false;
  let isCreating = false;

  function buildSearchUrl(query) {
    return 'https://www.perplexity.ai/search?q=' + encodeURIComponent(query.trim());
  }

  async function createOverlay() {
    host = document.createElement('div');
    shadowRoot = host.attachShadow({ mode: 'closed' });

    const styleText = await fetch(chrome.runtime.getURL('overlay.css')).then(r => r.text());
    const style = document.createElement('style');
    style.textContent = styleText;

    const input = document.createElement('input');
    input.id = 'input';
    input.type = 'text';
    input.placeholder = 'Search Perplexity…';
    input.autocomplete = 'off';
    input.spellcheck = false;

    const footer = document.createElement('div');
    footer.id = 'footer';
    const hint1 = document.createElement('span');
    hint1.textContent = 'Opens in Perplexity';
    const hint2 = document.createElement('span');
    hint2.textContent = 'Esc to close';
    footer.append(hint1, hint2);

    const card = document.createElement('div');
    card.id = 'card';
    card.append(input, footer);

    const backdrop = document.createElement('div');
    backdrop.id = 'backdrop';
    backdrop.append(card);

    shadowRoot.appendChild(style);
    shadowRoot.appendChild(backdrop);
    document.body.appendChild(host);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = input.value.trim();
        if (query) {
          window.open(buildSearchUrl(query), '_blank');
          closeOverlay();
          input.value = '';
        }
      }
    });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeOverlay();
      }
    });

    shadowRoot.addEventListener('keydown', (e) => {
      e.stopPropagation(); // prevent keystrokes from reaching host-page shortcut handlers
      if (e.key === 'Tab') {
        e.preventDefault();
        input.focus();
      }
    });
  }

  function openOverlay(prefill = '') {
    if (isCreating) return;
    isOpen = true;
    if (!host) {
      isCreating = true;
      createOverlay().then(() => {
        isCreating = false;
        const input = shadowRoot.getElementById('input');
        if (prefill) {
          input.value = prefill;
          input.focus();
          input.select();
        }
        input.focus();
      });
    } else {
      host.style.display = '';
      const input = shadowRoot.getElementById('input');
      if (prefill) {
        input.value = prefill;
        input.focus();
        input.select();
      }
      input.focus();
    }
  }

  function closeOverlay() {
    if (isCreating) return;
    if (host) {
      host.style.display = 'none';
      shadowRoot.getElementById('input').value = '';
    }
    isOpen = false;
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.code === 'Backquote') {
      e.preventDefault();
      e.stopPropagation();
      if (isOpen) {
        closeOverlay();
      } else {
        const sel = window.getSelection();
        const prefill = sel ? sel.toString().trim() : '';
        openOverlay(prefill);
      }
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      e.stopPropagation();
      closeOverlay();
    }
  }, true);
})();
