import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowRight, Bell, BookOpen, HandHeart, Heart, HeartPulse, Megaphone, Search, Sparkles, Sprout, Utensils } from 'lucide-react';
import { useAuth } from '../../../app/AuthContext';
import { Button, Chip, EmptyState, useToast } from '../../../design/components';
import { useCountUp } from '../../../design/hooks';
import { formatNumber } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { categorieCode, listCampagnes, listFavoris, toggleFavori } from '../../campagnes';
import { PostCard, listApercuCommunaute } from '../../publications';
import { getContenusAccueil, getStatistiques } from '../api';
import Hero from '../components/Hero';
import HomeCampaignCard from '../components/HomeCampaignCard';
import Reveal from '../components/Reveal';
import '../accueil.css';

const CHIPS = [
  { key: 'all', label: 'Toutes' },
  { key: 'edu', label: 'Éducation', icon: BookOpen },
  { key: 'food', label: 'Alimentaire', icon: Utensils },
  { key: 'env', label: 'Environnement', icon: Sprout },
  { key: 'sante', label: 'Santé', icon: HeartPulse },
];
const A_LA_UNE = [1, 2, 4];

function Stat({ value, label, start }) {
  const n = useCountUp(value, { start });
  return (
    <div>
      <b aria-hidden="true">{formatNumber(n)}</b>
      <span className="sr-only">{formatNumber(value)}</span>
      <small>{label}</small>
    </div>
  );
}

