import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

console.log("API BASE URL:", import.meta.env.VITE_API_BASE_URL);

// REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("urban_access_token");

    // 🔥 ALWAYS attach token if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // // if token expired or unauthorized
    // if (status === 401 || status === 403) {
    //   console.warn("Session expired. Redirecting to login.");

    //   localStorage.removeItem("urban_access_token");
    //   localStorage.removeItem("urban_refresh_token");

    //   window.location.href = "/login";
    // }

    return Promise.reject(error);
  }
);