import api from "./api";

const authService = {
  login: (payload) => api.post("/auth/login", payload),

  registerCustomer: (payload) =>
    api.post("/auth/register/customer", payload),

  registerVendor: (payload) =>
    api.post("/auth/register/vendor", payload),

  forgotPassword: (payload) =>
    api.post("/auth/forgot-password", payload),

  resetPassword: (payload) =>
    api.post("/auth/reset-password", payload),

  refresh: () => api.post("/auth/refresh"),

  me: () => api.get("/auth/me"),

  logout: () => api.post("/auth/logout"),
};

export default authService;