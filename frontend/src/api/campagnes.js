import axiosClient from "./axiosClient";

export async function listCampagnes({ statut, page } = {}) {
  const params = {};
  if (statut && statut !== "all") params.statut = statut;
  if (page) params.page = page;
  const { data } = await axiosClient.get("/campagnes/", { params });
  return data;
}

export async function createCampagne(payload) {
  const { data } = await axiosClient.post("/campagnes/", payload);
  return data;
}

export async function updateCampagne(id, payload) {
  const { data } = await axiosClient.patch(`/campagnes/${id}/`, payload);
  return data;
}

export async function deleteCampagne(id) {
  await axiosClient.delete(`/campagnes/${id}/`);
}

export async function listScenarios(campagneId) {
  const { data } = await axiosClient.get(`/campagnes/${campagneId}/scenarios/`);
  return data;
}

export async function listDestinataires(campagneId) {
  const { data } = await axiosClient.get(`/campagnes/${campagneId}/destinataires/`);
  return data;
}

export async function createDestinataire(campagneId, payload) {
  const { data } = await axiosClient.post(`/campagnes/${campagneId}/destinataires/`, payload);
  return data;
}

export async function deleteDestinataire(campagneId, destinataireId) {
  await axiosClient.delete(`/campagnes/${campagneId}/destinataires/${destinataireId}/`);
}
