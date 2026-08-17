export const ROLE_LABELS = {
  consultant: "Consultant",
  responsable: "Responsable",
  employe: "Employé",
  administrateur: "Administrateur",
};

export function roleLabel(role) {
  return ROLE_LABELS[role] || role;
}
