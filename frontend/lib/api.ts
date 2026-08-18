import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    // Only access localStorage in the browser
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");

      console.log("🔑 TOKEN EXISTS:", !!token);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    console.log("🌐 API REQUEST:", config.method?.toUpperCase(), config.url);

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error(
        "❌ AUTHENTICATION FAILED:",
        error.response?.data
      );
    }

    return Promise.reject(error);
  }
);