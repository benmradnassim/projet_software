/**
 * API publique du module « campagnes ».
 * Les autres features importent UNIQUEMENT depuis ce fichier, jamais ses fichiers internes.
 */
export * from './api';
export { default as CampaignCard, pctCampagne, isTerminee } from './components/CampaignCard';
export { default as NeedsList, articlesManquants } from './components/NeedsList';
