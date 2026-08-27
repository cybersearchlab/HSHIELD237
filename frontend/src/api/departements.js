import axiosClient from "./axiosClient";

export async function listDepartements() {
  const { data } = await axiosClient.get("/departements/");
  return data.results ?? data;
}

export async function createDepartement(payload) {
  const { data } = await axiosClient.post("/departements/", payload);
  return data;
}

export async function updateDepartement(id, payload) {
  const { data } = await axiosClient.patch(`/departements/${id}/`, payload);
  return data;
}

export async function deleteDepartement(id) {
  await axiosClient.delete(`/departements/${id}/`);
}
