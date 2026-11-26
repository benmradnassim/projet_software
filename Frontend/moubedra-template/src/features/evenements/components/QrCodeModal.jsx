import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button, Modal, useToast } from "../../../design/components";
import { getParticipationQrCode } from "../api";

export default function QrCodeModal({ open, onClose, participationId }) {
  const toast = useToast();
  const canvasWrapRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !participationId) return;
    let alive = true;
    setLoading(true);
    setData(null);
    getParticipationQrCode(participationId)
      .then((res) => { if (alive) setData(res); })
      .catch((err) => { if (alive) toast(err.message || "Impossible de charger le QR code."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [open, participationId]);

  const getDataUrl = () => canvasWrapRef.current?.querySelector("canvas")?.toDataURL("image/png") || "";

  const copyCode = async () => {
    if (!data?.code_qr) return;
    try { await navigator.clipboard.writeText(String(data.code_qr)); toast("Code copi?."); }
    catch { toast("Impossible de copier le code."); }
  };

  const download = () => {
    const url = getDataUrl();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-participation-${participationId}.png`;
    a.click();
  };

  return (
    <Modal open={open} onClose={onClose} title="QR code de participation" width={520}
      actions={<><Button variant="ghost" onClick={copyCode} disabled={!data}>Copier</Button><Button onClick={download} disabled={!data}>Télécharger</Button></>}>
      {loading && <p>Chargement?</p>}
      {data && (
        <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
          <div ref={canvasWrapRef} style={{ background: "#fff", padding: 12, borderRadius: 12 }}>
            <QRCodeCanvas value={String(data.code_qr)} size={220} includeMargin />
          </div>
          <div style={{ width: "100%", fontSize: 14 }}>
            <p><strong>Événement :</strong> {data.evenement}</p>
            <p><strong>Date :</strong> {data.date_evenement ? new Date(data.date_evenement).toLocaleString("fr-TN") : "?"}</p>
            <p><strong>Lieu :</strong> {data.lieu || "?"}</p>
            <p><strong>Participant :</strong> {data.participant || "?"}</p>
            <p style={{ wordBreak: "break-all" }}><strong>Code :</strong> {String(data.code_qr)}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
