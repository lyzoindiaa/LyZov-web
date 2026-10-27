import api from "./api";

export const couponService = {
  getCoupons: (params = {}) => api.get("/coupons", { params }).then((res) => res.data),
  createCoupon: (data) => api.post("/coupons", data).then((res) => res.data),
  updateCoupon: (id, data) => api.put(`/coupons/${id}`, data).then((res) => res.data),
  deleteCoupon: (id) => api.delete(`/coupons/${id}`).then((res) => res.data),
  validateCoupon: (code) => api.get(`/coupons/validate/${code}`).then((res) => res.data),
};

export default couponService;
