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

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------
// 401 handling: redeem the refresh token exactly once per
// expired access token and replay every request that failed
// while that refresh was in flight.
//
// Refresh tokens rotate server-side (the old one is revoked the
// moment a new one is issued), so if two requests both hit 401
// at once and each independently call /auth/refresh with the
// same old refresh token, the second call gets rejected as reuse
// and the backend signs the user out of every session. The queue
// below makes sure only one refresh call is ever in flight.
// ---------------------------------------------------------

let isRefreshing = false;
let pendingQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

function resolvePendingQueue(token: string | null, error: unknown = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
    } else {
      reject(error);
    }
  });

  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint &&
      typeof window !== "undefined"
    ) {
      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // A refresh is already in flight - wait for it instead of
        // starting a second one.
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (newToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);

        resolvePendingQueue(data.access_token);

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        resolvePendingQueue(null, refreshError);

        // Refresh itself failed (expired, reused, or invalid) - the
        // session can't be recovered client-side. Clear it and send
        // the user back to login.
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401) {
      console.error("Authentication failed:", error.response?.data);
    }

    return Promise.reject(error);
  }
);