export default function HomePage() {
  const { role, isAuthenticated } = useAuth();
  const toast = useToast();
  const { hash } = useLocation();
  const [inClass, setInClass] = useState(false);
  const [chip, setChip] = useState('all');
  // TODO(API): agrégats et contenus — voir features/accueil/api.js
  const { data: stats } = useApi(getStatistiques, [], []);
  const { data: contenus } = useApi(getContenusAccueil, []);
  // TODO(API): GET /api/campagnes/ — voir features/campagnes/api.js (listCampagnes)
  const { data: campagnes } = useApi(listCampagnes, [], []);
  const { data: favIds, setData: setFav } = useApi(listFavoris, [], []);
  // TODO(API): GET /api/publications/ — voir features/publications/api.js (listApercuCommunaute)
  const { data: apercu } = useApi(listApercuCommunaute, [], []);

  useEffect(() => {
    const t = setTimeout(() => setInClass(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (hash === '#comment-ca-marche') {
      const t = setTimeout(() => document.getElementById('comment-ca-marche')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [hash]);

  const cards = A_LA_UNE.map((id) => campagnes.find((c) => c.id === id)).filter(Boolean);
  const visibles = cards.filter((c) => chip === 'all' || categorieCode(c.categorie) === chip);
  const santeCount = campagnes.filter((c) => categorieCode(c.categorie) === 'sante' && A_LA_UNE.includes(c.id)).length;
  const launchTo = !isAuthenticated ? '/inscription' : role === 'organisateur' ? '/organisateur/campagnes/nouvelle' : '/espace/devenir-organisateur';

  const onFav = (c) => {
    const on = !favIds.includes(c.id);
    setFav((f) => (on ? [...f, c.id] : f.filter((x) => x !== c.id)));
    toggleFavori(c.id);
    toast(on ? 'Campagne enregistrée' : 'Retirée des favoris');
  };

  return (
    <div className={`home${inClass ? ' in' : ''}`}>
      {contenus && <Hero contenus={contenus} />}

      <Reveal className="stats" aria-label="La plateforme en chiffres">
        {(visible) => stats.map((s) => <Stat key={s.libelle} value={s.valeur} label={s.libelle} start={visible} />)}
      </Reveal>

      <section aria-labelledby="h-causes">
        <Reveal className="sh">
          <div>
            <span className="eyebrow">Petits gestes, belles histoires</span>
            <h2 id="h-causes">
              Une cause vous attend ? <br />
              près de chez vous. ? </h2>
          </div>
          <Button variant="ghost" to="/campagnes" iconRight={ArrowRight} arrow>
            Voir toutes les campagnes ? </Button>
        </Reveal>
        <Reveal className="chips" role="group" aria-label="Filtrer par catégorie">
          {CHIPS.map((c) => (
            <Chip key={c.key} icon={c.icon} active={chip === c.key} onClick={() => setChip(c.key)}>
              {c.label}
              {c.key === 'sante' ? ` · ${santeCount}` : ''}
            </Chip>
          ))}
        </Reveal>
        {chip === 'sante' && !visibles.length && (
          <EmptyState
            large
            image="campagnes"
            title="Pas encore de campagne Santé près de chez vous"
            text="Soyez prévenu·e dès qu’une association en lance une, ou découvrez les autres causes actives."
            actions={
              <>
                <Button variant="navy" icon={Bell} onClick={() => toast('Alerte créée : vous serez prévenu·e')}>
                  Créer une alerte ? </Button>
                <Button variant="ghost" onClick={() => setChip('all')}>
                  Voir toutes les campagnes ? </Button>
              </>
            }
          />
        )}
        <Reveal className="cards" aria-live="polite">
          {cards.map((c, i) => (
            <HomeCampaignCard
              key={c.id}
              campagne={c}
              delay={i * 0.06}
              hidden={!visibles.includes(c)}
              favori={favIds.includes(c.id)}
              onFavori={() => onFav(c)}
            />
          ))}
        </Reveal>
      </section>

      <section aria-labelledby="h-communaute">
        <Reveal className="sh">
          <div>
            <span className="eyebrow">En direct de la communauté</span>
            <h2 id="h-communaute">
              Ce qui se passe ? <br />
              en ce moment. ? </h2>
          </div>
          <Button variant="ghost" to="/communaute" iconRight={ArrowRight} arrow>
            Ouvrir le fil ? </Button>
        </Reveal>
        <div className="cgrid">
          {apercu.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.12}>
              <PostCard post={p} compact />
            </Reveal>
          ))}
        </div>
      </section>

      {contenus && (
        <div className="ticker" aria-label="Derniers gestes solidaires">
          <div className="tr">
            {[...contenus.bandeau, ...contenus.bandeau].map(([nom, quoi, cause], i) => (
              <span key={i} aria-hidden={i >= contenus.bandeau.length || undefined}>
                <Heart size={16} aria-hidden="true" /> <b>{nom}</b> {quoi === 'bénévole' ? 'a rejoint' : `a donné ${quoi} à`} « {cause} »
              </span>
            ))}
          </div>
        </div>
      )}

      <section aria-labelledby="comment-ca-marche-titre" id="comment-ca-marche">
        <Reveal className="sh">
          <div>
            <span className="eyebrow">Simple et transparent</span>
            <h2 id="comment-ca-marche-titre">Comment ça marche ?</h2>
          </div>
        </Reveal>
        <ol className="steps" style={{ listStyle: 'none' }}>
          {[
            [Search, 'Trouvez une cause', 'Filtrez par région, thème ou urgence.', 'var(--navy)'],
            [HandHeart, 'Donnez ou participez', 'Carte, D17, virement — ou quelques heures sur le terrain.', 'var(--orange)'],
            [Sparkles, 'Suivez l’impact', 'Photos, nouvelles et utilisation des fonds.', 'var(--green)'],
          ].map(([IconCmp, t, d, col], i) => (
            <Reveal as="li" key={t} className="step" delay={i * 0.12}>
              <span className="num" aria-hidden="true">
                0{i + 1}
              </span>
              <span className="ic" aria-hidden="true">
                <IconCmp size={24} color={col} />
              </span>
              <h3>{t}</h3>
              <p>{d}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <Reveal className="final">
        <div>
          <h2>Vous portez une idée solidaire ?</h2>
          <p>Créez votre campagne en 10 minutes.</p>
        </div>
        <Button variant="white" size="lg" icon={Megaphone} to={launchTo}>
          Lancer une campagne ? </Button>
      </Reveal>
    </div>
  );
}
