import { Link } from 'react-router-dom';
import { BadgeCheck, CalendarDays, Heart, Megaphone, Users, Wallet } from 'lucide-react';
import { formatNumber } from '../../../lib/format';
import { POULS_DU_JOUR } from '../../accueil';

const PERKS = {
  signup: [
    [Heart, 'Donnez en toute confiance', 'Associations vérifiées, dépenses publiées.'],
    [CalendarDays, 'Agissez près de chez vous', 'Événements bénévoles dans votre ville.'],
    [Megaphone, 'Lancez vos propres actions', 'Devenez organisateur quand vous êtes prêt·e.'],
  ],
  asso: [
    [BadgeCheck, 'Badge « vérifiée »', 'Les donateurs savent qu’ils peuvent vous faire confiance.'],
    [Wallet, 'Collectez en ligne', 'Carte, D17, virement : suivi en temps réel.'],
    [Users, 'Mobilisez des bénévoles', 'Événements, inscriptions, QR code le jour J.'],
  ],
};

/** Panneau illustré de gauche : message différent pour connexion, inscription citoyen et association. */
export default function AuthAside({ variant }) {
  const { dons, montant, benevoles } = POULS_DU_JOUR;
  return (
    <aside className="aleft" aria-label="Pourquoi rejoindre moubedra">
      <Link to="/" className="alogo" aria-label="moubedra — retour à l’accueil">
        <span className="mark2" aria-hidden="true">
          <Heart size={18} color="#f3b49f" />
        </span>
        <b aria-hidden="true">
          moubedra<span style={{ color: '#f3b49f' }}>.</span>
        </b>
      </Link>
      {variant === 'login' ? (
        <div className="aside-in" key="login">
          <h2>
            Les petits gestes font les grands <em>demain.</em>
          </h2>
          <p>Retrouvez vos campagnes, vos dons et vos prochains rendez-vous solidaires.</p>
        </div>
      ) : (
        <div className="aside-in" key={variant}>
          <h2>
            {variant === 'asso' ? (
              <>
                Donnez de la portée à <em>votre association.</em>
              </>
            ) : (
              <>
                Rejoignez 8 540 citoyens qui <em>agissent.</em>
              </>
            )}
          </h2>
          <ul className="perks">
            {PERKS[variant].map(([IconCmp, t, d]) => (
              <li key={t}>
                <span className="pi" aria-hidden="true">
                  <IconCmp size={18} />
                </span>
                <div>
                  <b>{t}</b>
                  <small>{d}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="alive">
        <div>
          <small>
            <span className="dot2" aria-hidden="true" />
            Aujourd’hui ? </small>
          <b>{dons} dons</b>
        </div>
        <div>
          <small>&nbsp;</small>
          <b>{formatNumber(montant)} TND</b>
        </div>
        <div>
          <small>&nbsp;</small>
          <b>{benevoles} bénévoles</b>
        </div>
      </div>
    </aside>
  );
}
