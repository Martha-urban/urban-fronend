import axios from "axios";

const authApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function loginUser(payload) {
  const res = await authApi.post("/api/v1/auth/login", payload);
  return res.data;
}
