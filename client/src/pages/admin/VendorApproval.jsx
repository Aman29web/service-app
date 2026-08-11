import { useEffect, useState } from "react";
import api from "../../services/api";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";

export default function VendorApproval() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPendingVendors = async () => {
    try {
      const response = await api.get("/admin/vendors", {
        params: { status: "PENDING" },
      });

      const data = response.data?.data || response.data;

      setVendors(data.vendors || data.items || []);
    } catch (error) {
      console.error("Failed to load pending vendors", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingVendors();
  }, []);

  const updateVendor = async (id, status) => {
    try {
      await api.patch(`/admin/vendors/${id}/status`, { status });
      setVendors((current) => current.filter((vendor) => vendor.id !== id));
    } catch (error) {
      console.error("Failed to update vendor", error);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vendor Approval</h1>
        <p className="text-sm text-gray-500">
          Review pending vendor applications.
        </p>
      </div>

      {vendors.length === 0 ? (
        <EmptyState
          title="No pending vendors"
          description="All vendor applications have been reviewed."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="rounded-xl border border-gray-200 bg-white p-6"
            >
              <h2 className="text-lg font-semibold">
                {vendor.businessName || vendor.name}
              </h2>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>Email: {vendor.email}</p>
                <p>Phone: {vendor.phone || "N/A"}</p>
                <p>Address: {vendor.address || "N/A"}</p>
                <p>Category: {vendor.category?.name || "N/A"}</p>
              </div>

              {vendor.description && (
                <p className="mt-4 text-sm text-gray-600">
                  {vendor.description}
                </p>
              )}

              <div className="mt-6 flex gap-3">
                <Button
                  onClick={() => updateVendor(vendor.id, "APPROVED")}
                >
                  Approve
                </Button>

                <Button
                  variant="danger"
                  onClick={() => updateVendor(vendor.id, "REJECTED")}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}