import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import Button from "../../components/common/Button";
import { formatDate } from "../../utils/formatDate";

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");

  const fetchVendors = async () => {
    setLoading(true);

    try {
      const response = await api.get("/admin/vendors", {
        params: {
          page,
          status: status || undefined,
        },
      });

      const data = response.data?.data || response.data;

      setVendors(data.vendors || data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Failed to load vendors", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [page, status]);

  const updateStatus = async (vendorId, newStatus) => {
    try {
      await api.patch(`/admin/vendors/${vendorId}/status`, {
        status: newStatus,
      });

      fetchVendors();
    } catch (error) {
      console.error("Failed to update vendor", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-sm text-gray-500">
            Manage marketplace vendors.
          </p>
        </div>

        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">All Vendors</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : vendors.length === 0 ? (
        <EmptyState
          title="No vendors found"
          description="There are no vendors matching the selected filter."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Vendor</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Created</th>
                    <th className="px-5 py-3 font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {vendors.map((vendor) => (
                    <tr key={vendor.id}>
                      <td className="px-5 py-4 font-medium">
                        {vendor.businessName || vendor.name}
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {vendor.email}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                          {vendor.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {formatDate(vendor.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        {vendor.status === "PENDING" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                updateStatus(vendor.id, "APPROVED")
                              }
                            >
                              Approve
                            </Button>

                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                updateStatus(vendor.id, "REJECTED")
                              }
                            >
                              Reject
                            </Button>
                          </div>
                        )}
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