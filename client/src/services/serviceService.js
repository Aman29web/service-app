import api from "./api";

const serviceService = {
  getServices: (params = {}) =>
    api.get("/services", { params }),

  getServiceById: (id) =>
    api.get(`/services/${id}`),

  getCategories: () =>
    api.get("/categories"),

  getAvailableSlots: (serviceId, params = {}) =>
    api.get(`/services/${serviceId}/slots`, {
      params,
    }),

  getNextAvailableSlot: (serviceId) =>
    api.get(`/services/${serviceId}/slots/next`),

  createService: (payload) =>
    api.post("/vendor/services", payload),

  updateService: (id, payload) =>
    api.patch(`/vendor/services/${id}`, payload),

  deleteService: (id) =>
    api.delete(`/vendor/services/${id}`),

  getMyServices: (params = {}) =>
    api.get("/vendor/services", { params }),

  getMyService: (id) =>
    api.get(`/vendor/services/${id}`),

  updateAvailability: (payload) =>
    api.put("/vendor/availability", payload),

  getAvailability: (params = {}) =>
    api.get("/vendor/availability", { params }),

  addException: (payload) =>
    api.post("/vendor/availability/exceptions", payload),

  deleteException: (id) =>
    api.delete(`/vendor/availability/exceptions/${id}`),
};

export default serviceService;