import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Loader from "../../components/common/Loader";
import useAuth from "../../hooks/useAuth";
import { API_URL } from "../../services/config";

const CustomerDashboard = () => {
  const { user, accessToken, logout } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        if (!accessToken) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/customer/dashboard`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();

          const dashboard = data.data || data;

          setStats({
            totalBookings: dashboard.totalBookings || 0,
            pendingBookings: dashboard.pendingBookings || 0,
            confirmedBookings: dashboard.confirmedBookings || 0,
            completedBookings: dashboard.completedBookings || 0,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [accessToken]);

  const sidebarItems = [
    {
      label: "Dashboard",
      to: "/customer/dashboard",
      end: true,
    },
    {
      label: "Browse Services",
      to: "/services",
    },
    {
      label: "My Bookings",
      to: "/customer/bookings",
    },
  ];

  const navbarLinks = [
    {
      label: "Services",
      to: "/services",
    },
    {
      label: "My Bookings",
      to: "/customer/bookings",
    },
  ];

  const handleLogout = logout;

  if (loading) {
    return <Loader fullScreen text="Loading dashboard..." />;
  }

  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
      navbarLinks={navbarLinks}
      sidebarTitle="Customer"
      onLogout={handleLogout}
    >
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {user?.name || "Customer"}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your service bookings from one place.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total Bookings", stats.totalBookings],
            ["Pending", stats.pendingBookings],
            ["Confirmed", stats.confirmedBookings],
            ["Completed", stats.completedBookings],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Link
            to="/services"
            className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-blue-300 hover:bg-blue-50"
          >
            <h2 className="font-semibold text-slate-900">
              Browse Services
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Discover approved vendors and available services.
            </p>
          </Link>

          <Link
            to="/customer/bookings"
            className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-blue-300 hover:bg-blue-50"
          >
            <h2 className="font-semibold text-slate-900">
              View My Bookings
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Track and manage your existing bookings.
            </p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;