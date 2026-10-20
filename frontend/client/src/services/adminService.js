import api from "./api";

export const adminService = {
  // ── Overview & Metrics ──
  getOverview: async () => {
    const res = await api.get("/admin/overview");
    return res.data;
  },

  getStats: async () => {
    const res = await api.get("/admin/stats");
    return res.data;
  },

  // ── Seller Management ──
  getSellers: async (params = {}) => {
    const res = await api.get("/admin/sellers", { params });
    return res.data;
  },

  getSellerById: async (id) => {
    const res = await api.get(`/admin/sellers/${id}`);
    return res.data;
  },

  inviteSeller: async (data) => {
    const res = await api.post("/admin/sellers", data);
    return res.data;
  },

  updateSeller: async (id, data) => {
    const res = await api.put(`/admin/sellers/${id}`, data);
    return res.data;
  },

  updateSellerStatus: async (id, isActive) => {
    const res = await api.put(`/admin/sellers/${id}/status`, { isActive });
    return res.data;
  },

  updateSellerKyc: async (id, data) => {
    const res = await api.put(`/admin/sellers/${id}/kyc`, data);
    return res.data;
  },

  resendSellerInvite: async (id) => {
    const res = await api.post(`/admin/sellers/${id}/resend-invite`);
    return res.data;
  },

  // ── Customer Management ──
  getCustomers: async (params = {}) => {
    const res = await api.get("/admin/customers", { params });
    return res.data;
  },

  updateCustomerStatus: async (id, isActive) => {
    const res = await api.put(`/admin/customers/${id}/status`, { isActive });
    return res.data;
  },
};
