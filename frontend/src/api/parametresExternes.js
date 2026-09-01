import axiosClient from "./axiosClient";

export async function listParametresExternes() {
  const { data } = await axiosClient.get("/parametres/externes/");
  return data.results ?? data;
}

export async function createParametreExterne(payload) {
  const { data } = await axiosClient.post("/parametres/externes/", payload);
  return data;
}

export async function updateParametreExterne(id, payload) {
  const { data } = await axiosClient.patch(`/parametres/externes/${id}/`, payload);
  return data;
}
