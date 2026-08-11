import api from "./api";

const paymentService = {
  initiatePayment: (payload) =>
    api.post("/payments/initiate", payload),

  getPaymentByBooking: (bookingId) =>
    api.get(`/payments/booking/${bookingId}`),

  retryPayment: (paymentId) =>
    api.post(`/payments/${paymentId}/retry`),

  webhook: (payload) =>
    api.post("/payments/webhook", payload),
};

export default paymentService;