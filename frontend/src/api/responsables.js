import axiosClient from "./axiosClient";

export async function listResponsables() {
  const { data } = await axiosClient.get("/gouvernance/responsables/");
  return data;
}

export async function createResponsable(payload) {
  const { data } = await axiosClient.post("/gouvernance/responsables/", payload);
  return data;
}

export async function updateResponsable(id, payload) {
  const { data } = await axiosClient.patch(`/gouvernance/responsables/${id}/`, payload);
  return data;
}

export async function deleteResponsable(id) {
  await axiosClient.delete(`/gouvernance/responsables/${id}/`);
}
