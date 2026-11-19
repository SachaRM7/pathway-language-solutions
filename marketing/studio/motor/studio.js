// Moteur du studio Pathway : chaque pièce est une fonction du temps.
// Aucune transition CSS, aucun minuteur, aucun hasard non semé :
// la même valeur de t donne toujours la même image.
(function () {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;

  // Ressort amorti de 0 à 1, calculé directement pour l'instant t (en secondes).
  // z = taux d'amortissement : 1 = sans rebond (texte), 0.8 = interface, 0.5 = joueur.
  function spring(t, z = 1, w = 14) {
    if (t <= 0) return 0;
    if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  }
  const easeOut = (p) => 1 - Math.pow(1 - clamp(p), 4);
  const easeInOut = (p) => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };

  // Entrée d'un texte ou d'un bloc : monte de dy px sur un ressort, opacité en 4 images.
  function enter(el, t, t0, { dy = 70, z = 1, w = 14, scale = 1 } = {}) {
    const dt = t - t0;
    if (dt <= 0) { el.style.opacity = 0; return; }
    const p = spring(dt, z, w);
    el.style.opacity = clamp(dt / 0.13);
    el.style.transform = `translateY(${(1 - p) * dy}px) scale(${lerp(scale, 1, p)})`;
  }
  // Apparition « pop » : échelle sur un ressort avec léger dépassement.
  function pop(el, t, t0, { z = 0.6, w = 16, from = 0.6 } = {}) {
    const dt = t - t0;
    if (dt <= 0) { el.style.opacity = 0; return; }
    el.style.opacity = clamp(dt / 0.1);
    el.style.transform = `scale(${lerp(from, 1, spring(dt, z, w))})`;
  }
  const BEAT = 0.5; // 120 BPM
  window.Studio = { clamp, lerp, spring, easeOut, easeInOut, enter, pop, BEAT };
})();
