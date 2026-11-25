import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Badge, Button, ProgressBar } from "../../../design/components";
import { percent } from "../../../lib/format";

function fmtDate(iso) {
  if (!iso) return "?";
  const d = new Date(iso);
  return d.toLocaleString("fr-TN", { dateStyle: "medium", timeStyle: "short" });
}

export default function EventRow({ evenement: e, currentUser, onEdit, onDelete, onManage, onParticipate }) {
  const isOwner = currentUser && String(e.organisateur) === String(currentUser.id);
  const ma = e.ma_participation;
  const canParticipate = currentUser && !isOwner && ["citoyen", "organisateur"].includes(currentUser.role) && e.statut === "planifie" && !ma;
  const cover = e.image || "/media/covers/cover-community.svg";

  return (
    <article className="panel" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, overflow: "hidden" }}>
      <img src={cover} alt="" loading="lazy" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 12 }} onError={(ev) => { ev.currentTarget.src = "/media/covers/cover-community.svg"; }} />
      <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div>
            <h3 style={{ margin: 0 }}><Link to={`/evenements/${e.id}`}>{e.titre}</Link></h3>
            <div className="meta2" style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "var(--muted)", marginTop: 4 }}>
              <span className="row" style={{ gap: 4 }}><CalendarDays size={14} /> {fmtDate(e.date_evenement)}</span>
              <span className="row" style={{ gap: 4 }}><MapPin size={14} /> {[e.lieu, e.ville].filter(Boolean).join(", ")}</span>
            </div>
          </div>
          <Badge tone={e.statut === "planifie" ? "ok" : e.statut === "complet" ? "warn" : e.statut === "annule" ? "no" : "grey"}>{e.statut}</Badge>
        </div>
        {e.description && <p style={{ margin: 0, color: "var(--muted)" }}>{e.description.length > 160 ? `${e.description.slice(0, 160)}?` : e.description}</p>}
        <div style={{ maxWidth: 320 }}>
          <div className="row" style={{ justifyContent: "space-between", fontSize: 13, color: "var(--muted)" }}>
            <span className="row" style={{ gap: 4 }}><Users size={14} /> {e.nb_participants ?? 0}/{e.capacite}</span>
            {ma && <Badge tone={ma.statut === "acceptee" ? "ok" : ma.statut === "en_attente" ? "wait" : ma.statut === "refusee" ? "no" : "grey"}>Ma demande: {ma.statut}</Badge>}
          </div>
          <ProgressBar value={percent(e.nb_participants ?? 0, e.capacite || 1)} label={`${e.nb_participants ?? 0} participants sur ${e.capacite}`} />
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          <Button size="sm" variant="ghost" to={`/evenements/${e.id}`}>Détails</Button>
          {isOwner && <Button size="sm" variant="ghost" onClick={() => onEdit?.(e)}>Modifier</Button>}
          {isOwner && <Button size="sm" variant="ghost" onClick={() => onDelete?.(e)}>Supprimer</Button>}
          {isOwner && <Button size="sm" variant="navy" onClick={() => onManage?.(e)}>Gérer les participations</Button>}
          {canParticipate && <Button size="sm" onClick={() => onParticipate?.(e)}>Participer</Button>}
        </div>
      </div>
    </article>
  );
}
