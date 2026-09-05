import api from "./api";

export const categoryService = {
  getCategories: (params = {}) => api.get("/categories", { params }).then((res) => res.data),
  getCategoryTree: () => api.get("/categories/tree").then((res) => res.data),
  getCategoryBySlug: (slug) => api.get(`/categories/${slug}`).then((res) => res.data),
  getCategoryById: (id) => api.get(`/categories/${id}`).then((res) => res.data),
  createCategory: (data) =>
    api.post("/categories", data, { headers: { "Content-Type": "multipart/form-data" } }).then((res) => res.data),
  updateCategory: (id, data) =>
    api.put(`/categories/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }).then((res) => res.data),
  deleteCategory: (id) => api.delete(`/categories/${id}`).then((res) => res.data),
};