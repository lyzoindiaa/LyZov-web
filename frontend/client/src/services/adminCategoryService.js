import api from "./api";

export const adminCategoryService = {
  createCategory: (data) =>
    api.post("/categories", data).then((res) => res.data),
  updateCategory: (id, data) =>
    api.put(`/categories/${id}`, data).then((res) => res.data),
  deleteCategory: (id) => api.delete(`/categories/${id}`).then((res) => res.data),
};