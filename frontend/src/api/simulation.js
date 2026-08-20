import axiosClient from "./axiosClient";

export async function getConfigurationEnvoi(campagneId) {
  const { data } = await axiosClient.get(`/simulation/campagnes/${campagneId}/configuration/`);
  return data;
}

export async function updateConfigurationEnvoi(campagneId, payload) {
  const { data } = await axiosClient.put(`/simulation/campagnes/${campagneId}/configuration/`, payload);
  return data;
}

export async function envoyerCampagne(campagneId, destinataires) {
  const { data } = await axiosClient.post(`/simulation/campagnes/${campagneId}/envoyer/`, {
    destinataires: destinataires || [],
  });
  return data;
}
