import api from "./api";

export const categoryService = {
  getCategories: () => api.get("/categories").then((res) => res.data),
  getCategoryBySlug: (slug) => api.get(`/categories/${slug}`).then((res) => res.data),
  getCategoryById: (id) => api.get(`/categories/${id}`).then((res) => res.data),
  createCategory: (data) => api.post("/categories", data).then((res) => res.data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data).then((res) => res.data),
  deleteCategory: (id) => api.delete(`/categories/${id}`).then((res) => res.data),
};