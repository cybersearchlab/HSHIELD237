import axiosClient from "./axiosClient";

export async function listEmployes({ departement } = {}) {
  const params = {};
  if (departement) params.departement = departement;
  const { data } = await axiosClient.get("/employes/", { params });
  return data.results ?? data;
}

export async function createEmploye(payload) {
  const { data } = await axiosClient.post("/employes/", payload);
  return data;
}

export async function updateEmploye(id, payload) {
  const { data } = await axiosClient.patch(`/employes/${id}/`, payload);
  return data;
}

export async function deleteEmploye(id) {
  await axiosClient.delete(`/employes/${id}/`);
}
