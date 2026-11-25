import { CalendarDays, HandHeart, Users } from "lucide-react";

/** Entrées de la barre latérale du module — voir app/navigation.js pour le format. */
export default [
  { to: "/evenements", label: "Événements", icon: CalendarDays, roles: ["citoyen", "organisateur"], group: "Agir", order: 1 },
  { to: "/espace/participations", label: "Mes participations", icon: HandHeart, roles: ["citoyen", "organisateur"], group: "Agir", order: 2 },
  { to: "/organisateur/evenements", label: "Événements", icon: CalendarDays, roles: ["organisateur"], group: "Mes actions", order: 1 },
  { to: "/organisateur/demandes", label: "Demandes", icon: Users, roles: ["organisateur"], group: "Mes actions", order: 2 },
];
