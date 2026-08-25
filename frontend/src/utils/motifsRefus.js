// Miroir exact de MotifRefus (backend apps.gouvernance.models) — un refus
// de consentement doit être justifié par au moins un de ces motifs.
export const MOTIFS_REFUS = [
  { value: "perimetre_trop_large", label: "Le périmètre testé est trop large" },
  { value: "timing_inapproprie", label: "Le moment choisi n'est pas approprié" },
  { value: "scenario_inadapte", label: "Le scénario n'est pas adapté à ce département" },
  { value: "infos_insuffisantes", label: "Informations insuffisantes pour valider en connaissance de cause" },
  { value: "autre", label: "Autre motif (préciser)" },
];
