import React, { useState } from "react";
import axios from "axios";

const API = "https://student-crm-backend-nowm.onrender.com";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const endpoint = isRegister
        ? "/api/auth/register"
        : "/api/auth/login";

      const payload = isRegister
        ? formData
        : {
            email: formData.email,
            password: formData.password,
          };

      const res = await axios.post(API + endpoint, payload);

      setMessage(res.data.message || "Success");

      alert("Success ✅");
    } catch (err) {
      console.log(err);

      setMessage(
        err.response?.data?.message || "Something went wrong"
      );
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-[#0b1020] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
            A
          </div>

          <h1 className="text-4xl font-bold">
            EDOOFA <span className="text-indigo-400">CRM</span>
          </h1>

          <p className="text-gray-400 mt-2">
            AI-Powered Admissions Command Center
          </p>
        </div>

        <div className="flex mb-6 bg-black/30 rounded-xl p-1">
          <button
            className={`flex-1 py-3 rounded-lg ${
              !isRegister
                ? "bg-indigo-600"
                : "text-gray-400"
            }`}
            onClick={() => setIsRegister(false)}
          >
            Admin Sign In
          </button>

          <button
            className={`flex-1 py-3 rounded-lg ${
              isRegister
                ? "bg-indigo-600"
                : "text-gray-400"
            }`}
            onClick={() => setIsRegister(true)}
          >
            Create Account
          </button>
        </div>

        {message && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-xl mb-4">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="mb-4">
              <label className="block mb-2 text-sm">
                FULL NAME
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-black/40 border border-white/10"
                required
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block mb-2 text-sm">
              EMAIL ADDRESS
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-4 rounded-xl bg-black/40 border border-white/10"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sm">
              PASSWORD
            </label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-4 rounded-xl bg-black/40 border border-white/10"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 font-semibold"
          >
            {isRegister
              ? "Create Manager Profile"
              : "Enter CRM Control Deck"}
          </button>
        </form>
      </div>
    </div>
  );
}