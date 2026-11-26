import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../../../app/AuthContext';
import { Avatar, Button, useToast } from '../../../design/components';
import { formatRelative } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { ajouterCommentaire, listCommentaires, modifierCommentaire, supprimerCommentaire } from '../api';

const MAX = 1000;
const MSG_EN_ATTENTE = 'Votre commentaire sera visible après vérification par la modération.';
const errMessage = (err) => err?.fields?.contenu || err?.message || 'Une erreur est survenue.';
const estModifie = (c) => new Date(c.date_modification) - new Date(c.date_creation) > 2000;

/**
 * Commentaires d'une publication : liste, ajout (US 7.5), modification (US 7.7) et suppression (US 7.8)
 * de ses commentaires ; un admin peut supprimer n'importe quel commentaire (US 7.11).
 * `onCountChange(delta)` met à jour le compteur affiché dans le pied de carte.
 */
export default function Comments({ publicationId, onCountChange }) {
  const { user, role, isAuthenticated } = useAuth();
  const toast = useToast();
  const { data: items, loading, error, setData, reload } = useApi(() => listCommentaires(publicationId), [publicationId], []);
  const [texte, setTexte] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [edition, setEdition] = useState(null); // { id, texte, erreur, envoi }
  const fieldId = useId();

  const envoyer = async (e) => {
    e.preventDefault();
    if (!texte.trim()) {
      setErreur('Écrivez un commentaire.');
      return;
    }
    setEnvoi(true);
    setErreur('');
    try {
      const c = await ajouterCommentaire(publicationId, texte, user);
      setData((list) => [...list, c]);
      setTexte('');
      if (c.statut === 'en_attente') toast(MSG_EN_ATTENTE);
      else onCountChange?.(1);
    } catch (err) {
      setErreur(errMessage(err));
    } finally {
      setEnvoi(false);
    }
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    if (!edition.texte.trim()) {
      setEdition((s) => ({ ...s, erreur: 'Le commentaire ne peut pas être vide.' }));
      return;
    }
    setEdition((s) => ({ ...s, envoi: true, erreur: '' }));
    try {
      const avant = items.find((c) => c.id === edition.id);
      const c = await modifierCommentaire(edition.id, edition.texte.trim());
      setData((list) => list.map((x) => (x.id === c.id ? c : x)));
      setEdition(null);
      if (c.statut === 'en_attente') {
        toast(MSG_EN_ATTENTE);
        if (avant?.statut === 'publie') onCountChange?.(-1);
      } else {
        toast('Commentaire modifié');
      }
    } catch (err) {
      setEdition((s) => ({ ...s, envoi: false, erreur: errMessage(err) }));
    }
  };

  const supprimer = async (c) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return;
    try {
      await supprimerCommentaire(c.id);
      setData((list) => list.filter((x) => x.id !== c.id));
      if (c.statut === 'publie') onCountChange?.(-1);
      toast('Commentaire supprimé');
    } catch (err) {
      toast(errMessage(err));
    }
  };

  return (
    <section className="cmts" aria-label="Commentaires">
      {loading ? (
        <p className="muted cmt-info">Chargement des commentaires…</p>
      ) : error ? (
        <p className="cmt-info">
          {errMessage(error)}{' '}
          <button type="button" className="cmt-link" onClick={reload}>
            Réessayer
          </button>
        </p>
      ) : items.length === 0 ? (
        <p className="muted cmt-info">Aucun commentaire pour le moment.</p>
      ) : (
        <ul className="cmt-list">
          {items.map((c) => {
            const mien = user && c.auteur === user.id;
            const enEdition = edition?.id === c.id;
            return (
              <li key={c.id} className="cmt">
                <Avatar name={c.auteur_nom} size={36} />
                <div className="cmt-body">
                  <div className="cmt-head">
                    <b>{c.auteur_nom}</b>
                    <small className="muted">
                      {formatRelative(c.date_creation)}
                      {estModifie(c) && ' · modifié'}
                      {c.statut === 'en_attente' && ' · en attente de vérification'}
                    </small>
                  </div>
                  {enEdition ? (
                    <form onSubmit={enregistrer} onKeyDown={(e) => e.key === 'Escape' && setEdition(null)}>
                      <label htmlFor={`${fieldId}-edit`} className="sr-only">
                        Modifier votre commentaire
                      </label>
                      <textarea
                        id={`${fieldId}-edit`}
                        className={`inp3${edition.erreur ? ' bad' : ''}`}
                        value={edition.texte}
                        maxLength={MAX}
                        autoFocus
                        aria-invalid={!!edition.erreur || undefined}
                        aria-describedby={edition.erreur ? `${fieldId}-edit-err` : undefined}
                        onChange={(e) => setEdition((s) => ({ ...s, texte: e.target.value }))}
                      />
                      {edition.erreur && (
                        <small className="field-err" id={`${fieldId}-edit-err`} role="alert">
                          {edition.erreur}
                        </small>
                      )}
                      <div className="cmt-actions">
                        <Button type="submit" variant="navy" size="sm" loading={edition.envoi} loadingText="Enregistrement…">
                          Enregistrer
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEdition(null)}>
                          Annuler
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <p className="cmt-txt">{c.contenu}</p>
                  )}
                  {!enEdition && (mien || role === 'admin') && (
                    <div className="cmt-actions">
                      {mien && (
                        <button type="button" className="cmt-link" onClick={() => setEdition({ id: c.id, texte: c.contenu, erreur: '' })}>
                          <Pencil size={14} aria-hidden="true" /> Modifier
                        </button>
                      )}
                      <button type="button" className="cmt-link danger" onClick={() => supprimer(c)}>
                        <Trash2 size={14} aria-hidden="true" /> Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isAuthenticated ? (
        <form className="cmt-form" onSubmit={envoyer}>
          <label htmlFor={fieldId} className="sr-only">
            Votre commentaire
          </label>
          <textarea
            id={fieldId}
            className={`inp3${erreur ? ' bad' : ''}`}
            placeholder="Écrire un commentaire…"
            value={texte}
            maxLength={MAX}
            aria-invalid={!!erreur || undefined}
            aria-describedby={erreur ? `${fieldId}-err` : undefined}
            onChange={(e) => {
              setTexte(e.target.value);
              if (erreur) setErreur('');
            }}
          />
          <Button type="submit" variant="navy" size="sm" icon={Send} loading={envoi} loadingText="Envoi…">
            Commenter
          </Button>
          {erreur && (
            <small className="field-err" id={`${fieldId}-err`} role="alert">
              {erreur}
            </small>
          )}
        </form>
      ) : (
        <p className="cmt-info">
          <Link to="/connexion" state={{ from: '/communaute', message: 'Connectez-vous pour commenter' }}>
            Connectez-vous
          </Link>{' '}
          pour commenter.
        </p>
      )}
    </section>
  );
}
