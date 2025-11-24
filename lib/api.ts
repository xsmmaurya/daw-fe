// src/lib/api.ts
"use client";

import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1",
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  // Read token from Zustand store (no React hook)
  const token = useAuthStore.getState().token;

  if (token) {
    if (!config.headers) {
      config.headers = {};
    }
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

export default api;
