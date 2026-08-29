import api from "./api";

export const adminBrandService = {
  getBrands: () => api.get("/brands").then((res) => res.data),
  createBrand: (data) => api.post("/brands", data).then((res) => res.data),
  updateBrand: (id, data) => api.put(`/brands/${id}`, data).then((res) => res.data),
  deleteBrand: (id) => api.delete(`/brands/${id}`).then((res) => res.data),
};