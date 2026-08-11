import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadPayments = async () => {
    setLoading(true);

    try {
      const response = await api.get("/admin/payments", {
        params: {
          page,
          status: status || undefined,
        },
      });

      const data = response.data?.data || response.data;

      setPayments(data.payments || data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Failed to load payments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [page, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-sm text-gray-500">
            Monitor mock payment transactions.
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
          <option value="INITIATED">Initiated</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : payments.length === 0 ? (
        <EmptyState title="No payments found" />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Booking</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Mode</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-5 py-4 font-medium">
                        {payment.providerReference || payment.id}
                      </td>

                      <td className="px-5 py-4">
                        {payment.bookingId || "-"}
                      </td>

                      <td className="px-5 py-4">
                        {formatCurrency(payment.amount)}
                      </td>

                      <td className="px-5 py-4">
                        {payment.mode || "-"}
                      </td>

                      <td className="px-5 py-4">
                        {payment.status}
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {formatDate(payment.createdAt)}
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