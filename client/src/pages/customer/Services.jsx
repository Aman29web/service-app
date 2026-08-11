import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import api from "../../services/api";
// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Services = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

useEffect(() => {
  const loadCategories = async () => {
    try {
      const response = await api.get("/categories");

      const data = response.data;

      const categoriesData =
        data?.data?.categories ||
        data?.data ||
        data?.categories ||
        [];

      setCategories(
        Array.isArray(categoriesData) ? categoriesData : []
      );
    } catch (error) {
      console.error("Failed to load categories:", error);
      setCategories([]);
    }
  };

  loadCategories();
}, []);

  useEffect(() => {
  const controller = new AbortController();

  const loadServices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/services", {
        params: {
          page,
          limit: 12,
          ...(search ? { search } : {}),
          ...(category ? { category } : {}),
        },
        signal: controller.signal,
      });

      const data = response.data;
      const result = data?.data || data;

      setServices(
        result?.services ||
          result?.items ||
          (Array.isArray(result) ? result : [])
      );

      setTotalPages(
        result?.pagination?.totalPages ||
          result?.totalPages ||
          1
      );
    } catch (err) {
      if (err.name !== "CanceledError" && err.name !== "AbortError") {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load services."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  loadServices();

  return () => controller.abort();
}, [page, search, category]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Services
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Browse services from approved vendors.
          </p>
        </div>

        <div className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_240px]">
          <Input
            label="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search services..."
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Category
            </label>

            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Categories</option>

              {categories.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <Loader text="Loading services..." />
        ) : services.length === 0 ? (
          <EmptyState
            title="No services found"
            description="Try changing your search or category filter."
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  {service.imageUrl ? (
                    <img
                      src={service.imageUrl}
                      alt={service.title}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-slate-100 text-slate-400">
                      No Image
                    </div>
                  )}

                  <div className="p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                      {service.category?.name || "Service"}
                    </p>

                    <h2 className="mt-2 text-lg font-semibold text-slate-900">
                      {service.title || service.name}
                    </h2>

                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                      {service.description || "No description available."}
                    </p>

                    {service.vendor && (
                      <p className="mt-4 text-sm text-slate-500">
                        Vendor:{" "}
                        <span className="font-medium text-slate-700">
                        {service.vendor.businessName ||
  service.vendor.user?.name}
                        </span>
                      </p>
                    )}

                    <Link
                      to={`/services/${service.id}`}
                      className="mt-5 block rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      View Service
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Services;