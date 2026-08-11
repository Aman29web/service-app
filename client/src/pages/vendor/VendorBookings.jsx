import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import Button from "../../components/common/Button";
import bookingService from "../../services/bookingService";
import { formatDate } from "../../utils/formatDate";
import { formatCurrency } from "../../utils/formatCurrency";

export default function VendorBookings() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser =
      localStorage.getItem("marketplace_user") ||
      localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await bookingService.vendorBookings({
        page,
        status: status || undefined,
      });

      const data = response.data?.data || response.data;

      setBookings(data.bookings || data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load vendor bookings:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load bookings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [page, status]);

  const handleStatusUpdate = async (id, action) => {
    try {
      setUpdatingId(id);
      setError("");

      if (action === "confirm") {
        await bookingService.acceptBooking(id);
      }

      if (action === "reject") {
        await bookingService.rejectBooking(id);
      }

      if (action === "complete") {
        await bookingService.completeBooking(id);
      }

      if (action === "no-show") {
        await bookingService.markNoShow(id);
      }

      await loadBookings();
    } catch (err) {
      console.error("Failed to update booking:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update booking."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const sidebarItems = [
    {
      label: "Dashboard",
      to: "/vendor",
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
    },
    {
      label: "Availability",
      to: "/vendor/availability",
    },
    {
      label: "Bookings",
      to: "/vendor/bookings",
      end: true,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("marketplace_access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("marketplace_user");
  };

  if (loading) {
    return <Loader fullScreen text="Loading bookings..." />;
  }

  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
      sidebarTitle="Vendor"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Vendor Bookings
            </h1>

            <p className="text-sm text-slate-500">
              Manage bookings for your services.
            </p>
          </div>

          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm"
          >
            <option value="">All Bookings</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
            <option value="NO_SHOW">No Show</option>
          </select>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <EmptyState
            title="No bookings found"
            description="You don't have any bookings yet."
          />
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="px-5 py-3">Service</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-5 py-4">
                          {booking.service?.title ||
                            booking.serviceName ||
                            "-"}
                        </td>

                        <td className="px-5 py-4">
                          {booking.customer?.name ||
                            booking.customer?.fullName ||
                            "-"}
                        </td>

                        <td className="px-5 py-4 text-slate-500">
                          {formatDate(
                            booking.startTime || booking.date
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {formatCurrency(booking.amount)}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                            {booking.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            {booking.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  loading={updatingId === booking.id}
                                  onClick={() =>
                                    handleStatusUpdate(
                                      booking.id,
                                      "confirm"
                                    )
                                  }
                                >
                                  Accept
                                </Button>

                                <Button
                                  size="sm"
                                  variant="danger"
                                  loading={updatingId === booking.id}
                                  onClick={() =>
                                    handleStatusUpdate(
                                      booking.id,
                                      "reject"
                                    )
                                  }
                                >
                                  Reject
                                </Button>
                              </>
                            )}

                            {booking.status === "CONFIRMED" && (
                              <>
                                <Button
                                  size="sm"
                                  loading={updatingId === booking.id}
                                  onClick={() =>
                                    handleStatusUpdate(
                                      booking.id,
                                      "complete"
                                    )
                                  }
                                >
                                  Complete
                                </Button>

                                <Button
                                  size="sm"
                                  variant="warning"
                                  loading={updatingId === booking.id}
                                  onClick={() =>
                                    handleStatusUpdate(
                                      booking.id,
                                      "no-show"
                                    )
                                  }
                                >
                                  No Show
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}