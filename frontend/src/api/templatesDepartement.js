import axiosClient from "./axiosClient";

// Le nombre de templates reste largement sous la taille de page par
// défaut (20) dans la pratique — on renvoie directement la liste plutôt
// que de gérer une pagination dont cette page n'a pas besoin.
export async function listTemplates(departement) {
  const params = {};
  if (departement && departement !== "all") params.departement = departement;
  const { data } = await axiosClient.get("/templates-departement/", { params });
  return data.results ?? data;
}

export async function createTemplate(payload) {
  const { data } = await axiosClient.post("/templates-departement/", payload);
  return data;
}

export async function updateTemplate(id, payload) {
  const { data } = await axiosClient.patch(`/templates-departement/${id}/`, payload);
  return data;
}

export async function deleteTemplate(id) {
  await axiosClient.delete(`/templates-departement/${id}/`);
}
