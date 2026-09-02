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

// Fausse page de capture personnalisée d'un scénario (2026-09-02) — soit
// du HTML collé, soit un fichier .html importé, jamais les deux à la
// fois (voir ScenarioPageCaptureView côté backend).
export async function getPageCapture(scenarioId) {
  const { data } = await axiosClient.get(`/campagnes/scenarios/${scenarioId}/page-capture/`);
  return data;
}

export async function setPageCaptureHtml(scenarioId, html) {
  const { data } = await axiosClient.put(`/campagnes/scenarios/${scenarioId}/page-capture/`, { html });
  return data;
}

export async function setPageCaptureFichier(scenarioId, fichier) {
  const form = new FormData();
  form.append("fichier", fichier);
  const { data } = await axiosClient.put(`/campagnes/scenarios/${scenarioId}/page-capture/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deletePageCapture(scenarioId) {
  const { data } = await axiosClient.delete(`/campagnes/scenarios/${scenarioId}/page-capture/`);
  return data;
}
