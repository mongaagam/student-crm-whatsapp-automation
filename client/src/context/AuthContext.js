import axios from "axios";

const API = axios.create({
  baseURL: "https://student-crm-whatsapp-automation.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const auth = {
  login: async (data) => {
    const response = await API.post("/auth/login", data);
    return response.data;
  },

  register: async (data) => {
    const response = await API.post("/auth/register", data);
    return response.data;
  },

  getMe: async () => {
    const token = localStorage.getItem("crm_token");

    const response = await API.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },
};

export default API;