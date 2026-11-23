import { prefersReducedMotion } from '../hooks/useReducedMotion';

const COLORS = ['#d9472b', '#4f7f42', '#1f3a6b', '#f3b49f', '#c98a3a'];

/**
 * Explosion de confettis depuis le centre d'un élément (succès d'une action).
 *   <Button ref={btnRef} onClick={() => { …; confetti(btnRef.current); }}>
 *   confetti(event.currentTarget)
 * Désactivé si l'utilisateur préfère réduire les animations.
 */
export function confetti(el, count = 22) {
  if (!el || prefersReducedMotion()) return;
  const r = el.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'burst';
    s.setAttribute('aria-hidden', 'true');
    const a = Math.random() * Math.PI * 2;
    const d = 50 + Math.random() * 70;
    const size = 5 + Math.random() * 6;
    s.style.cssText = `position:fixed;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;background:${COLORS[i % 5]};--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;width:${size}px;height:${size}px;border-radius:${i % 2 ? '50%' : '2px'};animation-duration:${0.7 + Math.random() * 0.5}s`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1300);
  }
}

/** Petite gerbe circulaire dans un élément (bouton « Merci »). */
export function miniBurst(el) {
  if (!el || prefersReducedMotion()) return;
  ['#d9472b', '#f3b49f', '#4f7f42', '#c98a3a', '#d9472b', '#1f3a6b'].forEach((c, i) => {
    const s = document.createElement('span');
    s.className = 'burst';
    s.setAttribute('aria-hidden', 'true');
    const a = (i / 6) * Math.PI * 2;
    s.style.cssText = `background:${c};--x:${Math.cos(a) * 34}px;--y:${Math.sin(a) * 24}px`;
    el.appendChild(s);
    setTimeout(() => s.remove(), 800);
  });
}
