/**
 * Generates an animated star field into #stars.
 * Stars twinkle at randomised sizes, opacities, speeds, and colours.
 */
(() => {
  const TOTAL   = 130;
  const COLORS  = [
    { hex: '#ffffff', weight: 55 },   // white
    { hex: '#c4b5fd', weight: 28 },   // lavender
    { hex: '#a5f3fc', weight: 17 },   // icy blue
  ];

  function pickColor() {
    const roll = Math.random() * 100;
    let acc = 0;
    for (const c of COLORS) {
      acc += c.weight;
      if (roll < acc) return c.hex;
    }
    return '#ffffff';
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function build() {
    const container = document.getElementById('stars');
    if (!container) return;

    const frag = document.createDocumentFragment();

    for (let i = 0; i < TOTAL; i++) {
      const el     = document.createElement('div');
      el.className = 'star';

      const size      = rand(0.6, 2.6);       // px
      const x         = rand(0, 100);          // %
      const y         = rand(0, 100);          // %
      const duration  = rand(2.5, 8);          // s
      const delay     = -rand(0, 10);          // negative = start mid-cycle
      const minOp     = rand(0.05, 0.2);
      const maxOp     = rand(0.45, 1.0);
      const peakScale = rand(1.3, 2.8);
      const color     = pickColor();

      el.style.cssText = [
        `width:${size}px`,
        `height:${size}px`,
        `left:${x}%`,
        `top:${y}%`,
        `background:${color}`,
        `--min-op:${minOp.toFixed(2)}`,
        `--max-op:${maxOp.toFixed(2)}`,
        `--peak-scale:${peakScale.toFixed(2)}`,
        `--star-color:${color}`,
        `animation-duration:${duration.toFixed(2)}s`,
        `animation-delay:${delay.toFixed(2)}s`,
      ].join(';');

      frag.appendChild(el);
    }

    container.appendChild(frag);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
