import { api, IS_DEMO, unwrapList } from "../../lib/api";
import { ago } from "../../lib/mock";
import { listDemandesRecuesCampagnes, traiterParticipationCampagne } from "../campagnes";
import { DEMANDES_RECUES, EVENEMENTS, MES_PARTICIPATIONS } from "./mockData";

/* ---------- données de démo (VITE_DEMO=true) ---------- */
const DEMO_USER = 1; // Nour Saada dans les données fictives
const COORDS_DEMO = { telephone: "+216 22 333 444", cin: "12345678", adresse: "12 rue Habib Bourguiba, Tunis" };
const avecTitre = (p) => {
  const e = EVENEMENTS.find((x) => x.id === p.evenement);
  return { ...p, evenement_titre: e?.titre, evenement_date: e?.date_evenement, evenement_lieu: e?.lieu };
};
let demoEvents = EVENEMENTS.map((e) => ({ ...e, ma_participation: null }));
let demoParticipations = [
  ...MES_PARTICIPATIONS.map((p) => avecTitre({ ...p, utilisateur_nom: "Nour Saada", prenom: "Nour", nom: "Saada", ...COORDS_DEMO })),
  ...DEMANDES_RECUES.map((p, i) => {
    const [prenom, ...nom] = p.utilisateur_nom.split(" ");
    return avecTitre({ ...p, utilisateur: 100 + i, prenom, nom: nom.join(" "), date_demande: ago({ h: i + 1 }), motif: p.motif.replace(/[«»]/g, "").trim(), type: "benevole", code_qr: null, ...COORDS_DEMO });
  }),
];
let demoNextEventId = 1000;
let demoNextPartId = 5000;

function nowIso() { return new Date().toISOString(); }

function demoEventDetail(id) {
  return demoEvents.find((e) => e.id === Number(id)) || null;
}

function withDemoParticipation(event) {
  // ma_participation is injected by caller context when needed
  return event;
}

export async function listEvenements(params = {}) {
  if (IS_DEMO) {
    let list = [...demoEvents];
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((e) => [e.titre, e.description, e.lieu, e.ville].some((v) => (v || "").toLowerCase().includes(q)));
    }
    if (params.statut) list = list.filter((e) => e.statut === params.statut);
    return list;
  }
  const data = await api.get("/evenements/", { params });
  return unwrapList(data);
}

export async function getEvenement(id) {
  if (IS_DEMO) return demoEventDetail(id);
  return api.get(`/evenements/${id}/`);
}

export async function createEvenement(formData) {
  if (IS_DEMO) {
    const obj = Object.fromEntries(formData.entries());
    const event = {
      id: demoNextEventId++,
      organisateur: obj.organisateur || null,
      organisateur_nom: obj.organisateur_nom || "Organisateur démo",
      campagne: obj.campagne || null,
      campagne_titre: null,
      titre: obj.titre || "",
      description: obj.description || "",
      date_evenement: obj.date_evenement,
      lieu: obj.lieu || "",
      ville: obj.ville || "",
      capacite: Number(obj.capacite || 0),
      image: obj.image instanceof File ? URL.createObjectURL(obj.image) : "",
      statut: "planifie",
      nb_participants: 0,
      ma_participation: null,
    };
    demoEvents = [event, ...demoEvents];
    return event;
  }
  return api.post("/evenements/", formData);
}

export async function updateEvenement(id, formData) {
  if (IS_DEMO) {
    demoEvents = demoEvents.map((e) => {
      if (e.id !== Number(id)) return e;
      const obj = Object.fromEntries(formData.entries());
      return {
        ...e,
        ...obj,
        capacite: obj.capacite ? Number(obj.capacite) : e.capacite,
        image: obj.image instanceof File ? URL.createObjectURL(obj.image) : e.image,
      };
    });
    return demoEventDetail(id);
  }
  return api.patch(`/evenements/${id}/`, formData);
}

export async function deleteEvenement(id) {
  if (IS_DEMO) {
    demoEvents = demoEvents.filter((e) => e.id !== Number(id));
    demoParticipations = demoParticipations.filter((p) => p.evenement !== Number(id));
    return null;
  }
  return api.delete(`/evenements/${id}/`);
}

export async function listParticipations(params = {}) {
  if (IS_DEMO) {
    let list = [...demoParticipations];
    if (params.evenement) list = list.filter((p) => p.evenement === Number(params.evenement));
    if (params.statut) list = list.filter((p) => p.statut === params.statut);
    return list;
  }
  const data = await api.get("/participations/evenements/", { params });
  return unwrapList(data);
}

export async function getParticipation(id) {
  if (IS_DEMO) return demoParticipations.find((p) => p.id === Number(id)) || null;
  return api.get(`/participations/evenements/${id}/`);
}

