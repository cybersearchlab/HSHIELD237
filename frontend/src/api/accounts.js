import axiosClient from "./axiosClient";

export async function updateProfil(payload) {
  const { data } = await axiosClient.patch("/auth/me/", payload);
  return data;
}

export async function changerMotDePasse(payload) {
  const { data } = await axiosClient.post("/auth/mot-de-passe/", payload);
  return data;
}

// Public — page de connexion, avant authentification.
export async function demanderReinitialisation(email) {
  const { data } = await axiosClient.post("/auth/mot-de-passe-oublie/", { email });
  return data;
}

export async function listUtilisateurs() {
  const { data } = await axiosClient.get("/accounts/utilisateurs/");
  return data;
}

export async function creerUtilisateur(payload) {
  const { data } = await axiosClient.post("/accounts/utilisateurs/", payload);
  return data;
}

export async function changerRole(id, role) {
  const { data } = await axiosClient.patch(`/accounts/utilisateurs/${id}/role/`, { role });
  return data;
}

export async function reinitialiserMotDePasseUtilisateur(id) {
  const { data } = await axiosClient.post(`/accounts/utilisateurs/${id}/reinitialiser-mot-de-passe/`);
  return data;
}

export async function listDemandesReinitialisation() {
  const { data } = await axiosClient.get("/accounts/demandes-reinitialisation/");
  return data;
}

export async function traiterDemandeReinitialisation(id) {
  const { data } = await axiosClient.post(`/accounts/demandes-reinitialisation/${id}/traiter/`);
  return data;
}
