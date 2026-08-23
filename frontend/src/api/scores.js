import axiosClient from "./axiosClient";

export async function getScoreCampagne(campagneId) {
  const { data } = await axiosClient.get(`/campagnes/${campagneId}/score/`);
  return data;
}

export async function getScoreParDepartement() {
  const { data } = await axiosClient.get("/campagnes/departements/score/");
  return data;
}