export async function createParticipation(payload) {
  if (IS_DEMO) {
    const event = demoEventDetail(payload.evenement);
    if (!event) throw new Error("événement introuvable.");
    const p = {
      id: demoNextPartId++,
      utilisateur: 1,
      utilisateur_nom: "Utilisateur démo",
      evenement: Number(payload.evenement),
      evenement_titre: event.titre,
      evenement_date: event.date_evenement,
      evenement_lieu: event.lieu,
      date_demande: nowIso(),
      type: payload.type || "benevole",
      motif: payload.motif || "",
      nom: payload.nom || "",
      prenom: payload.prenom || "",
      telephone: payload.telephone || "",
      cin: payload.cin || "",
      adresse: payload.adresse || "",
      statut: "en_attente",
      code_qr: null,
    };
    demoParticipations = [p, ...demoParticipations];
    return p;
  }
  return api.post("/participations/evenements/", payload);
}

export async function cancelParticipation(id) {
  if (IS_DEMO) {
    demoParticipations = demoParticipations.map((p) => (p.id === Number(id) ? { ...p, statut: "annulee" } : p));
    return demoParticipations.find((p) => p.id === Number(id));
  }
  return api.delete(`/participations/evenements/${id}/`);
}

export async function traiterParticipation(id, action) {
  if (IS_DEMO) {
    demoParticipations = demoParticipations.map((p) => {
      if (p.id !== Number(id)) return p;
      if (action === "accepter") return { ...p, statut: "acceptee", code_qr: p.code_qr || crypto.randomUUID() };
      return { ...p, statut: "refusee" };
    });
    const p = demoParticipations.find((x) => x.id === Number(id));
    if (p && p.statut === "acceptee") {
      demoEvents = demoEvents.map((e) => e.id === p.evenement ? { ...e, nb_participants: (e.nb_participants || 0) + 1 } : e);
    }
    return p;
  }
  return api.post(`/participations/evenements/${id}/traiter/`, { action });
}

export async function getParticipationQrCode(id) {
  if (IS_DEMO) {
    const p = demoParticipations.find((x) => x.id === Number(id));
    if (!p || p.statut !== "acceptee") throw new Error("QR code indisponible.");
    const e = demoEventDetail(p.evenement);
    return { code_qr: p.code_qr, evenement: e?.titre, date_evenement: e?.date_evenement, lieu: e?.lieu, participant: p.utilisateur_nom };
  }
  return api.get(`/participations/evenements/${id}/qr_code/`);
}

export async function verifyParticipationQr(code_qr) {
  if (IS_DEMO) {
    const p = demoParticipations.find((x) => String(x.code_qr) === String(code_qr));
    if (!p) return { valide: false, detail: "Code QR introuvable." };
    return { valide: true, participation: p, message: `Présence confirmée pour ${p.utilisateur_nom}` };
  }
  return api.post("/participations/evenements/verify-qr/", { code_qr });
}

export function resetDemoEvents() {
  demoEvents = [];
  demoParticipations = [];
}

/* ---------- « Mes participations » et « Demandes reçues » (événements + campagnes) ---------- */

/** Ajoute `type_liste` et `evenement_detail` (titre, date, lieu, statut) à une participation. */
async function avecEvenement(p) {
  const repli = { id: p.evenement, titre: p.evenement_titre || `Événement #${p.evenement}`, date_evenement: p.evenement_date, lieu: p.evenement_lieu || "" };
  try {
    const e = await getEvenement(p.evenement);
    return { ...p, type_liste: "evenement", evenement_detail: e ? { ...repli, ...e } : repli };
  } catch {
    return { ...p, type_liste: "evenement", evenement_detail: repli };
  }
}

/** Mes demandes de participation aux événements (celles que j'ai envoyées). */
export async function listMesParticipations() {
  const rows = IS_DEMO
    ? demoParticipations.filter((p) => p.utilisateur === DEMO_USER)
    : await listParticipations({ perimetre: "mes" });
  return Promise.all(rows.map(avecEvenement));
}

export const annulerParticipation = (id) => cancelParticipation(id);

/** Modifie une demande encore en attente (coordonnées, type, motif). */
export async function modifierParticipation(id, data) {
  if (IS_DEMO) {
    demoParticipations = demoParticipations.map((p) => (p.id === Number(id) ? { ...p, ...data } : p));
    return demoParticipations.find((p) => p.id === Number(id));
  }
  return api.patch(`/participations/evenements/${id}/`, data);
}

/**
 * Organisateur : demandes en attente reçues sur ses événements et ses campagnes.
 * params.evenement : limite aux demandes d'un événement (les campagnes sont alors exclues).
 */
export async function listDemandesRecues(params = {}) {
  const evenements = IS_DEMO
    ? demoParticipations.filter((p) => p.utilisateur !== DEMO_USER && p.statut === "en_attente" && (!params.evenement || p.evenement === Number(params.evenement)))
    : await listParticipations({ statut: "en_attente", perimetre: "recues", ...(params.evenement ? { evenement: params.evenement } : {}) });
  const [ev, camp] = await Promise.all([
    Promise.all(evenements.map(avecEvenement)),
    params.evenement ? [] : listDemandesRecuesCampagnes(),
  ]);
  return [...ev, ...camp].map((row) => ({ ...row, id_liste: `${row.type_liste}-${row.id}` }));
}

/** decision : 'acceptee' | 'refusee' ; type : 'evenement' | 'campagne' */
export function deciderDemande(id, decision, type = "evenement") {
  if (type === "campagne") return traiterParticipationCampagne(id, decision);
  return traiterParticipation(id, decision === "acceptee" ? "accepter" : "refuser");
}
