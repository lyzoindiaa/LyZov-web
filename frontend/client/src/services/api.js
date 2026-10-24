import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "production" ? "/api" : "http://localhost:5000/api");

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let accessToken = null;
let refreshPromise = null;

// Cross-tab synchronization via BroadcastChannel
let authChannel = null;
try {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    authChannel = new BroadcastChannel("lyzov-auth");
    authChannel.onmessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (data.type === "TOKEN_REFRESHED" && data.token) {
        setAccessToken(data.token, false);
      } else if (data.type === "LOGOUT") {
        setAccessToken(null, false);
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
    };
  }
} catch {
  // Gracefully degrade if BroadcastChannel is restricted (e.g. sandbox iframe)
  authChannel = null;
}

const broadcastAuthEvent = (payload) => {
  try {
    if (authChannel) {
      authChannel.postMessage(payload);
    }
  } catch {
    // Ignore broadcast errors
  }
};

export const setAccessToken = (token, shouldBroadcast = true) => {
  accessToken = token;
  if (shouldBroadcast && token) {
    broadcastAuthEvent({ type: "TOKEN_REFRESHED", token });
  } else if (shouldBroadcast && !token) {
    broadcastAuthEvent({ type: "LOGOUT" });
  }
};

export const getAccessToken = () => accessToken;

/**
 * Execute the actual refresh HTTP request with credentials.
 */
const executeRefreshCall = async () => {
  try {
    const { data } = await axios.post(
      `${API_URL}/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );

    const newToken = data?.data?.accessToken;
    if (!newToken) {
      throw new Error("Invalid response from refresh endpoint");
    }

    setAccessToken(newToken, true);
    return newToken;
  } catch (err) {
    setAccessToken(null, true);
    window.dispatchEvent(new CustomEvent("auth:logout"));
    throw err;
  }
};

/**
 * Single-flight token refresh with Web Locks cross-tab deduplication.
 */
export const performTokenRefresh = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    // If Web Locks API is available, deduplicate concurrent refresh across tabs
    if (typeof navigator !== "undefined" && navigator.locks && navigator.locks.request) {
      return await navigator.locks.request("lyzov_refresh_lock", async () => {
        return await executeRefreshCall();
      });
    }

    return await executeRefreshCall();
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await performTokenRefresh();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
