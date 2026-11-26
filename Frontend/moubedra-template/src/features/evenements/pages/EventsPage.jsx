import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../../../app/AuthContext";
import { Button, EmptyState, Input, PageHeader, Select, SkeletonList, useToast } from "../../../design/components";
import { IS_DEMO } from "../../../lib/api";
import { createEvenement, createParticipation, deleteEvenement, listEvenements, listParticipations, updateEvenement } from "../api";
import ParticipationFormModal from "../components/ParticipationFormModal";
import EventFormModal from "../components/EventFormModal";
import EventRow from "../components/EventRow";
import "../evenements.css";

export default function EventsPage() {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const role = user?.role;
  const isOrganizer = role === "organisateur";
  const [tab, setTab] = useState("discover"); // discover | created | participated
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

  const createdEvents = useMemo(() => events.filter((e) => String(e.organisateur) === String(user?.id)), [events, user]);
  const myPartEventIds = useMemo(() => new Set(myParticipations.map((p) => String(p.evenement))), [myParticipations]);
  const participatedEvents = useMemo(() => events.filter((e) => myPartEventIds.has(String(e.id))), [events, myPartEventIds]);
  const discoverEvents = useMemo(() => {
    if (!isOrganizer) return events;
    return events.filter((e) => String(e.organisateur) !== String(user?.id));
  }, [events, isOrganizer, user]);

  const visible = useMemo(() => {
    if (tab === "created") return createdEvents;
    if (tab === "participated") return participatedEvents;
    return discoverEvents;
  }, [tab, createdEvents, participatedEvents, discoverEvents]);

  const onSaved = async (formData, id) => {
    if (id) await updateEvenement(id, formData);
    else await createEvenement(formData);
    toast(id ? "Événement mis à jour." : "Événement créé.");
    await load();
  };

  const onDelete = async (event) => {
    if (!window.confirm(`Supprimer  ${event.titre}  ?`)) return;
    try { await deleteEvenement(event.id); toast("Événement supprimé."); await load(); }
    catch (err) { toast(err.message || "Suppression impossible."); }
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

  const showCreate = isOrganizer;

  return (
    <div className="pg">
      <PageHeader
        crumbs={["Agir", "Événements"]}
        title="Événements"
        subtitle={isOrganizer
           ? "Gérez vos événements et découvrez ceux des autres organisateurs."
          : "Découvrez les événements solidaires et participez."}
        actions={showCreate ? <Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>Créer un événement</Button> : null}
      />

      {IS_DEMO && <div className="panel" style={{ marginBottom: 16, borderLeft: "4px solid var(--orange, #e67e22)" }}>Mode démo : les actions sont locales et ne sont pas enregistrées sur le serveur.</div>}

      <div className="row" style={{ gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {isOrganizer ? (
          <>
            <Button variant={tab === "created" ? "navy" : "ghost"} size="sm" onClick={() => setTab("created")}>Mes événements</Button>
            <Button variant={tab === "discover" || tab === "participated" ? "navy" : "ghost"} size="sm" onClick={() => setTab("discover")}>Événements</Button>
          </>
        ) : (
          <>
            <Button variant={tab === "discover" ? "navy" : "ghost"} size="sm" onClick={() => setTab("discover")}>Découvrir</Button>
            {isAuthenticated && <Button variant={tab === "participated" ? "navy" : "ghost"} size="sm" onClick={() => setTab("participated")}>Mes événements</Button>}
          </>
        )}
      </div>

      {isOrganizer && (tab === "discover" || tab === "participated") && (
        <div className="row" style={{ gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Button variant={tab === "discover" ? "navy" : "ghost"} size="sm" onClick={() => setTab("discover")}>Découvrir</Button>
          <Button variant={tab === "participated" ? "navy" : "ghost"} size="sm" onClick={() => setTab("participated")}>Événements participés</Button>
        </div>
      )}

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

      {tab === "participated" && <div className="muted" style={{ marginBottom: 12 }}>Événements auxquels vous avez participé ou pour lesquels votre demande est en attente.</div>}

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
          : <EmptyState title="Aucun événement" text={tab === "participated" ? "Vous n'avez pas encore participé à un événement." : "Aucun événement ne correspond à ces critères."} />}
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
