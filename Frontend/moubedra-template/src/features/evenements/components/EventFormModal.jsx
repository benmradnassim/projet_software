import { useEffect, useState } from "react";
import { Button, Input, Modal, Select, useToast } from "../../../design/components";

const EMPTY = { titre: "", date: "", heure: "", lieu: "", ville: "", capacite: "", statut: "planifie", description: "", image: null };

export default function EventFormModal({ open, onClose, onSaved, initial }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const d = initial.date_evenement ? new Date(initial.date_evenement) : null;
      const pad = (n) => String(n).padStart(2, "0");
      setForm({
        titre: initial.titre || "",
        date: d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : "",
        heure: d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "",
        lieu: initial.lieu || "",
        ville: initial.ville || "",
        capacite: initial.capacite ?? "",
        statut: initial.statut || "planifie",
        description: initial.description || "",
        image: null,
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [open, initial]);

  const set = (k) => (e) => {
    const value = e?.target?.type === "file" ? e.target.files?.[0] || null : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!form.titre.trim()) errs.titre = "Le titre est requis.";
    if (!form.date) errs.date = "La date est requise.";
    if (!form.heure) errs.heure = "L'heure est requise.";
    if (!form.lieu.trim()) errs.lieu = "Le lieu est requis.";
    const cap = Number(form.capacite);
    if (!Number.isInteger(cap) || cap <= 0) errs.capacite = "La capacité doit être un entier supérieur à 0.";
    if (form.image) {
      if (!String(form.image.type || "").startsWith("image/")) errs.image = "Le fichier doit être une image.";
      if (form.image.size > 5 * 1024 * 1024) errs.image = "La photo ne peut pas dépasser 5 Mo.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("titre", form.titre.trim());
      fd.append("description", form.description || "");
      fd.append("date_evenement", `${form.date}T${form.heure}:00`);
      fd.append("lieu", form.lieu.trim());
      fd.append("ville", form.ville || "");
      fd.append("capacite", String(Number(form.capacite)));
      if (isEdit) fd.append("statut", form.statut);
      if (form.image) fd.append("image", form.image);
      await onSaved(fd, initial?.id);
      onClose();
    } catch (err) {
      toast(err.message || "Impossible d'enregistrer l'événement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title={isEdit ? "Modifier l'événement" : "Créer un événement"}
      width={640}
      actions={(
        <>
          <Button variant="ghost" disabled={saving} onClick={onClose}>Annuler</Button>
          <Button loading={saving} loadingText="Enregistrement…" onClick={submit}>{isEdit ? "Enregistrer" : "Créer"}</Button>
        </>
      )}
    >
      <div style={{ display: "grid", gap: 12 }}>
        <Input label="Titre" value={form.titre} onChange={set("titre")} error={errors.titre} maxLength={200} autoFocus />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Date" type="date" value={form.date} onChange={set("date")} error={errors.date} />
          <Input label="Heure" type="time" value={form.heure} onChange={set("heure")} error={errors.heure} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Lieu" value={form.lieu} onChange={set("lieu")} error={errors.lieu} maxLength={255} />
          <Input label="Ville" value={form.ville} onChange={set("ville")} maxLength={100} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Capacité" type="number" min="1" value={form.capacite} onChange={set("capacite")} error={errors.capacite} />
          {isEdit ? (
            <Select
              label="Statut"
              value={form.statut}
              onChange={set("statut")}
              options={[
                { value: "planifie", label: "Planifié" },
                { value: "complet", label: "Complet" },
                { value: "annule", label: "Annulé" },
                { value: "termine", label: "Terminé" },
              ]}
            />
          ) : <div />}
        </div>
        <div>
          <label className="lbl" htmlFor="event-image">Image</label>
          <input id="event-image" className="inp3" type="file" accept="image/*" onChange={set("image")} />
          {errors.image && <small className="field-err" role="alert">{errors.image}</small>}
        </div>
        <div>
          <label className="lbl" htmlFor="event-description">Description</label>
          <textarea id="event-description" className="inp3" style={{ minHeight: 100 }} value={form.description} onChange={set("description")} />
        </div>
      </div>
    </Modal>
  );
}
