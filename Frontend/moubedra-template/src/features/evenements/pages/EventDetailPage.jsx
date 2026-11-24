import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { BadgeCheck, CalendarPlus, Check, ChevronRight, Clock3, MapPin, Navigation } from 'lucide-react';
import { useAuth } from '../../../app/AuthContext';
import { AvatarStack, Badge, Breadcrumb, Button, Chip, DateBadge, EmptyState, Input, MapPreview, Modal, Panel, ProgressBar, Select, Skeleton, Timeline, confetti, useToast } from '../../../design/components';
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
  const [typeParticipation, setTypeParticipation] = useState('benevole');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [cin, setCin] = useState('');
  const [adresse, setAdresse] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [formOpen, setFormOpen] = useState(false);
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
    setFormOpen(true);
  };

  const submitParticipation = async () => {
    const errors = {};
    if (nom.trim().length < 2) errors.nom = 'Saisissez votre nom.';
    if (prenom.trim().length < 2) errors.prenom = 'Saisissez votre prénom.';
    {
      const phoneDigits = telephone.trim().replace(/\D/g, '');
      if (!(phoneDigits.length === 8 || (phoneDigits.startsWith('216') && phoneDigits.length === 11))) {
        errors.telephone = 'Saisissez 8 chiffres, avec +216 facultatif.';
      }
    }
    if (!/^\d{8}$/.test(cin.trim())) errors.cin = 'Le CIN doit contenir exactement 8 chiffres.';
    if (adresse.trim().length < 5) errors.adresse = 'Saisissez une adresse complète.';
    if (motif.trim().length < 10) errors.motif = 'Le motif doit contenir au moins 10 caractères.';
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setSending(true);
    try {
      const p = await demanderParticipation(id, {
        type: typeParticipation,
        motif: motif.trim(),
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone.trim(),
        cin: cin.trim(),
        adresse: adresse.trim(),
      });
      setPart(p);
      setExtra(1);
      setFormOpen(false);
      confetti(btnRef.current);
      toast('Demande envoyée. Vous serez notifié·e de la réponse.');
    } catch (error) {
      toast(error.message || 'Impossible d’envoyer la demande.');
    } finally {
      setSending(false);
    }
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
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Participer à l’événement"
        width={520}
        actions={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button icon={CalendarPlus} loading={sending} loadingText="Envoi…" onClick={submitParticipation}>
              Envoyer ma demande
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--muted)', marginTop: 4 }}>{e.titre}</p>
        <div style={{ marginTop: 16 }}>
          <Select
            label="Type de participation"
            value={typeParticipation}
            onChange={(event) => setTypeParticipation(event.target.value)}
            options={[
              { value: 'benevole', label: 'Bénévole' },
              { value: 'accompagnement', label: 'Accompagnement' },
              { value: 'autre', label: 'Autre' },
            ]}
          />
        </div>
        <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <Input
            label="Nom"
            value={nom}
            onChange={(event) => setNom(event.target.value)}
            error={formErrors.nom}
            maxLength={100}
            autoFocus
          />
          <Input
            label="Prénom"
            value={prenom}
            onChange={(event) => setPrenom(event.target.value)}
            error={formErrors.prenom}
            maxLength={100}
          />
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
          <Input
            label="Adresse"
            value={adresse}
            onChange={(event) => setAdresse(event.target.value)}
            error={formErrors.adresse}
            maxLength={255}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label className="lbl" htmlFor="ev-motif">
            Motif de participation
          </label>
          <textarea
            id="ev-motif"
            className={`inp3${formErrors.motif ? ' bad' : ''}`}
            style={{ height: 90 }}
            placeholder="Expliquez brièvement comment vous souhaitez participer"
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
