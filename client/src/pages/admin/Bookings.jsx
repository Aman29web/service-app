import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import { formatDate } from "../../utils/formatDate";
import { formatCurrency } from "../../utils/formatCurrency";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    setLoading(true);

    try {
      const response = await api.get("/admin/bookings", {
        params: {
          page,
          status: status || undefined,
        },
      });

      const data = response.data?.data || response.data;

      setBookings(data.bookings || data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Failed to load bookings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [page, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-sm text-gray-500">
            View and manage all marketplace bookings.
          </p>
        </div>

        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REJECTED">Rejected</option>
          <option value="NO_SHOW">No Show</option>
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : bookings.length === 0 ? (
        <EmptyState title="No bookings found" />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-5 py-3">Service</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Vendor</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
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
                        {booking.customer?.name || "-"}
                      </td>

                      <td className="px-5 py-4">
                        {booking.vendor?.businessName ||
                          booking.vendor?.name ||
                          "-"}
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {formatDate(booking.startTime || booking.date)}
                      </td>

                      <td className="px-5 py-4">
                        {formatCurrency(booking.amount)}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                          {booking.status}
                        </span>
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
  );
}