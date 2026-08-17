import axiosClient from "./axiosClient";
import { clearTokens, setTokens } from "./tokenStorage";

export async function login(email, password) {
  const { data } = await axiosClient.post("/auth/login/", { email, password });
  setTokens({ access: data.access, refresh: data.refresh });
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await axiosClient.get("/auth/me/");
  return data;
}

export function logout() {
  clearTokens();
}
