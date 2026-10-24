import api from "./api";

export const adminBrandService = {
  getBrands: (params = {}) => api.get("/brands", { params }).then((res) => res.data),
  createBrand: (data) =>
    api.post("/brands", data, { headers: { "Content-Type": "multipart/form-data" } }).then((res) => res.data),
  updateBrand: (id, data) =>
    api.put(`/brands/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }).then((res) => res.data),
  deleteBrand: (id) => api.delete(`/brands/${id}`).then((res) => res.data),
};