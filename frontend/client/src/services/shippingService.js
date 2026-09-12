import api from "./api";

export const checkPincode = async (pincode) => {
  const res = await api.get(`/shipping/pincode/${pincode}`);
  return res.data;
};

export const estimateRates = async (params) => {
  const res = await api.post("/shipping/estimate", params);
  return res.data;
};

export const trackOrder = async (waybill) => {
  const res = await api.get(`/shipping/track/${waybill}`);
  return res.data;
};

export const manifestOrder = async (orderId, payload = {}) => {
  const res = await api.post(`/shipping/order/${orderId}`, payload);
  return res.data;
};

export const createReturnPickup = async (orderId, payload = {}) => {
  const res = await api.post(`/shipping/return/${orderId}`, payload);
  return res.data;
};

export const cancelShipment = async (waybill) => {
  const res = await api.post(`/shipping/cancel/${waybill}`);
  return res.data;
};

export const getShippingLabel = async (waybill) => {
  const res = await api.get(`/shipping/label/${waybill}`);
  return res.data;
};

export const requestPickup = async (params) => {
  const res = await api.post("/shipping/pickup-request", params);
  return res.data;
};

export const shippingService = {
  checkPincode,
  estimateRates,
  trackOrder,
  manifestOrder,
  createReturnPickup,
  cancelShipment,
  getShippingLabel,
  requestPickup,
};

export default shippingService;
