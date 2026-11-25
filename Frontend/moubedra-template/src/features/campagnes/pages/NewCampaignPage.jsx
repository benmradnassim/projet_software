import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CircleCheck, Eye, Package, Plus, Save, Send, ShieldCheck, Trash2, Upload, X } from 'lucide-react';
import { useAuth } from '../../../app/AuthContext';
import { Breadcrumb, Button, Input, Panel, Select, StepsBar, Textarea, confetti, useToast } from '../../../design/components';
import { formatNumber } from '../../../lib/format';
import { getGouvernorats } from '../../auth';
import { PHOTO_TYPES, createCampagne, getCategories, updateCampagne, uploadPhotoCampagne, verifierPhoto } from '../api';
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
  // Photo choisie par l'organisateur : { file, url } (url = aperçu local), envoyée après la création.
  const [photo, setPhoto] = useState(null);
  const [survol, setSurvol] = useState(false);
  const fileRef = useRef(null);

  // Libère l'URL d'aperçu quand la photo change ou que la page se ferme.
  useEffect(() => () => photo && URL.revokeObjectURL(photo.url), [photo]);

  const choisirPhoto = (file) => {
    const err = verifierPhoto(file);
    if (err) {
      toast(err);
      return;
    }
    setPhoto({ file, url: URL.createObjectURL(file) });
  };
  const onDrop = (e) => {
    e.preventDefault();
    setSurvol(false);
    choisirPhoto(e.dataTransfer.files?.[0]);
  };

  const set = (k) => (e) => setD((x) => ({ ...x, [k]: e.target.value }));
  const jours = Math.max(1, Math.round((new Date(d.fin) - new Date(d.debut)) / 864e5));
  const besoins = d.besoins.filter((b) => b[0].trim());

  const preview = {
    id: 'apercu',
    titre: d.titre || 'Titre de votre campagne',
    ville: d.ville,
    categorie: d.categorie,
    image: photo
      ? photo.url
      : d.cover
        ? new URL(`/media/covers/${d.cover}.webp`, window.location.origin).href
        : '',
    montant_collecte: 0,
    objectif_montant: Number(d.objectif) || 0,
    nb_donateurs: 0,
    jours_restants: jours,
    organisation: user.nom_organisation,
    statut: 'brouillon',
  };


  /* ---------- brouillon ----------
   * Dès que l'étape 1 est valide, la campagne est créée en brouillon côté back,
   * puis mise à jour à chaque étape. Si l'organisateur quitte la page (lien du menu,
   * « Mes campagnes »…), les dernières saisies sont enregistrées : il la retrouve dans
   * l'onglet « Brouillons » et la reprend avec « Modifier ».
   */
  const brouillonId = useRef(null);
  const dernierEnvoi = useRef('');
  const termine = useRef(false);

  const construirePayload = (x) => ({
    titre: x.titre.trim(),
    description: x.description.trim(),
    categorie: x.categorie,
    ville: x.ville,
    besoins: x.besoins.filter((b) => b[0].trim()).map((b) => [b[0].trim(), b[1].trim()]),
    point_collecte: x.point.trim(),
    date_debut: x.debut,
    date_fin: x.fin,
    objectif_montant: x.objectif || '0',
    // URL complète de la couverture choisie (remplacée par la photo si elle est envoyée)
    image: x.cover ? new URL(`/media/covers/${x.cover}.webp`, window.location.origin).href : '',
  });

  /** Crée le brouillon au premier appel, puis le met à jour. Renvoie son id. */
  const enregistrerBrouillon = async (x = d) => {
    const payload = construirePayload(x);
    const cle = JSON.stringify(payload);
    if (brouillonId.current && cle === dernierEnvoi.current) return brouillonId.current;
    if (brouillonId.current) {
      await updateCampagne(brouillonId.current, payload);
    } else {
      const creee = await createCampagne(payload);
      brouillonId.current = creee.id;
    }
    dernierEnvoi.current = cle;
    return brouillonId.current;
  };

  // Sauvegarde automatique quand on quitte l'assistant sans le terminer.
  const dRef = useRef(d);
  dRef.current = d;
  useEffect(
    () => () => {
      if (termine.current) return;
      const x = dRef.current;
      if (!x.titre.trim() || !x.description.trim()) return; // rien d'exploitable à garder
      enregistrerBrouillon(x).catch(() => {
        /* saisie incomplète (ex. dates incohérentes) : le dernier brouillon valide est conservé */
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const etapeValide = () => {
    if (st >= 1) {
      if (!d.titre.trim()) {
        setTitleErr('Donnez un titre à votre campagne');
        toast('Donnez un titre à votre campagne');
        if (st === 1) document.getElementById('w-titre')?.focus();
        return false;
      }
      if (!d.description.trim()) {
        toast('Veuillez saisir une description.');
        return false;
      }
    }
    if (st >= 2) {
      if (!d.objectif || Number(d.objectif) <= 0) {
        toast("L'objectif financier doit être supérieur à zéro.");
        return false;
      }
      if (!d.debut || !d.fin || d.fin < d.debut) {
        toast('La date de fin doit être égale ou postérieure à la date de début.');
        return false;
      }
    }
    return true;
  };

  /** Termine : enregistre, envoie la photo éventuelle, puis retourne à « Mes campagnes ». */
  const terminer = async (messageOk) => {
    const id = await enregistrerBrouillon();
    termine.current = true;
    let photoOk = true;
    if (photo) {
      try {
        await uploadPhotoCampagne(id, photo.file);
      } catch (err) {
        photoOk = false;
        toast(`Brouillon enregistré, mais la photo n’a pas été envoyée : ${err.message}`);
      }
    }
    if (photoOk) toast(messageOk);
    return photoOk;
  };

  const next = async () => {
    if (sending || !etapeValide()) return;
    setSending(true);
    try {
      if (st < 4) {
        const premier = !brouillonId.current;
        await enregistrerBrouillon();
        if (premier) toast('Brouillon enregistré : vous pouvez le reprendre plus tard depuis « Mes campagnes ».');
        setSt(st + 1);
        return;
      }
      await terminer('Campagne créée en brouillon avec succès !');
      confetti(sendRef.current);
      setTimeout(() => navigate('/organisateur/campagnes'), 700);
    } catch (err) {
      toast(err.message || 'Impossible d’enregistrer la campagne.');
    } finally {
      setSending(false);
    }
  };

  const enregistrerEtQuitter = async () => {
    if (sending || !etapeValide()) return;
    setSending(true);
    try {
      await terminer('Brouillon enregistré. Retrouvez-le dans l’onglet « Brouillons ».');
      navigate('/organisateur/campagnes');
    } catch (err) {
      toast(err.message || 'Impossible d’enregistrer le brouillon.');
    } finally {
      setSending(false);
    }
  };

  const nav = (
    <div className="row" style={{ marginTop: 22, flexWrap: 'wrap' }}>
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
        loadingText="Enregistrement…"
        icon={st === 4 ? Send : undefined}
        iconRight={st < 4 ? ArrowRight : undefined}
      >
        {st < 4 ? 'Continuer' : 'Créer la campagne'}
      </Button>
      {st < 4 && (
        <Button variant="ghost" icon={Save} style={{ height: 52 }} onClick={enregistrerEtQuitter} disabled={sending}>
          Enregistrer le brouillon
        </Button>
      )}
    </div>
  );

  return (
    <div className="pg">
      <Breadcrumb items={[{ label: 'Mes campagnes', to: '/organisateur/campagnes' }, 'Nouvelle campagne']} />
      <h1 className="sr-only">Nouvelle campagne</h1>
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
                <input
                  ref={fileRef}
                  type="file"
                  accept={PHOTO_TYPES.join(',')}
                  hidden
                  onChange={(e) => {
                    choisirPhoto(e.target.files?.[0]);
                    e.target.value = ''; // permet de rechoisir le même fichier
                  }}
                />
                {photo ? (
                  <div className="photo-choisie">
                    <img src={photo.url} alt="Photo choisie pour la campagne" />
                    <div className="gw">
                      <b>{photo.file.name}</b>
                      <small className="cap4">{photo.file.size < 1024 * 1024 ? `${Math.max(1, Math.round(photo.file.size / 1024))} Ko` : `${(photo.file.size / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`} · envoyée à la création</small>
                    </div>
                    <Button variant="ghost" size="sm" icon={Upload} onClick={() => fileRef.current?.click()}>
                      Changer
                    </Button>
                    <button type="button" className="kob" aria-label="Retirer la photo" onClick={() => setPhoto(null)}>
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`drop${survol ? ' on' : ''}`}
                    onClick={() => fileRef.current?.click()}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setSurvol(true);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) setSurvol(false);
                    }}
                    onDrop={onDrop}
                  >
                    <Upload size={26} aria-hidden="true" />
                    <br />
                    <b style={{ color: 'var(--navy)' }}>{survol ? 'Déposez la photo' : 'Glissez votre photo ici ou cliquez pour choisir'}</b>
                    <br />
                    JPG, PNG ou WebP · 5 Mo max · une vraie photo de votre action donne confiance
                  </button>
                )}
                <span className="lbl" id="cov-lbl" style={{ marginTop: 16 }}>
                  {photo ? 'Ou utilisez plutôt une couverture moubedra' : 'Pas encore de photo ? Utilisez une couverture moubedra'}
                </span>
                <div className="covpick" role="group" aria-labelledby="cov-lbl">
                  {COVERS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={!photo && v === d.cover}
                      aria-label={`Couverture ${v}`}
                      onClick={() => {
                        setPhoto(null);
                        setD((x) => ({ ...x, cover: v, ownCover: true }));
                      }}
                    >
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
                    ['Photo', photo ? photo.file.name : `Couverture moubedra (${d.cover})`],
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
