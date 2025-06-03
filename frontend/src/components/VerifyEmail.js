// src/components/VerifyEmail.js
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_ROOT = "http://localhost:8000/user";

export default function VerifyEmail({ onVerified }) {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying...");
  const navigate = useNavigate();

  useEffect(() => {
    const uid = searchParams.get("uid");
    const token = searchParams.get("token");

    alert("Verifying email...");

    if (!uid || !token) {
      setMessage("Invalid verification link.");
      return;
    }
    axios
      .get(`${API_ROOT}/verify-email/?uid=${uid}&token=${token}`)
      .then(() => {
        setMessage("Email verified! Redirecting to login...");
        setTimeout(() => {
          onVerified();
          navigate("/");
        }, 2000);
      })
      .catch(() => {
        setMessage("Invalid or expired verification link.");
      });
  }, [searchParams, onVerified, navigate]);

  return <div className="email-verify-message">{message}</div>;
}
