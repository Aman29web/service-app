import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AvailableSlots = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id: serviceId } = useParams();
  const [searchParams] = useSearchParams();

  const offeringId = searchParams.get("offering");

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [slots, setSlots] = useState([]);
  const [service, setService] = useState(null);
  const [offering, setOffering] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSlots = async () => {
      if (!offeringId || !date) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          offeringId,
          date,
        });

        const response = await fetch(
          `${API_URL}/availability/slots?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load available slots.");
        }

        const result = data.data || data;

        setSlots(result.slots || []);
        setService(result.service || null);
        setOffering(result.offering || null);
      } catch (err) {
        setError(err.message || "Unable to load slots.");
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    loadSlots();
  }, [offeringId, date]);

  const handleSelectSlot = (slot) => {
    navigate(
      `/services/${serviceId}/book?offering=${offeringId}&slot=${encodeURIComponent(
        slot.start
      )}&date=${date}`
    );
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

  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
      navbarLinks={navbarLinks}
      sidebarTitle="Customer"
      onLogout={handleLogout}
    >
      <div className="mx-auto max-w-4xl">
        <Link
          to={`/services/${serviceId}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to Service
        </Link>

        <div className="mt-5">
          <h1 className="text-2xl font-bold text-slate-900">
            Available Slots
          </h1>

          {service && (
            <p className="mt-1 text-sm text-slate-500">
              {service.title || service.name}
              {offering ? ` · ${offering.name}` : ""}
            </p>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <Input
            label="Select Date"
            type="date"
            value={date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <Loader text="Finding available slots..." />
        ) : slots.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No slots available"
              description="There are no bookable slots for this date."
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot, index) => {
              const isAvailable =
                slot.available !== false &&
                Number(slot.remainingCapacity ?? 1) > 0;

              return (
                <div
                  key={slot.id || `${slot.start}-${index}`}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">
                      {slot.startTime ||
                        slot.start?.split("T")[1]?.slice(0, 5) ||
                        slot.start}
                    </p>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        isAvailable
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {isAvailable ? "Available" : "Full"}
                    </span>
                  </div>

                  {slot.endTime && (
                    <p className="mt-1 text-sm text-slate-500">
                      Until {slot.endTime}
                    </p>
                  )}

                  {slot.capacity !== undefined && (
                    <p className="mt-3 text-xs text-slate-500">
                      Remaining capacity:{" "}
                      {slot.remainingCapacity ?? 0}
                    </p>
                  )}

                  <Button
                    fullWidth
                    size="sm"
                    className="mt-4"
                    disabled={!isAvailable}
                    onClick={() => handleSelectSlot(slot)}
                  >
                    {isAvailable ? "Book Slot" : "Unavailable"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AvailableSlots;