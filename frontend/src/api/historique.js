import axiosClient from "./axiosClient";

export async function getHistoriqueParDepartement() {
  const { data } = await axiosClient.get("/campagnes/departements/historique/");
  return data;
}
