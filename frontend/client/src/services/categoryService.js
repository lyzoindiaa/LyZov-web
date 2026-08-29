import api from "./api";

export const categoryService = {
  getCategories: () => api.get("/categories").then((res) => res.data),
  getCategoryBySlug: (slug) => api.get(/categories/).then((res) => res.data),
  createCategory: (data) => api.post("/categories", data).then((res) => res.data),
  updateCategory: (id, data) => api.put(/categories/, data).then((res) => res.data),
  deleteCategory: (id) => api.delete(/categories/).then((res) => res.data),
};