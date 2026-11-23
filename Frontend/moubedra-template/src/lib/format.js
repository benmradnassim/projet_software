/**
 * Formatage partagé : montants en dinars (TND), dates en français, pluriels.
 * Les montants DRF arrivent en chaînes ("8450.000") : toutes les fonctions acceptent nombre ou chaîne.
 */

const NBSP = ' ';

/** "8450.000" -> 8450 */
export const toNumber = (v) => (v === null || v === undefined || v === '' ? 0 : Number(v));

/** 342680 -> "342 680" (espaces insécables, comme la maquette) */
export function formatNumber(n, decimals = 0) {
  return toNumber(n)
    .toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    .replace(/[   ]/g, NBSP);
}

/** 8450 -> "8 450 TND" */
export const tnd = (n) => `${formatNumber(n)}${NBSP}TND`;

/** 50 -> "50,000 TND" (3 décimales, pour les reçus et récapitulatifs) */
export const tnd3 = (n) => `${formatNumber(n, 3)}${NBSP}TND`;

/** Pourcentage arrondi d'un montant collecté sur un objectif. */
export const percent = (part, total) => (toNumber(total) ? Math.round((toNumber(part) / toNumber(total)) * 100) : 0);

/** plural(48, 'donateur') -> "48 donateurs" ; plural(1, 'article') -> "1 article" */
export function plural(n, singular, pluralForm = `${singular}s`, withNumber = true) {
  const word = Math.abs(n) > 1 ? pluralForm : singular;
  return withNumber ? `${formatNumber(n)}${NBSP}${word}` : word;
}

/* ---------- dates ---------- */
const toDate = (d) => (d instanceof Date ? d : new Date(String(d).length === 10 ? `${d}T12:00:00` : d));

/** "2026-12-06" -> "6 déc. 2026" (options : { year: false } pour masquer l'année) */
export function formatDate(d, { year = true, weekday = false } = {}) {
  return toDate(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    ...(year ? { year: 'numeric' } : {}),
    ...(weekday ? { weekday: 'short' } : {}),
  });
}

/** "2026-12-06T08:30:00" -> "08:30" */
export const formatTime = (d) => toDate(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** Pastille de date des événements : ['SAM.', '06', 'DÉC.'] */
export function dateParts(d) {
  const date = toDate(d);
  const upper = (opts) => date.toLocaleDateString('fr-FR', opts).toUpperCase(); // "sam." -> "SAM."
  return [upper({ weekday: 'short' }), String(date.getDate()).padStart(2, '0'), upper({ month: 'short' })];
}

/** "il y a 20 min", "il y a 3 h", "hier", "lun.", "12 nov." */
export function formatRelative(d, now = new Date()) {
  const date = toDate(d);
  const diff = Math.round((now - date) / 1000);
  if (diff < 60) return 'à l’instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'hier';
  if (diff < 7 * 86400) return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  return formatDate(date, { year: date.getFullYear() !== now.getFullYear() });
}

/** Nombre de jours entre aujourd'hui et une date (0 si passée). */
export function daysLeft(d, now = new Date()) {
  return Math.max(0, Math.ceil((toDate(d) - now) / 86400000));
}

/** "Nour Saada" -> "NS" */
export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/** Téléphone tunisien : "22123456" -> "22 123 456" */
export const formatPhone = (v = '') =>
  v
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{2})(\d{3})?(\d{3})?/, (m, a, b, c) => [a, b, c].filter(Boolean).join(' '));
