import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 60000, // 60 seconds timeout to prevent indefinite hangs
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;