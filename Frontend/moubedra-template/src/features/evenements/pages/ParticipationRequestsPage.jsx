import { useEffect, useMemo, useState } from "react";
import { Check, QrCode, X } from "lucide-react";
import { Badge, Button, EmptyState, Input, PageHeader, Panel, SkeletonList, useToast } from "../../../design/components";
import { useApi } from "../../../lib/useApi";
import { api, unwrapList } from "../../../lib/api";
import { listParticipations, traiterParticipation, verifyParticipationQr } from "../api";
import "../evenements.css";

export default function ParticipationRequestsPage() {
  const toast = useToast();
  const params = new URLSearchParams(window.location.search);
  const eventFilter = params.get("evenement") || "";
  const [eventId, setEventId] = useState(eventFilter);
  const [qrCode, setQrCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [processing, setProcessing] = useState({});
  const { data: rows, loading, error, reload, setData } = useApi(
    () => listParticipations(eventFilter ? { evenement: eventFilter } : {}),
    [eventFilter],
    [],
  );

  useEffect(() => { setEventId(eventFilter); }, [eventFilter]);

  const pending = useMemo(() => (rows || []).filter((r) => r.statut === "en_attente"), [rows]);
  const visible = rows || [];

  const decide = async (p, action) => {
    setProcessing((s) => ({ ...s, [p.id]: true }));
    try {
      const updated = await traiterParticipation(p.id, action);
      setData((items) => items.map((it) => (it.id === p.id ? { ...it, ...updated } : it)));
      toast(action === "accepter" ? "Participation acceptée." : "Participation refusée.");
    } catch (err) {
      toast(err.message || "Impossible de traiter la demande.");
    } finally {
      setProcessing((s) => ({ ...s, [p.id]: false }));
    }
  };

  const onVerify = async () => {
    if (!qrCode.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await verifyParticipationQr(qrCode.trim());
      if (res?.valide && eventFilter && String(res.participation?.evenement) !== String(eventFilter)) {
        setVerifyResult({ valide: false, detail: "Ce QR code appartient à un autre événement." });
        return;
      }
      setVerifyResult(res);
      if (res?.valide) toast(res.message || "Présence confirmée.");
    } catch (err) {
      setVerifyResult({ valide: false, detail: err.message || "Vérification impossible." });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="pg">
      <PageHeader
        crumbs={["Mes actions", "Demandes de participation"]}
        title="Gérer les participations"
        subtitle="Acceptez, refusez les demandes et vérifiez les QR codes."
      />

      <Panel title="Vérifier un QR code">
        <div className="row" style={{ gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <Input label="Code QR" value={qrCode} onChange={(e) => setQrCode(e.target.value)} placeholder="Coller le code QR" />
          </div>
          <Button icon={QrCode} loading={verifying} onClick={onVerify}>Vérifier</Button>
        </div>
        {verifyResult && (
          <div style={{ marginTop: 12 }}>
            <Badge tone={verifyResult.valide ? "ok" : "no"}>{verifyResult.valide ? "Valide" : "Invalide"}</Badge>
            <p style={{ marginTop: 8 }}>{verifyResult.message || verifyResult.detail}</p>
          </div>
        )}
      </Panel>

      <Panel title={eventFilter ? `Demandes pour l'événement #${eventFilter}` : "Demandes reçues"}>
        {loading ? <SkeletonList /> : error ? <EmptyState title="Erreur" text={error.message || "Impossible de charger."} /> : visible.length ? (
          <ul className="list">
            {visible.map((p) => (
              <li key={p.id} className="it">
                <div className="gw">
                  <b>{p.utilisateur_nom || `Utilisateur #${p.utilisateur}`}</b>
                  <small style={{ display: "block", color: "var(--muted)" }}>{p.evenement_titre || `Événement #${p.evenement}`} · {p.type || "benevole"}</small>
                  {p.motif && <small style={{ display: "block", color: "var(--muted)" }}>{p.motif}</small>}
                </div>
                <Badge tone={p.statut === "acceptee" ? "ok" : p.statut === "en_attente" ? "wait" : p.statut === "refusee" ? "no" : "grey"}>{p.statut}</Badge>
                {p.statut === "en_attente" && (
                  <div className="row" style={{ gap: 8 }}>
                    <button type="button" className="okb" aria-label="Accepter" disabled={processing[p.id]} onClick={() => decide(p, "accepter")}><Check size={16} /></button>
                    <button type="button" className="kob" aria-label="Refuser" disabled={processing[p.id]} onClick={() => decide(p, "refuser")}><X size={16} /></button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : <EmptyState title="Aucune demande" text="Aucune participation ? afficher." />}
      </Panel>
    </div>
  );
}
