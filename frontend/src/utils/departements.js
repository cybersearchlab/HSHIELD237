// Correspondance esthétique code → icône Tabler, purement décorative.
// Le libellé affiché et la liste des départements existants viennent
// désormais du registre géré par l'administrateur — voir
// context/DepartementsContext.jsx (useDepartements()). Un nouveau
// département créé par l'administrateur n'a pas d'icône dédiée ici : le
// repli générique "ti-building" s'applique.
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
