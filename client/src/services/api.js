import axios from "axios";

import { API_URL } from "./config";

const ACCESS_TOKEN_KEY = "marketplace_access_token";
const USER_KEY = "marketplace_user";

let isRefreshing = false;
let pendingRequests = [];

const processQueue = (error, token = null) => {
  pendingRequests.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  pendingRequests = [];
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// =========================
// REQUEST INTERCEPTOR
// =========================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    console.log("===== API REQUEST =====");
    console.log("URL:", config.baseURL + config.url);
    console.log("TOKEN KEY:", ACCESS_TOKEN_KEY);
    console.log("TOKEN:", token);
    console.log("TOKEN LENGTH:", token?.length);
    console.log("======================");

    if (token && token !== "null" && token !== "undefined") {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers?.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =========================
// RESPONSE INTERCEPTOR
// =========================

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Only handle 401
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Never refresh the refresh request itself
    if (originalRequest?.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    // Don't retry the same request
    if (originalRequest?._retry) {
      return Promise.reject(error);
    }

    // Another request is already refreshing
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({
          resolve,
          reject,
        });
      })
        .then((newToken) => {
          originalRequest.headers =
            originalRequest.headers || {};

          originalRequest.headers.Authorization =
            `Bearer ${newToken}`;

          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axios.post(
        `${API_URL}/auth/refresh`,
        {},
        {
          withCredentials: true,
        }
      );

      const refreshData =
        refreshResponse.data?.data ||
        refreshResponse.data;

      const newToken =
        refreshData?.accessToken ||
        refreshData?.token;

      if (!newToken) {
        throw new Error(
          "Refresh token response did not contain an access token."
        );
      }

      localStorage.setItem(
        ACCESS_TOKEN_KEY,
        newToken
      );

      processQueue(null, newToken);

      originalRequest.headers =
        originalRequest.headers || {};

      originalRequest.headers.Authorization =
        `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);

      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;