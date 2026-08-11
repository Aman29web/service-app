import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/common/Loader";

const StatCard = ({ title, value, description }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <h3 className="mt-2 text-3xl font-bold text-gray-900">{value}</h3>
    <p className="mt-1 text-xs text-gray-500">{description}</p>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    vendors: 0,
    pendingVendors: 0,
    bookings: 0,
    revenue: 0,
    failedPayments: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get("/admin/dashboard");
        setStats(response.data?.data || response.data);
      } catch (error) {
        console.error("Failed to load admin dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of marketplace activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Vendors"
          value={stats.vendors}
          description="Registered vendors"
        />
        <StatCard
          title="Pending Vendors"
          value={stats.pendingVendors}
          description="Waiting for approval"
        />
        <StatCard
          title="Bookings"
          value={stats.bookings}
          description="Total bookings"
        />
        <StatCard
          title="Revenue"
          value={`₹${Number(stats.revenue || 0).toLocaleString("en-IN")}`}
          description="Collected revenue"
        />
        <StatCard
          title="Failed Payments"
          value={stats.failedPayments}
          description="Payment failures"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Marketplace Overview
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-yellow-50 p-4">
            <p className="text-sm text-yellow-700">Pending Approvals</p>
            <p className="mt-1 text-2xl font-bold text-yellow-900">
              {stats.pendingVendors}
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-700">Bookings</p>
            <p className="mt-1 text-2xl font-bold text-blue-900">
              {stats.bookings}
            </p>
          </div>

          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm text-green-700">Revenue</p>
            <p className="mt-1 text-2xl font-bold text-green-900">
              ₹{Number(stats.revenue || 0).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}