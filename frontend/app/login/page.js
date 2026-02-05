"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";

// Base URL without /api suffix for CSRF cookie endpoint
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:8000';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // First, get the CSRF cookie (use base URL without /api)
      await axios.get(`${API_BASE_URL}/sanctum/csrf-cookie`, {
        withCredentials: true
      });

      // Then make the login request
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/login`,
        { email, password },
        { withCredentials: true }
      );
      
      // Save the token (e.g., localStorage)
      localStorage.setItem("authToken", res.data.token);

      // Redirect to the todos dashboard
      router.push("/todos");
    } catch (err) {
      setError("Invalid credentials or server error.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo">
          <h1>📝 TodoApp</h1>
          <p>Organize your life, one task at a time</p>
        </div>
        
        <h2>Welcome back</h2>
        <p className="subtitle">Sign in to continue to your todos</p>

        {error && (
          <div className="alert alert-danger text-center">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email address</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555zM0 4.697v7.104l6.342-4.877A1 1 0 0 1 7.5 6.82v5.18l-7.5-5.08z"/>
                  <path d="M14.243 5.818a2.243 2.243 0 0 0-1.02-.193l-6.5 4.747a2.243 2.243 0 0 0 .35 4.193l6.5-4.747a2.243 2.243 0 0 0 .173-.818z"/>
                </svg>
              </span>
              <input
                type="email"
                id="email"
                className="form-control border-start-0"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                </svg>
              </span>
              <input
                type="password"
                id="password"
                className="form-control border-start-0"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="auth-link">
          Don't have an account? <Link href="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
