import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import api from "../../services/api";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const MyServices = () => {
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

const loadServices = async () => {
  try {
    setLoading(true);
    setError("");

    const response = await api.get("/vendor/services");

    const data = response.data;
    const result = data?.data || data;

    setServices(
      result?.services ||
        result?.items ||
        (Array.isArray(result) ? result : [])
    );
  } catch (err) {
    setError(
      err?.response?.data?.message ||
        err?.message ||
        "Unable to load services."
    );
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    const storedUser = localStorage.getItem("marketplace_user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    loadServices();
  }, []);

const handleStatusChange = async (serviceId, status) => {
  try {
    setUpdatingId(serviceId);
    setError("");

    await api.patch(`/services/${serviceId}/status`, {
      status,
    });

    await loadServices();
  } catch (err) {
    setError(
      err?.response?.data?.message ||
        err?.message ||
        "Unable to update service."
    );
  } finally {
    setUpdatingId(null);
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
    },
    {
      label: "My Services",
      to: "/vendor/services",
      end: true,
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

  const statusClasses = {
    DRAFT: "bg-slate-100 text-slate-600",
    PUBLISHED: "bg-emerald-50 text-emerald-700",
    SUSPENDED: "bg-red-50 text-red-700",
  };

  if (loading) {
    return <Loader fullScreen text="Loading services..." />;
  }

  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
      sidebarTitle="Vendor"
      onLogout={handleLogout}
    >
      <div>
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              My Services
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your services and offerings.
            </p>
          </div>

          <Link
            to="/vendor/services/create"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Service
          </Link>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {services.length === 0 ? (
          <EmptyState
            title="No services yet"
            description="Create your first service to start building your catalogue."
            actionLabel="Create Service"
            onAction={() =>
              (window.location.href =
                "/vendor/services/create")
            }
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      {service.title || service.name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {service.category?.name || "No category"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      statusClasses[service.status] ||
                      "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {service.status}
                  </span>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                  {service.description ||
                    "No description available."}
                </p>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Offerings
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {(service.offerings || []).length} offering(s)
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    to={`/vendor/services/${service.id}/edit`}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </Link>

                  {service.status === "DRAFT" && (
                    <Button
                      size="sm"
                      loading={updatingId === service.id}
                      onClick={() =>
                        handleStatusChange(
                          service.id,
                          "PUBLISHED"
                        )
                      }
                    >
                      Publish
                    </Button>
                  )}

                  {service.status === "PUBLISHED" && (
                    <Button
                      size="sm"
                      variant="warning"
                      loading={updatingId === service.id}
                      onClick={() =>
                        handleStatusChange(
                          service.id,
                          "SUSPENDED"
                        )
                      }
                    >
                      Suspend
                    </Button>
                  )}

                  {service.status === "SUSPENDED" && (
                    <Button
                      size="sm"
                      loading={updatingId === service.id}
                      onClick={() =>
                        handleStatusChange(
                          service.id,
                          "PUBLISHED"
                        )
                      }
                    >
                      Publish Again
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyServices;