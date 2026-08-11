import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import useAuth from "../../hooks/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      // Use AuthContext login.
      // This updates both React state and localStorage
      // using the same keys expected by AuthProvider.
      const data = await login(form);

      const user = data?.user;

      if (!user) {
        throw new Error("Login succeeded but user data was not returned.");
      }

      const role = user.role;

      let dashboard = "/";

      if (
        role === "SUPER_ADMIN" ||
        role === "ADMIN" ||
        role === "SUB_ADMIN"
      ) {
        dashboard = "/admin";
      } else if (role === "VENDOR") {
        dashboard = "/vendor";
      } else if (role === "CUSTOMER") {
        dashboard = "/customer";
      }

      // If user originally tried to access a protected page,
      // send them there. Otherwise send them to their dashboard.
      navigate(location.state?.from?.pathname || dashboard, {
        replace: true,
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to your ServiceHub account.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={loading}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Create account
          </Link>
        </div>

        <div className="mt-4 flex justify-center gap-4 text-sm">
          <Link
            to="/customer-signup"
            className="text-slate-500 hover:text-slate-800"
          >
            Customer
          </Link>

          <Link
            to="/vendor-signup"
            className="text-slate-500 hover:text-slate-800"
          >
            Vendor
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;