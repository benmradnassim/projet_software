import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, CalendarDays, ChevronRight, Clock3, FileText, Gift, HandHeart, Heart, Lock, MapPin, Package, Share2, TrendingUp, Trophy } from 'lucide-react';
import { Avatar, Badge, Breadcrumb, Button, DateBadge, EmptyState, Input, MapPreview, Modal, Panel, ProgressBar, Select, Skeleton, Tabs, Timeline, useToast } from '../../../design/components';
import { formatDate, formatTime, tnd } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { listDonateursCampagne } from '../../dons';
import { listEvenements } from '../../evenements';
import { useAuth } from '../../../app/AuthContext';
import { demanderParticipationCampagne, getBesoins, getCampagne, getCampagneDetails, getMaParticipationCampagne } from '../api';
import { isTerminee, pctCampagne } from '../components/CampaignCard';
import NeedsList, { articlesManquants } from '../components/NeedsList';
import '../campagnes.css';

/** Paragraphes + **gras** depuis la description. */
function RichText({ text }) {
  return text.split('\n\n').map((para, i) => (
    <p key={i}>
      {para.split(/\*\*(.+?)\*\*/g).map((part, j) => (j % 2 ? <b key={j}>{part}</b> : <Fragment key={j}>{part}</Fragment>))}
    </p>
  ));
}

