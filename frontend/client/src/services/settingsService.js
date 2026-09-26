import api from "./api";

export const settingsService = {
  getSettings: () => api.get("/settings").then((res) => res.data),
  updateSettings: (payload) => api.put("/settings", payload).then((res) => res.data),
};
