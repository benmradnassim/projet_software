import { useCallback, useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { Badge, Button, EmptyState, PageHeader, Panel, SkeletonList, useToast } from "../../../design/components";
import { cancelParticipation, getEvenement, listParticipations } from "../api";
import QrCodeModal from "../components/QrCodeModal";
import "../evenements.css";

export default function MyParticipationsPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrId, setQrId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const parts = await listParticipations();
      const enriched = await Promise.all((Array.isArray(parts) ? parts : []).map(async (p) => {
        try {
          const ev = p.evenement_titre ? null : await getEvenement(p.evenement);
          return { ...p, evenement_detail: ev || { id: p.evenement, titre: p.evenement_titre, date_evenement: p.evenement_date, lieu: p.evenement_lieu } };
        } catch { return { ...p, evenement_detail: { id: p.evenement, titre: p.evenement_titre || `Événement #${p.evenement}` } }; }
      }));
      setRows(enriched);
    } catch (err) { toast(err.message || "Impossible de charger vos participations."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onCancel = async (p) => {
    try { await cancelParticipation(p.id); toast("Demande annulée."); await load(); }
    catch (err) { toast(err.message || "Impossible d'annuler."); }
  };

  return (
    <div className="pg">
      <PageHeader crumbs={["Agir", "Mes participations"]} title="Mes participations" subtitle="Suivez vos demandes de participation aux événements." />
      <Panel>
        {loading ? <SkeletonList /> : rows.length ? (
          <ul className="list">
            {rows.map((p) => {
              const e = p.evenement_detail || {};
              return (
                <li key={p.id} className="it">
                  <div className="gw">
                    <h4>{e.titre}</h4>
                    <small style={{ color: "var(--muted)" }}>{e.date_evenement ? new Date(e.date_evenement).toLocaleString("fr-TN") : ""} {e.lieu ? ` ${e.lieu}` : ""}</small>
                  </div>
                  <Badge tone={p.statut === "acceptee" ? "ok" : p.statut === "en_attente" ? "wait" : p.statut === "refusee" ? "no" : "grey"}>{p.statut}</Badge>
                  {p.statut === "en_attente" && <Button variant="ghost" size="sm" onClick={() => onCancel(p)}>Annuler</Button>}
                  {p.statut === "acceptee" && <Button variant="navy" size="sm" icon={QrCode} onClick={() => setQrId(p.id)}>QR code</Button>}
                </li>
              );
            })}
          </ul>
        ) : <EmptyState title="Aucune participation" text="Vous n'avez pas encore de participation." actions={<Button to="/evenements" size="sm">Voir les événements</Button>} />}
      </Panel>
      <QrCodeModal open={!!qrId} onClose={() => setQrId(null)} participationId={qrId} />
    </div>
  );
}
