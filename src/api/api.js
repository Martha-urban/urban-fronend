import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

console.log("API BASE URL:", import.meta.env.VITE_API_BASE_URL);

// Attach token automatically (except for auth routes)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("urban_access_token");

  // Check if request is for login/register
  const isAuthRequest =
    config.url?.includes("/auth/login") ||
    config.url?.includes("/auth/register");

  // Attach token only for protected endpoints
  if (token && !isAuthRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});