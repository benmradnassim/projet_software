import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Compass, Plus } from "lucide-react";
import { useAuth } from "../../../app/AuthContext";
import { Button, EmptyState, Input, PageHeader, Select, SkeletonList, useToast } from "../../../design/components";
import { IS_DEMO } from "../../../lib/api";
import { createEvenement, createParticipation, deleteEvenement, listEvenements, listParticipations, updateEvenement } from "../api";
import ParticipationFormModal from "../components/ParticipationFormModal";
import EventFormModal from "../components/EventFormModal";
import EventRow from "../components/EventRow";
import "../evenements.css";

export default function MyEventsPage() {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState("created"); // created | discover
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("");
  const [events, setEvents] = useState([]);
  const [myParticipations, setMyParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statut) params.statut = statut;
      const [evs, parts] = await Promise.all([
        listEvenements(params),
        isAuthenticated ? listParticipations() : Promise.resolve([]),
      ]);
      setEvents(Array.isArray(evs) ? evs : []);
      setMyParticipations(Array.isArray(parts) ? parts : []);
    } catch (err) {
      toast(err.message || "Impossible de charger les événements.");
    } finally {
      setLoading(false);
    }
  }, [search, statut, isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  const createdEvents = useMemo(
    () => events.filter((e) => String(e.organisateur) === String(user?.id)),
    [events, user]
  );
  const otherEvents = useMemo(
    () => events.filter((e) => String(e.organisateur) !== String(user?.id)),
    [events, user]
  );

  const visible = tab === "created" ? createdEvents : otherEvents;

  const onSaved = async (formData, id) => {
    try {
      if (id) await updateEvenement(id, formData);
      else await createEvenement(formData);
      toast(id ? "Événement mis à jour." : "Événement créé.");
      await load();
    } catch (err) {
      throw err;
    }
  };

  const onDelete = async (event) => {
    if (!window.confirm(`Supprimer  ${event.titre}  ?`)) return;
    try {
      await deleteEvenement(event.id);
      toast("Événement supprimé.");
      await load();
    } catch (err) {
      toast(err.message || "Suppression impossible.");
    }
  };

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

  const onParticipate = (event) => {
    if (!isAuthenticated) { toast("Connectez-vous pour participer."); return; }
    setParticiper(event);
  };

  const onManage = (event) => { window.location.href = `/organisateur/demandes?evenement=${event.id}`; };

  return (
    <div className="pg">
      <PageHeader
        crumbs={["Mes actions", "Événements"]}
        title="Événements"
        subtitle="Gérez vos événements et découvrez ceux de la communauté."
        actions={tab === "created" ? <Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>Créer un événement</Button> : null}
      />

      {IS_DEMO && <div className="panel" style={{ marginBottom: 16, borderLeft: "4px solid var(--orange, #e67e22)" }}>Mode démo : les actions sont locales et ne sont pas enregistrées sur le serveur.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setTab("created")}
          className="panel"
          style={{
            textAlign: "left", cursor: "pointer", padding: 18, border: tab === "created" ? "2px solid var(--navy, #1f3a5f)" : "1px solid var(--border, #e5e7eb)",
            background: tab === "created" ? "var(--surface, #fff)" : "var(--bg, #fafafa)", boxShadow: tab === "created" ? "0 4px 14px rgba(0,0,0,0.06)" : "none"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, fontWeight: 700, color: "var(--navy, #1f3a5f)" }}>
            <CalendarDays size={18} /> Mes événements créés
          </div>
          <div style={{ color: "var(--muted, #6b7280)", fontSize: 14 }}>Consultez, modifiez, supprimez ou ajoutez vos événements.</div>
        </button>
        <button
          type="button"
          onClick={() => setTab("discover")}
          className="panel"
          style={{
            textAlign: "left", cursor: "pointer", padding: 18, border: tab === "discover" ? "2px solid var(--navy, #1f3a5f)" : "1px solid var(--border, #e5e7eb)",
            background: tab === "discover" ? "var(--surface, #fff)" : "var(--bg, #fafafa)", boxShadow: tab === "discover" ? "0 4px 14px rgba(0,0,0,0.06)" : "none"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, fontWeight: 700, color: "var(--navy, #1f3a5f)" }}>
            <Compass size={18} /> Découvrir d'autres événements
          </div>
          <div style={{ color: "var(--muted, #6b7280)", fontSize: 14 }}>Explorez les événements des autres organisateurs et participez.</div>
        </button>
      </div>

      <div className="row" style={{ gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <Input label="Recherche" hideLabel placeholder="Rechercher un événement..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ width: 220 }}>
          <Select label="Statut" hideLabel value={statut} onChange={(e) => setStatut(e.target.value)} options={[
            { value: "", label: "Tous les statuts" },
            { value: "planifie", label: "Planifié" },
            { value: "complet", label: "Complet" },
            { value: "annule", label: "Annulé" },
            { value: "termine", label: "Terminé" },
          ]} />
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {loading ? <div className="panel"><SkeletonList /></div>
          : visible.length ? visible.map((e) => (
            <EventRow
              key={e.id}
              evenement={e}
              currentUser={user}
              onEdit={(ev) => { setEditing(ev); setModalOpen(true); }}
              onDelete={onDelete}
              onManage={onManage}
              onParticipate={onParticipate}
            />
          ))
          : <EmptyState
              title={tab === "created" ? "Aucun événement créé" : "Aucun autre événement"}
              text={tab === "created" ? "Créez votre premier événement pour sensibiliser la communauté." : "Aucun événement d'autres organisateurs ne correspond à ces critères."}
              action={tab === "created" ? <Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>Créer un événement</Button> : null}
            />}
      </div>

      <EventFormModal open={modalOpen} onClose={() => setModalOpen(false)} initial={editing} onSaved={onSaved} />
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
