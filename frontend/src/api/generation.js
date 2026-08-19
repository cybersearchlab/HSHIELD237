import axiosClient from "./axiosClient";

export async function generateViaAPI({ campagne, contexte_additionnel }) {
  const { data } = await axiosClient.post("/generation/api/", {
    campagne,
    contexte_additionnel: contexte_additionnel || "",
  });
  return data;
}

export async function generateManuel(formValues) {
  const form = new FormData();
  Object.entries(formValues).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      form.append(key, value);
    }
  });
  const { data } = await axiosClient.post("/generation/manuel/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
