import { api } from "./client";

export const authApi = {
  login: async (email, password) => {
    return await api("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  },
};