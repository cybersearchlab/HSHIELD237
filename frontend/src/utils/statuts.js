export const STATUT_LABELS = {
  brouillon: "Brouillon",
  en_attente: "En attente",
  active: "Active",
  terminee: "Terminée",
};

export function statutLabel(value) {
  return STATUT_LABELS[value] || value;
}
