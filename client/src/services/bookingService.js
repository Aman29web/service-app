import api from "./api";

const bookingService = {
  createBooking: (payload) =>
    api.post("/bookings", payload),

  getMyBookings: (params = {}) =>
    api.get("/bookings/my", { params }),

  getBookingById: (id) =>
    api.get(`/bookings/${id}`),

  cancelBooking: (id, payload = {}) =>
    api.patch(`/bookings/${id}/cancel`, payload),

  rescheduleBooking: (id, payload) =>
    api.patch(`/bookings/${id}/reschedule`, payload),

  vendorBookings: (params = {}) =>
    api.get("/vendor/bookings", { params }),

  acceptBooking: (id) =>
    api.patch(`/vendor/bookings/${id}/confirm`),

  rejectBooking: (id, payload = {}) =>
    api.patch(`/vendor/bookings/${id}/reject`, payload),

  completeBooking: (id) =>
    api.patch(`/vendor/bookings/${id}/complete`),

  markNoShow: (id) =>
    api.patch(`/vendor/bookings/${id}/no-show`),

  forceCancel: (id, payload) =>
    api.patch(`/admin/bookings/${id}/cancel`, payload),
};

export default bookingService;