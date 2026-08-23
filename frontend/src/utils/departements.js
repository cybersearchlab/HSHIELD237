export const DEPARTEMENT_LABELS = {
  direction: "Direction générale",
  rh: "Ressources humaines",
  comptabilite: "Comptabilité / Finance",
  it: "Informatique",
  commercial: "Commercial / Ventes",
  juridique: "Juridique",
  marketing: "Marketing / Communication",
  production: "Production / Opérations",
  achats: "Achats / Logistique",
  autre: "Autre",
};

export function departementLabel(value) {
  return DEPARTEMENT_LABELS[value] || value;
}

export const DEPARTEMENT_ICONS = {
  direction: "ti-building-skyscraper",
  rh: "ti-users",
  comptabilite: "ti-calculator",
  it: "ti-device-desktop",
  commercial: "ti-briefcase",
  juridique: "ti-scale",
  marketing: "ti-speakerphone",
  production: "ti-settings",
  achats: "ti-shopping-cart",
  autre: "ti-dots",
};
