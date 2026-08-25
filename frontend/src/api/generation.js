import axiosClient from "./axiosClient";

export async function generateViaAPI({
  campagne,
  contexte_additionnel,
  expediteur_nom,
  expediteur_email,
  destinataire_email,
  template,
}) {
  const { data } = await axiosClient.post("/generation/api/", {
    campagne,
    contexte_additionnel: contexte_additionnel || "",
    expediteur_nom: expediteur_nom || "",
    expediteur_email: expediteur_email || "",
    destinataire_email: destinataire_email || "",
    template: template || null,
  });
  return data;
}

export async function generateManuel(formValues) {
  const form = new FormData();
  Object.entries(formValues).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((item) => form.append(key, item));
    } else {
      form.append(key, value);
    }
  });
  const { data } = await axiosClient.post("/generation/manuel/", form);
  return data;
}
