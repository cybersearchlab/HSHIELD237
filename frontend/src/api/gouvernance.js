import axiosClient from "./axiosClient";

export async function listConsentements(statut) {
  const params = {};
  if (statut && statut !== "all") params.statut = statut;
  const { data } = await axiosClient.get("/gouvernance/consentements/", { params });
  return data;
}

export async function createConsentement(campagneId, payload) {
  const { data } = await axiosClient.post(`/gouvernance/campagnes/${campagneId}/consentement/`, payload);
  return data;
}

export async function validerConsentement(id) {
  const { data } = await axiosClient.post(`/gouvernance/consentements/${id}/valider/`);
  return data;
}

export async function refuserConsentement(id) {
  const { data } = await axiosClient.post(`/gouvernance/consentements/${id}/refuser/`);
  return data;
}
