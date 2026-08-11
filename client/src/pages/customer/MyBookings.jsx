import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import Button from "../../components/common/Button";
import useAuth from "../../hooks/useAuth";
import { API_URL } from "../../services/config";

const MyBookings = () => {
  const { user, accessToken, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);

  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const token = accessToken;

      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(status ? { status } : {}),
      });

      const response = await fetch(
        `${API_URL}/bookings/my?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load bookings.");
      }

      const result = data.data || data;

      setBookings(
        result.bookings ||
          result.items ||
          (Array.isArray(result) ? result : [])
      );

      setTotalPages(
        result.pagination?.totalPages ||
          result.totalPages ||
          1
      );
    } catch (err) {
      setError(err.message || "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    {
      label: "Dashboard",
      to: "/customer/dashboard",
    },
    {
      label: "Browse Services",
      to: "/services",
    },
    {
      label: "My Bookings",
      to: "/customer/bookings",
      end: true,
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

  useEffect(() => {
    loadBookings();
  }, [page, status]);

  const handleCancel = async (bookingId) => {
    const reason = window.prompt(
      "Enter the reason for cancellation:"
    );

    if (!reason?.trim()) {
      return;
    }

    try {
      setCancellingId(bookingId);

      const token = accessToken;

      const response = await fetch(
        `${API_URL}/bookings/${bookingId}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to cancel booking."
        );
      }

      await loadBookings();
    } catch (err) {
      setError(err.message || "Unable to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const statusClasses = {
    PENDING: "bg-amber-50 text-amber-700",
    CONFIRMED: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-red-50 text-red-700",
    CANCELLED: "bg-slate-100 text-slate-600",
    NO_SHOW: "bg-red-50 text-red-700",
  };

  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
      navbarLinks={navbarLinks}
      sidebarTitle="Customer"
      onLogout={handleLogout}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-900">
            My Bookings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Track and manage your service bookings.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {[
            ["", "All"],
            ["PENDING", "Pending"],
            ["CONFIRMED", "Confirmed"],
            ["COMPLETED", "Completed"],
            ["CANCELLED", "Cancelled"],
          ].map(([value, label]) => (
            <button
              key={value || "all"}
              type="button"
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                status === value
                  ? "bg-blue-600 text-white"
                  : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <Loader text="Loading bookings..." />
        ) : bookings.length === 0 ? (
          <EmptyState
            title="No bookings found"
            description="You don't have any bookings matching this filter."
            actionLabel="Browse Services"
            onAction={() => navigate("/services")}
          />
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-900">
                        {booking.service?.title ||
                          booking.service?.name ||
                          "Service Booking"}
                      </h2>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusClasses[booking.status] ||
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      Booking ID: {booking.id}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-lg font-bold text-slate-900">
                      {booking.currency || "₹"}{" "}
                      {Number(
                        booking.price || 0
                      ).toLocaleString()}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {booking.paymentMode || "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-400">
                      Date
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {booking.date
                        ? new Date(
                            booking.date
                          ).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Start
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {booking.startTime ||
                        booking.start ||
                        "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Vendor
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {booking.vendor?.businessName ||
                        booking.vendor?.name ||
                        "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    to={`/customer/bookings/${booking.id}`}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    View Details
                  </Link>

                  {(booking.status === "PENDING" ||
                    booking.status === "CONFIRMED") && (
                    <Button
                      size="sm"
                      variant="danger"
                      loading={cancellingId === booking.id}
                      onClick={() =>
                        handleCancel(booking.id)
                      }
                    >
                      Cancel Booking
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyBookings;