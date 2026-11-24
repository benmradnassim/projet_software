/**
 * API publique du module « evenements ».
 * Les autres features importent UNIQUEMENT depuis ce fichier, jamais ses fichiers internes.
 */
export * from './api';
export { default as EventRow, horaire } from './components/EventRow';
