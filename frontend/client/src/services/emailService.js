import api from "./api";

const emailService = {
  fetchMyEmailLogs: (params = {}) => api.get("/customer/emails", { params }).then((res) => res.data),
};

export default emailService;