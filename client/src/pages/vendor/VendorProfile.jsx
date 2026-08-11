import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import api from "../../services/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const VendorProfile = () => {
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    businessName: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

 useEffect(() => {
  const loadProfile = async () => {
    try {
      const response = await api.get("/vendor/profile");

      const data = response.data;
      const profile = data.data || data;

      setForm({
        name: profile.name || "",
        email: profile.email || "",
        businessName: profile.businessName || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });

      setUser(profile);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  loadProfile();
}, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setSaving(true);
    setMessage("");
    setError("");

    const response = await api.patch("/vendor/profile", {
      name: form.name,
      businessName: form.businessName,
      phone: form.phone,
      address: form.address,
    });

    const data = response.data;
    const updated = data.data || data;

    setUser(updated);

    localStorage.setItem(
      "marketplace_user",
      JSON.stringify(updated)
    );

    setMessage("Profile updated successfully.");
  } catch (err) {
    setError(
      err.response?.data?.message ||
      err.message ||
      "Unable to update profile."
    );
  } finally {
    setSaving(false);
  }
};

  const sidebarItems = [
    {
      label: "Dashboard",
      to: "/vendor/dashboard",
    },
    {
      label: "My Profile",
      to: "/vendor/profile",
      end: true,
    },
    {
      label: "My Services",
      to: "/vendor/services",
    },
    {
      label: "Create Service",
      to: "/vendor/services/create",
      permission: "service.create",
    },
    {
      label: "Availability",
      to: "/vendor/availability",
    },
    {
      label: "Bookings",
      to: "/vendor/bookings",
    },
  ];

const handleLogout = () => {
  localStorage.removeItem("marketplace_access_token");
  localStorage.removeItem("marketplace_user");
};
  if (loading) {
    return <Loader fullScreen text="Loading profile..." />;
  }

  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
      sidebarTitle="Vendor"
      onLogout={handleLogout}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-900">
            Vendor Profile
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your account and business information.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-slate-200 bg-white p-6"
        >
          <Input
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            disabled
          />

          <Input
            label="Business Name"
            name="businessName"
            value={form.businessName}
            onChange={handleChange}
            required
          />

          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
          />

          <Input
            label="Business Address"
            name="address"
            type="textarea"
            value={form.address}
            onChange={handleChange}
            rows={4}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default VendorProfile;