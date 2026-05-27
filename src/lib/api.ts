import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BROWSER_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const SERVER_API_URL = process.env.INTERNAL_API_URL || BROWSER_API_URL;

const api = axios.create({
  baseURL: typeof window !== "undefined" ? BROWSER_API_URL : SERVER_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${typeof window !== "undefined" ? BROWSER_API_URL : SERVER_API_URL}/api/auth/refresh`, {
            refreshToken,
          });
          if (data.success && data.accessToken) {
            localStorage.setItem("accessToken", data.accessToken);
            if (data.refreshToken) {
              localStorage.setItem("refreshToken", data.refreshToken);
            }
            const config = error.config;
            if (config && config.headers) {
              config.headers.Authorization = `Bearer ${data.accessToken}`;
              return axios(config);
            }
          }
        } catch (err) {
          console.warn("Token refresh failed:", err);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      } else {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
