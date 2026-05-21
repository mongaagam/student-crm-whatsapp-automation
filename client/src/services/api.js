import axios from "axios";

const API = axios.create({
  baseURL: "https://student-crm-whatsapp-automation.onrender.com/api",
});

export default API;