import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CircleCheck, Eye, Package, Plus, Send, ShieldCheck, Upload, X } from 'lucide-react';
import { useAuth } from '../../../app/AuthContext';
import { Breadcrumb, Button, Input, Panel, Select, StepsBar, Textarea, confetti, useToast } from '../../../design/components';
import { formatNumber } from '../../../lib/format';
import { getGouvernorats } from '../../auth';
import { createCampagne, getCategories } from '../api';
import CampaignCard from '../components/CampaignCard';
import '../campagnes.css';

const CATS = getCategories();
const GOV = getGouvernorats();
const COVERS = [...new Set(CATS.map((c) => c.cover))];
const STEPS = ['L’essentiel', 'Objectifs', 'Photos', 'Aperçu'];

/** Assistant de création de campagne en 4 étapes avec aperçu en direct. */
export default function NewCampaignPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const sendRef = useRef(null);
  const [st, setSt] = useState(1);
  const [sending, setSending] = useState(false);
  const [titleErr, setTitleErr] = useState('');
  const [d, setD] = useState({
    titre: '',
    categorie: 'Éducation',
    ville: 'Sfax',
    description: '',
    objectif: '5000',
    debut: '2026-12-01',
    fin: '2027-01-15',
    besoins: [['Cartables', '40']],
    cover: 'education',
    ownCover: false,
    point: 'Local Main dans la Main, 14 rue Habib Thameur, Sfax',
  });
  const set = (k) => (e) => setD((x) => ({ ...x, [k]: e.target.value }));
  const jours = Math.max(1, Math.round((new Date(d.fin) - new Date(d.debut)) / 864e5));
  const besoins = d.besoins.filter((b) => b[0].trim());

  const preview = {
    id: 'apercu',
    titre: d.titre || 'Titre de votre campagne',
    ville: d.ville,
    categorie: d.categorie,
    image: `/media/covers/${d.cover}.webp`,
    montant_collecte: 0,
    objectif_montant: Number(d.objectif) || 0,
    nb_donateurs: 0,
    jours_restants: jours,
    organisation: user.nom_organisation,
    statut: 'brouillon',
  };

  const next = async () => {
    if (st === 1 && !d.titre.trim()) {
      setTitleErr('Donnez un titre à votre campagne');
      toast('Donnez un titre à votre campagne');
      document.getElementById('w-titre')?.focus();
      return;
    }
    if (st < 4) {
      setSt(st + 1);
      return;
    }
    setSending(true);
    // TODO(API): POST /api/campagnes/ — voir features/campagnes/api.js (createCampagne)
    await createCampagne({
      titre: d.titre,
      description: d.description,
      categorie: d.categorie,
      date_debut: d.debut,
      date_fin: d.fin,
      objectif_montant: d.objectif,
      image: `/media/covers/${d.cover}.webp`,
    });
    confetti(sendRef.current);
    toast('Campagne envoyée en revue');
    setTimeout(() => navigate('/organisateur/campagnes'), 700);
  };

  const nav = (
    <div className="row" style={{ marginTop: 22 }}>
      {st > 1 && (
        <Button variant="ghost" style={{ height: 52 }} onClick={() => setSt(st - 1)}>
          ← Retour
        </Button>
      )}
      <Button
        ref={sendRef}
        style={{ flex: 1, justifyContent: 'center', height: 52 }}
        onClick={next}
        loading={sending}
        loadingText="Envoi…"
        icon={st === 4 ? Send : undefined}
        iconRight={st < 4 ? ArrowRight : undefined}
      >
        {st < 4 ? 'Continuer' : 'Envoyer en revue'}
      </Button>
    </div>
  );

  return (
    <div className="pg">
      <Breadcrumb items={[{ label: 'Mes campagnes', to: '/organisateur/campagnes' }, 'Nouvelle campagne']} />
      <StepsBar steps={STEPS} current={st} />
      <div className="wiz">
        <div className="panel">
          <div className="tabc" key={st}>
            {st === 1 && (
              <>
                <h2 style={{ fontSize: 26 }}>L’essentiel</h2>
                <Input
                  id="w-titre"
                  label="Titre"
                  maxLength={70}
                  placeholder="Ex. : Un cartable pour chaque rêve"
                  value={d.titre}
                  error={titleErr}
                  hint={`${d.titre.length} / 70 · court et concret, c’est mieux`}
                  onChange={(e) => {
                    setTitleErr('');
                    set('titre')(e);
                  }}
                />
                {titleErr && <small className="cap4">{d.titre.length} / 70 · court et concret, c’est mieux</small>}
                <span className="lbl" id="cat-lbl">
                  Catégorie
                </span>
                <div className="catp" role="group" aria-labelledby="cat-lbl">
                  {CATS.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      aria-pressed={c.label === d.categorie}
                      onClick={() => setD((x) => ({ ...x, categorie: c.label, cover: x.ownCover ? x.cover : c.cover }))}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <Select label="Ville" value={d.ville} onChange={set('ville')} options={GOV} style={{ width: '100%' }} />
                <Textarea label="Description" placeholder="Qui aidez-vous, comment, et ce que change chaque don…" value={d.description} onChange={set('description')} />
              </>
            )}
            {st === 2 && (
              <>
                <h2 style={{ fontSize: 26 }}>Objectifs</h2>
                <div className="fg2">
                  <div>
                    <Input label="Objectif financier (TND)" inputMode="numeric" value={d.objectif} onChange={(e) => setD((x) => ({ ...x, objectif: e.target.value.replace(/\D/g, '') }))} />
                  </div>
                  <div />
                  <div>
                    <Input label="Début" type="date" value={d.debut} onChange={set('debut')} />
                  </div>
                  <div>
                    <Input label="Fin" type="date" value={d.fin} onChange={set('fin')} />
                  </div>
                </div>
                <span className="lbl" style={{ marginTop: 18, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Package size={15} aria-hidden="true" /> Besoins matériels (facultatif)
                </span>
                <p className="cap4" style={{ marginBottom: 8 }}>
                  Les citoyens pourront donner ces articles au lieu de l’argent.
                </p>
                {d.besoins.map((b, i) => (
                  <div className="needrow" key={i}>
                    <input
                      className="inp3"
                      aria-label={`Article ${i + 1}`}
                      placeholder="Article (ex. : trousses)"
                      value={b[0]}
                      autoFocus={i === d.besoins.length - 1 && i > 0 && !b[0]}
                      onChange={(e) => setD((x) => ({ ...x, besoins: x.besoins.map((r, j) => (j === i ? [e.target.value, r[1]] : r)) }))}
                    />
                    <input
                      className="inp3"
                      aria-label={`Quantité de l’article ${i + 1}`}
                      placeholder="Quantité"
                      inputMode="numeric"
                      value={b[1]}
                      onChange={(e) => setD((x) => ({ ...x, besoins: x.besoins.map((r, j) => (j === i ? [r[0], e.target.value.replace(/\D/g, '')] : r)) }))}
                    />
                    <button type="button" className="kob" aria-label={`Retirer l’article ${i + 1}`} onClick={() => setD((x) => ({ ...x, besoins: x.besoins.filter((_, j) => j !== i) }))}>
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" icon={Plus} onClick={() => setD((x) => ({ ...x, besoins: [...x.besoins, ['', '']] }))}>
                  Ajouter un article
                </Button>
                <Input label="Point de collecte" value={d.point} onChange={set('point')} />
              </>
            )}
            {st === 3 && (
              <>
                <h2 style={{ fontSize: 26 }}>Photos</h2>
                <button type="button" className="drop" onClick={() => toast('Démo : utilisez une couverture moubedra')}>
                  <Upload size={26} aria-hidden="true" />
                  <br />
                  <b style={{ color: 'var(--navy)' }}>Glissez vos photos ici</b>
                  <br />
                  JPG ou PNG · une vraie photo de votre action donne confiance
                </button>
                <span className="lbl" id="cov-lbl" style={{ marginTop: 16 }}>
                  Pas encore de photo ? Utilisez une couverture moubedra
                </span>
                <div className="covpick" role="group" aria-labelledby="cov-lbl">
                  {COVERS.map((v) => (
                    <button key={v} type="button" aria-pressed={v === d.cover} aria-label={`Couverture ${v}`} onClick={() => setD((x) => ({ ...x, cover: v, ownCover: true }))}>
                      <img src={`/media/covers/${v}.webp`} alt="" />
                    </button>
                  ))}
                </div>
              </>
            )}
            {st === 4 && (
              <>
                <h2 style={{ fontSize: 26 }}>Tout est prêt ?</h2>
                <div className="list" style={{ marginTop: 8 }}>
                  {[
                    ['Titre', d.titre || '—'],
                    ['Catégorie · ville', `${d.categorie} · ${d.ville}`],
                    ['Objectif', `${formatNumber(Number(d.objectif) || 0)} TND`],
                    ['Période', `${d.debut} → ${d.fin}`],
                    ['Besoins matériels', besoins.map((b) => `${b[1]} ${b[0]}`).join(', ') || 'aucun'],
                  ].map(([k, v]) => (
                    <div className="it" key={k}>
                      <div className="gw">
                        <small>{k}</small>
                        <h4>{v}</h4>
                      </div>
                      <CircleCheck size={18} color="var(--green)" aria-hidden="true" />
                    </div>
                  ))}
                </div>
                <div className="impact3" style={{ marginTop: 14 }}>
                  <ShieldCheck size={16} aria-hidden="true" />
                  <span>L’équipe vérifie la campagne sous 48 h. Vous pourrez encore la modifier pendant la revue.</span>
                </div>
              </>
            )}
            {nav}
          </div>
        </div>
        <aside className="sticky2" aria-label="Aperçu en direct">
          <div className="prevlbl">
            <Eye size={14} aria-hidden="true" /> Aperçu en direct
          </div>
          <CampaignCard campagne={preview} preview />
          {besoins.length > 0 && (
            <Panel style={{ marginTop: 10, padding: 14 }}>
              <b style={{ font: '700 14px var(--display)', color: 'var(--navy)', display: 'flex', gap: 6, alignItems: 'center' }}>
                <Package size={15} aria-hidden="true" /> Besoins matériels
              </b>
              <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 4 }}>{besoins.map((b) => `${b[1] || '?'} ${b[0].toLowerCase()}`).join(' · ')}</div>
            </Panel>
          )}
          <p className="cap4" style={{ marginTop: 10 }}>
            <ShieldCheck size={14} aria-hidden="true" /> Chaque campagne est vérifiée par l’équipe avant publication.
          </p>
        </aside>
      </div>
    </div>
  );
}
