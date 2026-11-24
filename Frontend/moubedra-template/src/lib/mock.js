/**
 * Outils pour les données fictives (utilisés par les `features/<module>/api.js`).
 * À supprimer d'une feature dès que toutes ses fonctions appellent la vraie API.
 */

/** Renvoie une copie des données après un court délai, comme une vraie requête. */
export function mockResponse(data, delay = 250) {
  const copy = data === undefined ? undefined : structuredClone(data);
  return new Promise((resolve) => setTimeout(() => resolve(copy), delay));
}

/** Simule une erreur d'API (pour tester les états d'erreur). */
export function mockError(message, status = 400, delay = 250) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(Object.assign(new Error(message), { name: 'ApiError', status, fields: {} })), delay),
  );
}

/** Date ISO relative à maintenant : ago({ min: 20 }), ago({ h: 3 }), ago({ d: 2 }). */
export function ago({ min = 0, h = 0, d = 0 } = {}) {
  return new Date(Date.now() - ((d * 24 + h) * 60 + min) * 60000).toISOString();
}

/** Prochain identifiant pour les créations simulées. */
let seq = 1000;
export const nextId = () => ++seq;
