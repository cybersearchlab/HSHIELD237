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
      { to: "/templates-sectoriels", label: "Templates sectoriels", icon: "ti-template" },
      { to: "/consentements", label: "Consentements", icon: "ti-shield-check" },
      // Réservé à l'administrateur : c'est lui qui désigne le responsable
      // habilité à valider les campagnes de chaque département.
      { to: "/responsables", label: "Responsables", icon: "ti-users-group", roles: ["administrateur"] },
      { to: "/parametres", label: "Paramètres", icon: "ti-settings" },
    ],
  },
];