/* ---------- panneau de don collant ---------- */
function DonatePanel({ c, besoins, details, evenements, mode, setMode, ring, panelRef, participation, openParticipation }) {
  const navigate = useNavigate();
  const [amt, setAmt] = useState(50);
  const [qty, setQty] = useState([]);
  const done = isTerminee(c);
  const p = pctCampagne(c);
  const total = qty.reduce((a, b) => a + (b || 0), 0);
  const ev = evenements[0];
  return (
    <aside className="sticky2" aria-label="Soutenir la campagne" ref={panelRef}>
      <div className={`panel donate-panel${ring ? ' ring' : ''}`} key={ring}>
        {besoins && (
          <div className={`dtype${mode === 'mat' ? ' r' : ''}`} role="tablist" aria-label="Type de don">
            <span className="ind3" aria-hidden="true" />
            <button type="button" role="tab" aria-selected={mode === 'money'} onClick={() => setMode('money')}>
              <Heart size={15} aria-hidden="true" /> De l’argent
            </button>
            <button type="button" role="tab" aria-selected={mode === 'mat'} onClick={() => setMode('mat')}>
              <Package size={15} aria-hidden="true" /> Du matériel
            </button>
          </div>
        )}
        {mode === 'money' || !besoins ? (
          <div className={besoins ? 'slide-in' : undefined} role={besoins ? 'tabpanel' : undefined}>
            <div className="big3">{tnd(c.montant_collecte)}</div>
            <div className="muted">collectés sur {tnd(c.objectif_montant)}</div>
            <ProgressBar value={Math.min(100, p)} height={10} style={{ marginTop: 10 }} label={`${p} % financé`} />
            <div className="rg3">
              <div>
                <b>{p} %</b>
                <small>financé</small>
              </div>
              <div>
                <b>{c.nb_donateurs}</b>
                <small>donateurs</small>
              </div>
              <div>
                <b style={{ color: 'var(--orange)' }}>{done ? '—' : `${c.jours_restants ?? calculerJoursRestants(c.date_fin) ?? '—'} j`}</b>
                <small>restants</small>
              </div>
            </div>
            {done ? (
              <div className="impact3">
                <Trophy size={16} aria-hidden="true" />
                <span>Objectif atteint, merci à tous ! Les dons restent possibles pour la suite du projet.</span>
              </div>
            ) : (
              <>
                <b id="amt-lbl" style={{ font: '700 16px var(--display)', color: 'var(--navy)' }}>
                  Choisissez un montant
                </b>
                <div className="amts3" role="group" aria-labelledby="amt-lbl">
                  {[20, 50, 100].map((a) => (
                    <button key={a} type="button" aria-pressed={a === amt} onClick={() => setAmt(a)}>
                      {a} TND
                    </button>
                  ))}
                </div>
                <div className="impact3" aria-live="polite" key={amt} style={{ animation: 'pgin .3s var(--out)' }}>
                  <Gift size={16} aria-hidden="true" />
                  <span>
                    {amt} TND {details?.impact?.[amt]}
                  </span>
                </div>
              </>
            )}
            <Button block size="wide" icon={Heart} style={{ marginTop: 14, height: 52 }} onClick={() => navigate(`/campagnes/${c.id}/don?montant=${amt}`)}>
              Donner {done ? '' : `${amt} TND`}
            </Button>
            {participation?.statut === 'en_attente' ? (
              <Button block variant="ghost" icon={HandHeart} style={{ marginTop: 10 }} disabled>
                Participation en attente
              </Button>
            ) : participation?.statut === 'acceptee' ? (
              <Button block variant="ghost" icon={HandHeart} style={{ marginTop: 10 }} disabled>
                Participation acceptée
              </Button>
            ) : (
              <Button block variant="ghost" icon={HandHeart} style={{ marginTop: 10 }} onClick={openParticipation}>
                Je veux participer
              </Button>
            )}
            <p className="cap4" style={{ justifyContent: 'center', marginTop: 12 }}>
              <Lock size={14} aria-hidden="true" /> Paiement sécurisé · Carte · D17 · Virement
            </p>
          </div>
        ) : (
          <div className="slide-in" role="tabpanel">
            <b style={{ font: '700 16px var(--display)', color: 'var(--navy)' }}>De quoi ont-ils besoin ?</b>
            <div style={{ marginTop: 6 }}>
              <NeedsList besoins={besoins} quantites={qty} onChange={(k, v) => setQty((q) => Object.assign([...q], { [k]: v }))} />
            </div>
            <Button
              block
              icon={Package}
              disabled={!total}
              style={{ marginTop: 14, height: 50 }}
              onClick={() => navigate(`/campagnes/${c.id}/don?type=materiel&q=${besoins.items.map((_, k) => qty[k] || 0).join('.')}`)}
            >
              {total ? `Je donne ${total} article${total > 1 ? 's' : ''}` : 'Choisissez au moins un article'}
            </Button>
            <p className="cap4" style={{ marginTop: 10 }}>
              <MapPin size={14} aria-hidden="true" /> Dépôt : {besoins.point_collecte.split(',')[0]}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}



function calculerJoursRestants(dateFin) {
  if (!dateFin) return null;

  const fin = new Date(`${dateFin}T23:59:59`);

  if (Number.isNaN(fin.getTime())) return null;

  return Math.max(
    0,
    Math.ceil((fin.getTime() - Date.now()) / 86400000)
  );
}














export default function CampaignDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  // TODO(API): remplacer par GET /api/campagnes/<id>/ — voir features/campagnes/api.js (getCampagne)
  const { data: c, loading } = useApi(() => getCampagne(id), [id]);
  // TODO(API): onglets du détail, besoins, événements et donateurs — voir les api.js des features campagnes, evenements, dons
  const { data: details } = useApi(() => getCampagneDetails(id), [id]);
  const { data: besoins } = useApi(() => getBesoins(id), [id]);
  const { data: evenements } = useApi(() => listEvenements({ campagne: id }), [id], []);
  const { data: donateurs } = useApi(() => listDonateursCampagne(id), [id], []);
  const [tab, setTab] = useState('story');
  const [mode, setMode] = useState('money');
  const [ring, setRing] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [typeParticipation, setTypeParticipation] = useState('benevole');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [cin, setCin] = useState('');
  const [adresse, setAdresse] = useState('');
  const [motif, setMotif] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const { data: participation, setData: setParticipation } = useApi(
    () => (isAuthenticated ? getMaParticipationCampagne(id) : Promise.resolve(null)),
    [id, isAuthenticated],
  );

  useEffect(() => {
    setTab('story');
    setMode('money');
  }, [id]);

  const openParticipation = () => {
    if (!isAuthenticated) {
      navigate('/connexion', { state: { from: `/campagnes/${id}`, message: 'Connectez-vous pour participer à cette campagne' } });
      return;
    }
    setFormOpen(true);
  };

  const submitParticipation = async () => {
    const errors = {};
    if (nom.trim().length < 2) errors.nom = 'Saisissez votre nom.';
    if (prenom.trim().length < 2) errors.prenom = 'Saisissez votre prénom.';
    const phoneDigits = telephone.trim().replace(/\D/g, '');
    if (!(phoneDigits.length === 8 || (phoneDigits.startsWith('216') && phoneDigits.length === 11))) {
      errors.telephone = 'Saisissez 8 chiffres, avec +216 facultatif.';
    }
    if (!/^\d{8}$/.test(cin.trim())) errors.cin = 'Le CIN doit contenir exactement 8 chiffres.';
    if (adresse.trim().length < 5) errors.adresse = 'Saisissez une adresse complète.';
    if (motif.trim().length < 10) errors.motif = 'Le motif doit contenir au moins 10 caractères.';
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setSending(true);
    try {
      const created = await demanderParticipationCampagne(id, {
        type: typeParticipation,
        motif: motif.trim(),
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone.trim(),
        cin: cin.trim(),
        adresse: adresse.trim(),
      });
      setParticipation(created);
      setFormOpen(false);
      toast('Demande de participation envoyée à l’organisateur.');
    } catch (error) {
      toast(error.message || 'Impossible d’envoyer la demande.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="pg dg" aria-busy="true">
        <div>
          <Skeleton height={360} radius={22} />
          <Skeleton height={38} width="60%" style={{ marginTop: 18 }} />
        </div>
        <Skeleton height={420} radius={20} />
      </div>
    );
  }
  if (!c) {
    return <EmptyState image="campagnes" title="Campagne introuvable" text="Elle a peut-être été clôturée ou retirée." actions={<Button to="/campagnes" size="sm">Voir les campagnes</Button>} />;
  }

  const done = isTerminee(c);
  const tabs = [
    { key: 'story', label: 'L’histoire' },
    { key: 'news', label: 'Nouvelles', count: details?.nouvelles.length },
    ...(besoins ? [{ key: 'mat', label: 'Besoins matériels', icon: Package, count: articlesManquants(besoins) }] : []),
    { key: 'funds', label: 'Utilisation des fonds' },
    { key: 'events', label: 'Événements', count: evenements.length },
    { key: 'donors', label: 'Donateurs', count: c.nb_donateurs },
  ];

  const goMaterial = () => {
    setMode('mat');
    setRing((r) => r + 1);
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const content = {
    story: details && (
      <>
        <Panel className="story2">
          <RichText text={c.description} />
        </Panel>
        <Panel title="Avancement du projet" style={{ marginTop: 16 }}>
          <Timeline items={details.avancement.map((a) => ({ title: a.titre, info: a.info.replace('{objectif}', tnd(c.objectif_montant)), future: a.futur }))} />
        </Panel>
      </>
    ),
    news: details && (
      <Panel>
        <div className="list">
          {details.nouvelles.map((n) => (
            <div className="it" key={n.titre}>
              <span className="ic2" style={{ background: 'var(--ok-bg)', color: 'var(--ok-fg)' }}>
                <TrendingUp size={18} aria-hidden="true" />
              </span>
              <div className="gw">
                <h4>{n.titre}</h4>
                <small>{n.date}</small>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    ),
    mat: besoins && (
      <div className="g2" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
        <Panel title="Ce qui manque encore" action={<Badge tone="wait">{articlesManquants(besoins)} articles</Badge>}>
          <NeedsList besoins={besoins} />
        </Panel>
        <Panel title="Où déposer ?">
          <MapPreview height={130} compact label={`Point de collecte : ${besoins.point_collecte}`} />
          <p style={{ marginTop: 10, fontWeight: 700, color: 'var(--navy)' }}>{besoins.point_collecte}</p>
          <p className="cap4">
            <Clock3 size={14} aria-hidden="true" /> {besoins.horaires}
          </p>
          <Button block icon={Package} style={{ marginTop: 14 }} onClick={goMaterial}>
            Je donne du matériel
          </Button>
        </Panel>
      </div>
    ),
    funds: details && (
      <Panel
        title="Où va votre argent ?"
        action={
          <Badge tone="ok" icon={BadgeCheck}>
            Vérifié
          </Badge>
        }
      >
        {details.fonds.map((f) => (
          <div className="fr2" key={f.libelle}>
            <span>{f.libelle}</span>
            <ProgressBar value={f.part} color={f.couleur} height={10} label={`${f.libelle} : ${f.part} %`} />
            <b>{f.part} %</b>
          </div>
        ))}
        <span className="file" style={{ marginTop: 16 }}>
          <FileText size={16} aria-hidden="true" /> {details.justificatif}
        </span>
      </Panel>
    ),
    events: evenements.length ? (
      <div>
        {evenements.map((e) => (
          <Link key={e.id} to={`/evenements/${e.id}`} className="evc-lite">
            <DateBadge date={e.date_evenement} />
            <div className="gw">
              <h3>{e.titre}</h3>
              <small className="muted">
                {formatTime(e.date_evenement)} – {e.heure_fin} · {e.lieu}
              </small>
            </div>
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        ))}
      </div>
    ) : (
      <Panel>Aucun événement pour cette campagne.</Panel>
    ),
    donors: (
      <Panel>
        <div className="list">
          {donateurs.map((d) => (
            <div className="it" key={d.id}>
              <Avatar initials={d.initiales} color={d.couleur} />
              <div className="gw">
                <h4>{d.donateur_nom}</h4>
                <small>{d.quand}</small>
              </div>
              <b style={{ color: 'var(--navy)' }}>{tnd(d.montant)}</b>
            </div>
          ))}
        </div>
      </Panel>
    ),
  };

  return (
    <div className="pg">
      <Breadcrumb items={[{ label: 'Campagnes', to: '/campagnes' }, c.categorie, c.titre]} />
      <div className="dg">
        <div>
          <div className="cover2">
            <img src={c.image} alt="" style={{ objectPosition: c.image_position }} />
            <span className="tg">{c.categorie}</span>
          </div>
          <div className="gal">
            <img src={c.image} alt="Photo de la campagne" style={{ objectPosition: '20% 50%' }} loading="lazy" />
            {details?.galerie.map((g) => (
              <img key={g} src={g} alt="Photo de terrain" loading="lazy" />
            ))}
            <button type="button" onClick={() => toast('La galerie complète arrive bientôt')}>
              +{details?.photos_supplementaires ?? 0} photos
            </button>
          </div>
          <h1 className="dtitle">{c.titre}</h1>
          <div className="dmeta">
            <Badge tone={done ? 'grey' : 'ok'}>● {done ? 'Terminée' : 'En cours'}</Badge>
            <span>
              <MapPin size={16} aria-hidden="true" /> {c.ville}
            </span>
            <span>
              <CalendarDays size={16} aria-hidden="true" /> {formatDate(c.date_debut, { year: false })} → {formatDate(c.date_fin)}
            </span>
            <span>
              <BadgeCheck size={16} aria-hidden="true" /> {c.organisation}
            </span>
            <button type="button" onClick={() => toast('Lien copié, prêt à partager sur WhatsApp')}>
              <Share2 size={16} aria-hidden="true" /> Partager
            </button>
          </div>
          <Tabs tabs={tabs} value={tab} onChange={setTab} label="Sections de la campagne" style={{ marginTop: 22 }}>
            {content[tab]}
          </Tabs>
        </div>
        <DonatePanel
          c={c}
          besoins={besoins}
          details={details}
          evenements={evenements}
          mode={mode}
          setMode={setMode}
          ring={ring}
          panelRef={panelRef}
          participation={participation}
          openParticipation={openParticipation}
        />
      </div>
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Participer à la campagne"
        width={520}
        actions={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button icon={HandHeart} loading={sending} loadingText="Envoi…" onClick={submitParticipation}>
              Envoyer ma demande
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--muted)', marginTop: 4 }}>{c.titre}</p>
        <div style={{ marginTop: 16 }}>
          <Select
            label="Type de participation"
            value={typeParticipation}
            onChange={(event) => setTypeParticipation(event.target.value)}
            options={[
              { value: 'benevole', label: 'Bénévole' },
              { value: 'don_materiel', label: 'Don matériel' },
              { value: 'accompagnement', label: 'Accompagnement' },
              { value: 'autre', label: 'Autre' },
            ]}
          />
        </div>
        <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <Input label="Nom" value={nom} onChange={(event) => setNom(event.target.value)} error={formErrors.nom} maxLength={100} autoFocus />
          <Input label="Prénom" value={prenom} onChange={(event) => setPrenom(event.target.value)} error={formErrors.prenom} maxLength={100} />
        </div>
        <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <Input
            label="Téléphone"
            type="tel"
            inputMode="tel"
            value={telephone}
            onChange={(event) => setTelephone(event.target.value)}
            error={formErrors.telephone}
            placeholder="+216 22 333 444"
            maxLength={30}
          />
          <Input
            label="CIN"
            inputMode="numeric"
            value={cin}
            onChange={(event) => setCin(event.target.value.replace(/\D/g, '').slice(0, 8))}
            error={formErrors.cin}
            placeholder="8 chiffres"
            maxLength={8}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <Input label="Adresse" value={adresse} onChange={(event) => setAdresse(event.target.value)} error={formErrors.adresse} maxLength={255} />
        </div>
        <div style={{ marginTop: 12 }}>
          <label className="lbl" htmlFor="campagne-motif">Motif de participation</label>
          <textarea
            id="campagne-motif"
            className={`inp3${formErrors.motif ? ' bad' : ''}`}
            style={{ height: 90 }}
            placeholder="Expliquez comment vous souhaitez participer"
            value={motif}
            onChange={(event) => setMotif(event.target.value)}
            aria-invalid={!!formErrors.motif}
          />
          {formErrors.motif && <small className="field-err" role="alert">{formErrors.motif}</small>}
        </div>
      </Modal>
    </div>
  );
}
