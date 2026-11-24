import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { BadgeCheck, CalendarPlus, Check, ChevronRight, Clock3, MapPin, Navigation } from 'lucide-react';
import { useAuth } from '../../../app/AuthContext';
import { AvatarStack, Badge, Breadcrumb, Button, Chip, DateBadge, EmptyState, MapPreview, Panel, ProgressBar, Skeleton, Timeline, confetti, useToast } from '../../../design/components';
import { percent } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { getCampagne } from '../../campagnes';
import { demanderParticipation, getEvenement, getMaParticipation, getProgramme } from '../api';
import { horaire } from '../components/EventRow';
import '../evenements.css';

export default function EventDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const btnRef = useRef(null);
  // TODO(API): GET /api/evenements/<id>/ et GET /api/participations/evenements/?evenement=<id> — voir features/evenements/api.js
  const { data: e, loading } = useApi(() => getEvenement(id), [id]);
  const { data: prog } = useApi(getProgramme, []);
  const { data: part, setData: setPart } = useApi(() => (isAuthenticated ? getMaParticipation(id) : Promise.resolve(null)), [id, isAuthenticated]);
  // TODO(API): GET /api/campagnes/<id>/ — voir features/campagnes/api.js
  const { data: camp } = useApi(() => (e?.campagne ? getCampagne(e.campagne) : Promise.resolve(null)), [e?.campagne]);
  const [motif, setMotif] = useState('');
  const [sending, setSending] = useState(false);
  const [extra, setExtra] = useState(0);

  if (loading) {
    return (
      <div className="pg dg" aria-busy="true">
        <Skeleton height={300} radius={22} />
        <Skeleton height={380} radius={20} />
      </div>
    );
  }
  if (!e) return <EmptyState title="Événement introuvable" text="Il a peut-être été annulé." actions={<Button to="/evenements" size="sm">Voir les événements</Button>} />;

  const going = e.nb_participants + extra;

  const join = async () => {
    if (!isAuthenticated) {
      navigate('/connexion', { state: { from: `/evenements/${id}`, message: 'Connectez-vous pour participer' } });
      return;
    }
    setSending(true);
    // TODO(API): POST /api/participations/evenements/ — voir features/evenements/api.js (demanderParticipation)
    const p = await demanderParticipation(id, motif);
    setSending(false);
    setPart(p);
    setExtra(1);
    confetti(btnRef.current);
    toast('Demande envoyée. Vous serez notifié·e de la réponse.');
  };

  return (
    <div className="pg">
      <Breadcrumb items={[{ label: 'Événements', to: '/evenements' }, e.titre]} />
      <div className="dg">
        <div>
          <div className="cover2" style={{ height: 300, borderRadius: 22, overflow: 'hidden' }}>
            <img src={e.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: e.image_position }} />
          </div>
          <div className="row" style={{ marginTop: 18, gap: 18, alignItems: 'flex-start' }}>
            <DateBadge date={e.date_evenement} />
            <div>
              <h1 style={{ fontSize: 34, fontWeight: 800 }}>{e.titre}</h1>
              <div className="dmeta" style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap', color: 'var(--muted)' }}>
                <span className="row" style={{ gap: 6 }}>
                  <Clock3 size={16} aria-hidden="true" /> {horaire(e)}
                </span>
                <span className="row" style={{ gap: 6 }}>
                  <MapPin size={16} aria-hidden="true" /> {e.lieu}
                </span>
                <span className="row" style={{ gap: 6 }}>
                  <BadgeCheck size={16} aria-hidden="true" /> {e.organisateur_nom}
                </span>
              </div>
            </div>
          </div>
          {prog && (
            <>
              <Panel title="Programme" style={{ marginTop: 20 }}>
                <Timeline items={prog.programme.map((s) => ({ title: s.heure, info: s.texte }))} />
              </Panel>
              <Panel title="À prévoir" style={{ marginTop: 16 }}>
                <div className="chips">
                  {prog.a_prevoir.map((x) => (
                    <Chip key={x} isStatic>
                      {x}
                    </Chip>
                  ))}
                </div>
              </Panel>
            </>
          )}
          <Panel title="Lieu de rendez-vous" style={{ marginTop: 16 }}>
            <MapPreview label={`Lieu de rendez-vous : ${e.lieu}`} />
            <Button variant="ghost" size="sm" icon={Navigation} style={{ marginTop: 12 }} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.lieu)}`} target="_blank" rel="noreferrer">
              Itinéraire
            </Button>
          </Panel>
        </div>

        <aside className="sticky2" aria-label="Participer">
          <div className="panel">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b style={{ font: '800 24px var(--display)', color: 'var(--navy)' }}>{going}</b>
              <span style={{ color: 'var(--muted)', fontSize: 14 }} aria-live="polite">
                {e.capacite - going} places restantes
              </span>
            </div>
            <ProgressBar value={percent(going, e.capacite)} label={`${going} participants sur ${e.capacite}`} />
            <div style={{ margin: '14px 0' }}>
            <AvatarStack
              people={[
                ['SK', '#d9472b'],
                ['YA', '#1f3a6b'],
                ['MB', '#4f7f42'],
              ]}
              more={going - 3}
              label={`${going} participants`}
            />
            </div>
            {part?.statut === 'acceptee' ? (
              <>
                <Badge tone="ok">✓ Participation acceptée</Badge>
                <div style={{ textAlign: 'center', marginTop: 14 }}>
                  <span className="qr">
                    <QRCodeSVG value={`moubedra:participation:${part.code_qr}`} size={134} fgColor="#1f2c40" title="QR code d’accès à l’événement" />
                  </span>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>Présentez ce QR code à l’accueil.</p>
                </div>
                <Button variant="ghost" size="sm" block icon={CalendarPlus} style={{ marginTop: 12 }} onClick={() => toast('Ajouté à votre agenda')}>
                  Ajouter à l’agenda
                </Button>
              </>
            ) : part?.statut === 'en_attente' ? (
              <>
                <Button block done icon={Check} style={{ height: 52 }} disabled>
                  Demande envoyée
                </Button>
                <p style={{ marginTop: 10 }}>
                  <Badge tone="wait">En attente de validation</Badge>
                </p>
              </>
            ) : (
              <>
                <label className="lbl" htmlFor="ev-motif">
                  Un mot pour l’organisateur (facultatif)
                </label>
                <textarea id="ev-motif" className="inp3" style={{ height: 90 }} placeholder="Ex. : je peux venir avec 2 amis" value={motif} onChange={(x) => setMotif(x.target.value)} />
                <Button ref={btnRef} block icon={CalendarPlus} style={{ marginTop: 12, height: 52 }} loading={sending} loadingText="Envoi…" onClick={join}>
                  Je participe
                </Button>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 10 }}>L’organisateur valide votre demande. Vous recevrez votre QR code d’accès.</p>
              </>
            )}
            {camp && (
              <Link to={`/campagnes/${camp.id}`} className="it link" style={{ borderTop: '1px solid var(--line)', marginTop: 16, paddingTop: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                <img className="thumb" style={{ width: 52, height: 52 }} src={camp.image} alt="" />
                <div className="gw">
                  <small>Lié à la campagne</small>
                  <h4 style={{ fontSize: 14 }}>{camp.titre}</h4>
                </div>
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
