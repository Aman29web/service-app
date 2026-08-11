import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import api from "../../services/api";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CreateService = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    status: "DRAFT",
  });

  const [offerings, setOfferings] = useState([
    {
      name: "",
      durationMinutes: 60,
      price: "",
      currency: "INR",
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

const loadCategories = async () => {
  try {
    const response = await api.get("/categories");

    console.log("CATEGORY RESPONSE:", response.data);

    const data = response.data;

    const categoryList =
      Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.data?.categories)
        ? data.data.categories
        : Array.isArray(data?.categories)
        ? data.categories
        : Array.isArray(data?.items)
        ? data.items
        : [];

    console.log("CATEGORY LIST:", categoryList);

    setCategories(categoryList);
  } catch (err) {
    console.error("CATEGORY ERROR:", err);
    setError(
      err.response?.data?.message ||
        "Unable to load categories."
    );
  } finally {
    setLoading(false);
  }
};

    loadCategories();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleOfferingChange = (index, field, value) => {
    setOfferings((prev) =>
      prev.map((offering, i) =>
        i === index
          ? {
              ...offering,
              [field]: value,
            }
          : offering
      )
    );
  };

  const addOffering = () => {
    setOfferings((prev) => [
      ...prev,
      {
        name: "",
        durationMinutes: 60,
        price: "",
        currency: "INR",
      },
    ]);
  };

  const removeOffering = (index) => {
    if (offerings.length === 1) {
      return;
    }

    setOfferings((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.title.trim()) {
      setError("Service title is required.");
      return;
    }

    if (!form.categoryId) {
      setError("Please select a category.");
      return;
    }

    if (
      offerings.some(
        (item) =>
          !item.name.trim() ||
          !item.durationMinutes ||
          item.price === ""
      )
    ) {
      setError("Please complete all offering details.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("accessToken");

    const response = await api.post("/services", {
  ...form,
  offerings: offerings.map((item) => ({
    ...item,
    durationMinutes: Number(item.durationMinutes),
    price: Number(item.price),
  })),
});
     const data = response.data;

if (!data?.success) {
  throw new Error(
    data?.message || "Unable to create service."
  );
}

      navigate("/vendor/services");
    } catch (err) {
      setError(err.message || "Unable to create service.");
    } finally {
      setSaving(false);
    }
  };

  const sidebarItems = [
    {
      label: "Dashboard",
      to: "/vendor/dashboard",
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
      end: true,
    },
    {
      label: "Availability",
      to: "/vendor/availability",
    },
    {
      label: "Bookings",
      to: "/vendor/bookings",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  };

  if (loading) {
    return <Loader fullScreen text="Preparing service form..." />;
  }

  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
      sidebarTitle="Vendor"
      onLogout={handleLogout}
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-900">
            Create Service
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Add a service and one or more offerings.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">
              Service Information
            </h2>

            <div className="mt-5 space-y-5">
              <Input
                label="Service Title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Home Cleaning"
                required
              />

              <Input
                label="Description"
                name="description"
                type="textarea"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe your service..."
                rows={5}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Category <span className="text-red-500">*</span>
                </label>

                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.length === 0 ? (
                    <option value="" disabled>
                      No categories available. Add categories first.
                    </option>
                    
                  ) : (
                    categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Offerings
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Define duration and price for each offering.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOffering}
              >
                Add Offering
              </Button>
            </div>

            <div className="mt-5 space-y-5">
              {offerings.map((offering, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">
                      Offering {index + 1}
                    </p>

                    {offerings.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeOffering(index)
                        }
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Offering Name"
                      value={offering.name}
                      onChange={(e) =>
                        handleOfferingChange(
                          index,
                          "name",
                          e.target.value
                        )
                      }
                      placeholder="e.g. Standard Cleaning"
                      required
                    />

                    <Input
                      label="Duration (minutes)"
                      type="number"
                      min="1"
                      value={offering.durationMinutes}
                      onChange={(e) =>
                        handleOfferingChange(
                          index,
                          "durationMinutes",
                          e.target.value
                        )
                      }
                      required
                    />

                    <Input
                      label="Price"
                      type="number"
                      min="0"
                      step="1"
                      value={offering.price}
                      onChange={(e) =>
                        handleOfferingChange(
                          index,
                          "price",
                          e.target.value
                        )
                      }
                      placeholder="0"
                      required
                    />

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Currency
                      </label>

                      <select
                        value={offering.currency}
                        onChange={(e) =>
                          handleOfferingChange(
                            index,
                            "currency",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                        <option value="AED">AED</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/vendor/services")}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={saving}
            >
              Create Service
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateService;