import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadService = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/services/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load service.");
        }

        setService(data.data || data);
      } catch (err) {
        setError(err.message || "Unable to load service.");
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [id]);

  if (loading) {
    return <Loader fullScreen text="Loading service..." />;
  }

  if (error || !service) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          title="Service not found"
          description={error || "This service is no longer available."}
          actionLabel="Browse Services"
          onAction={() => navigate("/services")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/services"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to Services
        </Link>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {service.imageUrl ? (
            <img
              src={service.imageUrl}
              alt={service.title}
              className="h-64 w-full object-cover sm:h-80"
            />
          ) : (
            <div className="flex h-64 items-center justify-center bg-slate-100 text-slate-400 sm:h-80">
              No Image
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  {service.category?.name || "Service"}
                </p>

                <h1 className="mt-2 text-3xl font-bold text-slate-900">
                  {service.title || service.name}
                </h1>

                <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {service.description ||
                    "No description available."}
                </p>

                {service.vendor && (
                  <div className="mt-7 border-t border-slate-200 pt-5">
                    <p className="text-sm text-slate-500">
                      Provided by
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {service.vendor.businessName ||
                        service.vendor.name}
                    </p>

                    {service.vendor.address && (
                      <p className="mt-1 text-sm text-slate-500">
                        {service.vendor.address}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <h2 className="font-semibold text-slate-900">
                  Offerings
                </h2>

                <div className="mt-4 space-y-3">
                  {(service.offerings || []).length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No offerings available.
                    </p>
                  ) : (
                    service.offerings.map((offering) => (
                      <div
                        key={offering.id}
                        className="rounded-lg border border-slate-200 bg-white p-4"
                      >
                        <p className="font-medium text-slate-900">
                          {offering.name}
                        </p>

                        <div className="mt-2 flex justify-between gap-3 text-sm">
                          <span className="text-slate-500">
                            {offering.durationMinutes} minutes
                          </span>

                          <span className="font-semibold text-slate-900">
                            {offering.currency || "₹"}{" "}
                            {Number(
                              offering.price || 0
                            ).toLocaleString()}
                          </span>
                        </div>

                        <Button
                          fullWidth
                          size="sm"
                          className="mt-4"
                          onClick={() =>
                            navigate(
                              `/services/${id}/slots?offering=${offering.id}`
                            )
                          }
                        >
                          View Available Slots
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;