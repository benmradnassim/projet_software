import { useState } from 'react';
import { BadgeCheck, FileText, Hourglass, Megaphone, Send, Users, Wallet } from 'lucide-react';
import { Badge, Button, Input, PageHeader, Panel, Textarea, useToast } from '../../../design/components';
import { demanderOrganisateur } from '../api';
import '../utilisateurs.css';

const ETAPES = [
  ['Vous envoyez la demande', '2 minutes'],
  ['L’équipe vérifie', 'Sous 48 h, par e-mail'],
  ['Badge « vérifié » activé', 'Votre profil devient organisateur'],
  ['Première campagne en ligne', 'Avec nos conseils'],
];

export default function OrganizerRequestPage() {
  const toast = useToast();
  const [nom, setNom] = useState('');
  const [motif, setMotif] = useState('');
  const [errs, setErrs] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    const e = {};
    if (!nom.trim()) e.nom = 'Entrez le nom de votre structure.';
    if (motif.trim().length < 40) e.motif = 'Présentez votre structure en 40 caractères minimum.';
    setErrs(e);
    if (Object.keys(e).length) {
      toast('Complétez le nom et la présentation (40 caractères min.)');
      document.getElementById(e.nom ? 'o-nom' : 'o-motif')?.focus();
      return;
    }
    setSending(true);
    // TODO(API): POST /api/demandes-organisateur/ — voir features/utilisateurs/api.js (demanderOrganisateur)
    await demanderOrganisateur({ nom_structure: nom, motif });
    setSending(false);
    setSent(true);
  };

  return (
    <div className="pg">
      <PageHeader crumbs={['Compte', 'Devenir organisateur']} title="Lancez vos propres actions" subtitle="Associations et collectifs : collectez des dons et mobilisez des bénévoles." />
      <div className="dg">
        <Panel>
          {sent ? (
            <div className="okbox tabc" aria-live="polite">
              <div className="okc" style={{ background: '#e8963a' }} aria-hidden="true">
                <Hourglass size={42} />
              </div>
              <h2 style={{ fontSize: 26 }}>Demande envoyée</h2>
              <p style={{ color: 'var(--muted)', marginTop: 6 }}>{nom} · examen sous 48 h. En attendant, préparez votre première campagne en brouillon.</p>
              <Button icon={Megaphone} style={{ marginTop: 16 }} onClick={() => toast('Le brouillon sera disponible après validation du badge')}>
                Préparer un brouillon
              </Button>
            </div>
          ) : (
            <>
              <div className="row" style={{ gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                {[
                  [BadgeCheck, 'Badge vérifié'],
                  [Wallet, 'Collecte en ligne'],
                  [Users, 'Bénévoles + QR code'],
                ].map(([IconCmp, l]) => (
                  <div className="perkbox" key={l}>
                    <IconCmp size={18} aria-hidden="true" />
                    {l}
                  </div>
                ))}
              </div>
              <Input id="o-nom" label="Nom de l’association ou du collectif" placeholder="Ex. : Main dans la Main" value={nom} onChange={(e) => setNom(e.target.value)} error={errs.nom} />
              <Textarea
                id="o-motif"
                label="Présentez votre structure et vos actions"
                placeholder="Depuis quand existez-vous, où agissez-vous, combien de bénévoles…"
                maxLength={600}
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                error={errs.motif}
                hint={`${motif.length} / 600 · 40 caractères minimum`}
              />
              {errs.motif && <small className="cap4">{motif.length} / 600 · 40 caractères minimum</small>}
              <span className="lbl">Justificatif (facultatif)</span>
              <button type="button" className="droparea" onClick={() => toast('Envoi de fichier : bientôt disponible')}>
                <FileText size={22} aria-hidden="true" />
                <br />
                Glissez le récépissé ou le JORT (PDF, image)
              </button>
              <Button size="wide" icon={Send} style={{ marginTop: 18, height: 52 }} loading={sending} loadingText="Envoi…" onClick={send}>
                Envoyer ma demande
              </Button>
            </>
          )}
        </Panel>
        <aside className="sticky2">
          <Panel title="Comment ça se passe ?">
            <ol className="tl2">
              {ETAPES.map(([t, d], i) => {
                const done = sent ? i <= 1 : i === 0;
                return (
                  <li key={t} className={done ? undefined : 'fut'}>
                    <b>
                      {t}
                      {sent && i === 1 && (
                        <>
                          {' '}
                          <Badge tone="wait">en cours</Badge>
                        </>
                      )}
                    </b>
                    <small>{d}</small>
                  </li>
                );
              })}
            </ol>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
