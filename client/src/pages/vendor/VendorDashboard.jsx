import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Loader from "../../components/common/Loader";
import { API_URL } from "../../services/config";

const ACCESS_TOKEN_KEY = "marketplace_access_token";
const USER_KEY = "marketplace_user";

const VendorDashboard = () => {
  const [user, setUser] = useState(null);

  const [dashboard, setDashboard] = useState({
    vendorStatus: "PENDING",
    totalServices: 0,
    publishedServices: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    revenue: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);

    let parsedUser = null;

    if (storedUser) {
      try {
        parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Get vendor status directly from authenticated user
        const vendorStatus =
          parsedUser?.vendorProfile?.status || "PENDING";

        setDashboard((prev) => ({
          ...prev,
          vendorStatus,
        }));
      } catch {
        setUser(null);
      }
    }

    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);

        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/vendor/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const result = data.data || data;

          setDashboard((prev) => ({
            ...prev,
            ...result,

            // Prefer API vendorStatus if returned,
            // otherwise keep the status from user.vendorProfile
            vendorStatus:
              result.vendorStatus ||
              parsedUser?.vendorProfile?.status ||
              prev.vendorStatus,
          }));
        }
      } catch (error) {
        console.error("Failed to load vendor dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const sidebarItems = [
    {
      label: "Dashboard",
      to: "/vendor",
      end: true,
    },
    {
      label: "My Profile",
      to: "/vendor/profile",
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

  const navbarLinks = [
    {
      label: "Services",
      to: "/vendor/services",
    },
    {
      label: "Bookings",
      to: "/vendor/bookings",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  if (loading) {
    return <Loader fullScreen text="Loading vendor dashboard..." />;
  }

  const statusClasses = {
    PENDING: "bg-amber-50 text-amber-700",
    APPROVED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-red-50 text-red-700",
  };

  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
      navbarLinks={navbarLinks}
      sidebarTitle="Vendor"
      onLogout={handleLogout}
    >
      <div>
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Vendor Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your services, availability and bookings.
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
              statusClasses[dashboard.vendorStatus] ||
              "bg-slate-100 text-slate-600"
            }`}
          >
            Vendor: {dashboard.vendorStatus}
          </span>
        </div>

        {dashboard.vendorStatus !== "APPROVED" && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-semibold text-amber-900">
              Vendor approval pending
            </h2>

            <p className="mt-1 text-sm text-amber-800">
              Your vendor account must be approved by an admin
              before you can publish services.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total Services", dashboard.totalServices],
            ["Published", dashboard.publishedServices],
            ["Pending Bookings", dashboard.pendingBookings],
            ["Confirmed", dashboard.confirmedBookings],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <p className="text-sm text-slate-500">
                {label}
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Revenue Collected
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            ₹{" "}
            {Number(
              dashboard.revenue || 0
            ).toLocaleString()}
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Link
            to="/vendor/services/create"
            className="rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-300 hover:bg-blue-50"
          >
            <h2 className="font-semibold text-slate-900">
              Create Service
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Add a new service and its offerings.
            </p>
          </Link>

          <Link
            to="/vendor/availability"
            className="rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-300 hover:bg-blue-50"
          >
            <h2 className="font-semibold text-slate-900">
              Manage Availability
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Configure weekly rules and exceptions.
            </p>
          </Link>

          <Link
            to="/vendor/bookings"
            className="rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-300 hover:bg-blue-50"
          >
            <h2 className="font-semibold text-slate-900">
              Manage Bookings
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Review and update booking statuses.
            </p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VendorDashboard;