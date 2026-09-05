import api from "./api";

export const supportService = {
  submitInquiry: (payload) => api.post("/support/contact", payload).then((res) => res.data),
};

export default supportService;
