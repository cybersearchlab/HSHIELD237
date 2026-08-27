import axiosClient from "./axiosClient";

export async function getConfigurationEnvoi(campagneId) {
  const { data } = await axiosClient.get(`/simulation/campagnes/${campagneId}/configuration/`);
  return data;
}

export async function updateConfigurationEnvoi(campagneId, payload) {
  const { data } = await axiosClient.put(`/simulation/campagnes/${campagneId}/configuration/`, payload);
  return data;
}

// cible: "tous" (tous les employés du département de la campagne) ou
// "un_employe" (employeId requis) — envoie individuellement à l'annuaire
// des employés (apps.employes) plutôt qu'à une adresse de diffusion,
// voir CampagnesPage.jsx. Sans cible, conserve l'ancien comportement
// (liste d'emails explicite, non utilisée par l'interface actuelle).
export async function envoyerCampagne(campagneId, { cible, employeId, destinataires } = {}) {
  const { data } = await axiosClient.post(`/simulation/campagnes/${campagneId}/envoyer/`, {
    cible: cible || null,
    employe_id: employeId || null,
    destinataires: destinataires || [],
  });
  return data;
}
