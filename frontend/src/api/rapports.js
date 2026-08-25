import axiosClient from "./axiosClient";

export async function downloadRapportCampagne(campagneId) {
  const response = await axiosClient.get(`/campagnes/${campagneId}/rapport/`, {
    responseType: "blob",
  });
  return response.data;
}
