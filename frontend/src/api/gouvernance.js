import axiosClient from "./axiosClient";

export async function listConsentements(statut) {
  const params = {};
  if (statut && statut !== "all") params.statut = statut;
  const { data } = await axiosClient.get("/gouvernance/consentements/", { params });
  return data;
}

// Le nom/email du responsable ne sont plus transmis ici : ils sont
// dérivés côté serveur depuis le registre ResponsableDepartement (réservé
// à l'administrateur — voir apps.gouvernance.services.creer_consentement_auto).
export async function genererConsentement(campagneId) {
  const { data } = await axiosClient.post(`/gouvernance/campagnes/${campagneId}/consentement/`);
  return data;
}

export async function validerConsentement(id) {
  const { data } = await axiosClient.post(`/gouvernance/consentements/${id}/valider/`);
  return data;
}

export async function refuserConsentement(id, { motifs, details }) {
  const { data } = await axiosClient.post(`/gouvernance/consentements/${id}/refuser/`, { motifs, details });
  return data;
}
