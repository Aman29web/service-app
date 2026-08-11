import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BookService = () => {
  const { id: serviceId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const offeringId = searchParams.get("offering");
  const slot = searchParams.get("slot");
  const date = searchParams.get("date");

  const [service, setService] = useState(null);
  const [offering, setOffering] = useState(null);

  const [paymentMode, setPaymentMode] = useState("PAY_NOW");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}/services/${serviceId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load service.");
        }

        const result = data.data || data;

        setService(result);

        const selectedOffering = (
          result.offerings || []
        ).find((item) => item.id === offeringId);

        setOffering(selectedOffering || null);
      } catch (err) {
        setError(err.message || "Unable to load booking details.");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [serviceId, offeringId]);

  const handleBooking = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      navigate("/login", {
        state: {
          from: {
            pathname: `/services/${serviceId}/book`,
          },
        },
      });

      return;
    }

    if (!offeringId || !slot || !date) {
      setError("The selected slot is invalid.");
      return;
    }

    try {
      setBooking(true);
      setError("");

      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId,
          offeringId,
          date,
          startTime: slot,
          paymentMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to create booking."
        );
      }

      const bookingData = data.data || data;

      navigate(
        `/customer/bookings/${bookingData.id || bookingData.bookingId}`
      );
    } catch (err) {
      setError(err.message || "Unable to create booking.");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return <Loader fullScreen text="Preparing booking..." />;
  }

  if (error && !service) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          to={`/services/${serviceId}/slots?offering=${offeringId}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to Slots
        </Link>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Confirm Booking
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review your booking before confirming.
          </p>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-7 divide-y divide-slate-200 rounded-xl border border-slate-200">
            <div className="p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Service
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {service?.title || service?.name}
              </p>
            </div>

            <div className="p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Offering
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {offering?.name || "Selected offering"}
              </p>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Date
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {date || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Start
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {slot || "-"}
                </p>
              </div>
            </div>

            <div className="p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Price
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {offering?.currency || "₹"}{" "}
                {Number(offering?.price || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-7">
            <p className="mb-3 text-sm font-medium text-slate-700">
              Payment Mode
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={`cursor-pointer rounded-xl border p-4 ${
                  paymentMode === "PAY_NOW"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  value="PAY_NOW"
                  checked={paymentMode === "PAY_NOW"}
                  onChange={(e) =>
                    setPaymentMode(e.target.value)
                  }
                  className="sr-only"
                />

                <span className="font-medium text-slate-900">
                  Pay Now
                </span>

                <span className="mt-1 block text-xs text-slate-500">
                  Payment is processed before confirmation.
                </span>
              </label>

              <label
                className={`cursor-pointer rounded-xl border p-4 ${
                  paymentMode === "PAY_AFTER"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  value="PAY_AFTER"
                  checked={paymentMode === "PAY_AFTER"}
                  onChange={(e) =>
                    setPaymentMode(e.target.value)
                  }
                  className="sr-only"
                />

                <span className="font-medium text-slate-900">
                  Pay After
                </span>

                <span className="mt-1 block text-xs text-slate-500">
                  Payment is collected after the service.
                </span>
              </label>
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            className="mt-7"
            loading={booking}
            onClick={handleBooking}
          >
            Confirm Booking
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookService;