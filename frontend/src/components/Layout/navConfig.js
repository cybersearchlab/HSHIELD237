export const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      { to: "/", label: "Tableau de bord", icon: "ti-layout-dashboard" },
      { to: "/generer-scenario", label: "Générer un scénario", icon: "ti-robot" },
      { to: "/campagnes", label: "Campagnes", icon: "ti-send" },
    ],
  },
  {
    label: "Analyse",
    items: [
      { to: "/resultats", label: "Résultats", icon: "ti-chart-bar" },
      { to: "/rapports", label: "Rapports PDF", icon: "ti-file-report" },
      { to: "/historique", label: "Historique", icon: "ti-history" },
    ],
  },
  {
    label: "Configuration",
    items: [
      { to: "/templates", label: "Templates par département", icon: "ti-template" },
      { to: "/consentements", label: "Consentements", icon: "ti-shield-check" },
      // Réservé à l'administrateur : c'est lui qui désigne le responsable
      // habilité à valider les campagnes de chaque département.
      { to: "/responsables", label: "Responsables", icon: "ti-users-group", roles: ["administrateur"] },
      // Réservé à l'administrateur : la liste réelle des départements de
      // l'entreprise cliente (toutes n'ont pas les 10 départements
      // proposés par défaut) — voir docs/CONTEXTE_PROJET.md, 2026-08-27.
      { to: "/departements", label: "Départements", icon: "ti-building", roles: ["administrateur"] },
      // Réservé à l'administrateur : l'annuaire des employés réels, utilisé
      // pour envoyer une campagne individuellement plutôt que via une
      // adresse de diffusion — voir docs/CONTEXTE_PROJET.md, 2026-08-27.
      { to: "/employes", label: "Employés", icon: "ti-users", roles: ["administrateur"] },
      { to: "/parametres", label: "Paramètres", icon: "ti-settings" },
    ],
  },
];
