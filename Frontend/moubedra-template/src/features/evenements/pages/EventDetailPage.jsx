import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { useAuth } from "../../../app/AuthContext";
import { Badge, Breadcrumb, Button, EmptyState, Modal, PageHeader, Panel, ProgressBar, Skeleton, useToast } from "../../../design/components";
import { percent } from "../../../lib/format";
import { cancelParticipation, createParticipation, getEvenement, listParticipations } from "../api";
import ParticipationFormModal from "../components/ParticipationFormModal";
import QrCodeModal from "../components/QrCodeModal";
import "../evenements.css";

function fmtDate(iso) {
  if (!iso) return "?";
  return new Date(iso).toLocaleString("fr-TN", { dateStyle: "full", timeStyle: "short" });
}

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [parts, setParts] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const e = await getEvenement(id);
      setEvent(e);
    } catch (err) {
      toast(err.message || "Impossible de charger l'événement.");
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const ma = event?.ma_participation;
  const isOwner = user && String(event?.organisateur) === String(user.id);
  const canParticipate = isAuthenticated && !isOwner && ["citoyen", "organisateur"].includes(user?.role) && event?.statut === "planifie" && !ma;

  // Formulaire de participation (coordonnées exigées par le back).
  const [participer, setParticiper] = useState(null);
  const envoyerParticipation = async (payload) => {
    try {
      await createParticipation({ ...payload, evenement: Number(participer.id) });
    } catch (err) {
      toast(err.message || "Impossible d'envoyer la demande.");
      throw err;
    }
    setParticiper(null);
    toast("Demande de participation envoyée. Vous serez notifié·e de la réponse.");
    await load();
  };

  const onParticipate = () => {
    if (!isAuthenticated) { navigate("/connexion"); return; }
    setParticiper(event);
  };

  const onCancel = async () => {
    if (!ma?.id) return;
    setActing(true);
    try {
      await cancelParticipation(ma.id);
      toast("Participation annulée.");
      await load();
    } catch (err) { toast(err.message || "Impossible d'annuler."); }
    finally { setActing(false); }
  };

  const loadManage = async () => {
    try {
      const rows = await listParticipations({ evenement: id });
      setParts(Array.isArray(rows) ? rows : []);
      setManageOpen(true);
    } catch (err) { toast(err.message || "Impossible de charger les participations."); }
  };

  if (loading) return <div className="pg"><Skeleton height={320} radius={20} /></div>;
  if (!event) return <div className="pg"><EmptyState title="événement introuvable" actions={<Button to="/evenements" size="sm">Retour aux événements</Button>} /></div>;

  const cover = event.image || "/media/covers/cover-community.svg";
  return (
    <div className="pg">
      <Breadcrumb items={[{ label: "Événements", to: "/evenements" }, event.titre]} />
      <div className="dg">
        <div>
          <div style={{ borderRadius: 20, overflow: "hidden", height: 320 }}>
            <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.currentTarget.src = "/media/covers/cover-community.svg"; }} />
          </div>
          <PageHeader title={event.titre} subtitle={event.organisateur_nom || ""} />
          <div className="row" style={{ gap: 16, flexWrap: "wrap", color: "var(--muted)", marginBottom: 16 }}>
            <span className="row" style={{ gap: 6 }}><CalendarDays size={16} /> {fmtDate(event.date_evenement)}</span>
            <span className="row" style={{ gap: 6 }}><MapPin size={16} /> {[event.lieu, event.ville].filter(Boolean).join(", ")}</span>
            <span className="row" style={{ gap: 6 }}><Users size={16} /> {event.nb_participants ?? 0}/{event.capacite}</span>
            <Badge tone={event.statut === "planifie" ? "ok" : "grey"}>{event.statut}</Badge>
          </div>
          <Panel title="Description"><p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{event.description || "Aucune description."}</p></Panel>
        </div>

        <aside>
          <Panel title="Participation">
            <ProgressBar value={percent(event.nb_participants ?? 0, event.capacite || 1)} label={`${event.nb_participants ?? 0} sur ${event.capacite}`} />
            <p style={{ color: "var(--muted)", marginTop: 8 }}>{Math.max((event.capacite || 0) - (event.nb_participants ?? 0), 0)} places restantes</p>

            {ma?.statut === "acceptee" && (
              <div style={{ display: "grid", gap: 8 }}>
                <Badge tone="ok">Participation acceptée</Badge>
                <Button onClick={() => setQrOpen(true)}>Voir mon QR code</Button>
              </div>
            )}
            {ma?.statut === "en_attente" && (
              <div style={{ display: "grid", gap: 8 }}>
                <Badge tone="wait">Demande en attente</Badge>
                <Button variant="ghost" loading={acting} onClick={onCancel}>Annuler ma demande</Button>
              </div>
            )}
            {ma?.statut === "refusee" && <Button disabled variant="ghost">Demande refusée</Button>}
            {ma?.statut === "annulee" && <Button disabled variant="ghost">Demande annulée</Button>}
            {canParticipate && <Button loading={acting} loadingText="Envoi?" onClick={onParticipate}>Participer</Button>}

            {isOwner && (
              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                <Button variant="navy" onClick={loadManage}>Gérer les participations</Button>
                <Button variant="ghost" to={`/organisateur/demandes?evenement=${event.id}`}>Ouvrir la gestion</Button>
              </div>
            )}
          </Panel>
        </aside>
      </div>

      <QrCodeModal open={qrOpen} onClose={() => setQrOpen(false)} participationId={ma?.id} />

      <Modal open={manageOpen} onClose={() => setManageOpen(false)} title="Participations" width={720}>
        {parts.length ? (
          <ul className="list">
            {parts.map((p) => (
              <li key={p.id} className="it">
                <div className="gw">
                  <b>{p.utilisateur_nom || `Utilisateur #${p.utilisateur}`}</b>
                  <small style={{ display: "block", color: "var(--muted)" }}>{p.type}  {p.statut}</small>
                </div>
                <Badge tone={p.statut === "acceptee" ? "ok" : p.statut === "en_attente" ? "wait" : p.statut === "refusee" ? "no" : "grey"}>{p.statut}</Badge>
              </li>
            ))}
          </ul>
        ) : <p>Aucune participation.</p>}
      </Modal>
      <ParticipationFormModal
        open={!!participer}
        onClose={() => setParticiper(null)}
        titre="Participer à l’événement"
        sousTitre={participer?.titre}
        onSubmit={envoyerParticipation}
      />
    </div>
  );
}
