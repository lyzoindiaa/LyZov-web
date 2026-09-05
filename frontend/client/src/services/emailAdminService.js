import api from "./api";

export const emailAdminService = {
  fetchEmailLogs: (params = {}) => api.get("/seller/emails", { params }).then((res) => res.data),
  sendTestEmail: (email) => api.post("/seller/emails/test", { email }).then((res) => res.data),
};

export default emailAdminService;
