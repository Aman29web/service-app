import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import api from "../../services/api";
// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const weekdays = [
  ["MONDAY", "Monday"],
  ["TUESDAY", "Tuesday"],
  ["WEDNESDAY", "Wednesday"],
  ["THURSDAY", "Thursday"],
  ["FRIDAY", "Friday"],
  ["SATURDAY", "Saturday"],
  ["SUNDAY", "Sunday"],
];

const Availability = () => {
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [offerings, setOfferings] = useState([]);

  const [selectedOffering, setSelectedOffering] =
    useState("");

  const [rules, setRules] = useState(
    weekdays.map(([day]) => ({
      weekday: day,
      enabled: false,
      windows: [
        {
          startTime: "09:00",
          endTime: "17:00",
          capacity: 1,
        },
      ],
    }))
  );

  const [exceptions, setExceptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("marketplace_user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    const loadData = async () => {
      try {
     const response = await api.get("/vendor/availability");

const data = response.data;
const result = data?.data || data;

        const serviceList =
          result.services ||
          result.items ||
          (Array.isArray(result) ? result : []);

        setServices(serviceList);

        const allOfferings = serviceList.flatMap(
          (service) =>
            (service.offerings || []).map(
              (offering) => ({
                ...offering,
                serviceTitle:
                  service.title || service.name,
              })
            )
        );

        setOfferings(allOfferings);

        if (allOfferings.length > 0) {
          setSelectedOffering(allOfferings[0].id);
        }
      } catch (err) {
        setError(err.message || "Unable to load availability.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
  if (!selectedOffering) return;

  const loadAvailability = async () => {
    try {
     const response = await api.get("/vendor/availability", {
  params: {
    offeringId: selectedOffering,
  },
});

      const data = response.data;
      const result = data?.data || data;

      if (result?.rules) {
        setRules(result.rules);
      }

      setExceptions(result?.exceptions || []);
    } catch (error) {
      console.error("Failed to load availability:", error);

      // Keep the default rules if no existing rules are returned.
    }
  };

  loadAvailability();
}, [selectedOffering]);

  const updateRule = (dayIndex, field, value) => {
    setRules((prev) =>
      prev.map((rule, index) =>
        index === dayIndex
          ? {
              ...rule,
              [field]: value,
            }
          : rule
      )
    );
  };

  const updateWindow = (
    dayIndex,
    windowIndex,
    field,
    value
  ) => {
    setRules((prev) =>
      prev.map((rule, index) => {
        if (index !== dayIndex) return rule;

        return {
          ...rule,
          windows: rule.windows.map(
            (window, wIndex) =>
              wIndex === windowIndex
                ? {
                    ...window,
                    [field]: value,
                  }
                : window
          ),
        };
      })
    );
  };

  const addWindow = (dayIndex) => {
    setRules((prev) =>
      prev.map((rule, index) =>
        index === dayIndex
          ? {
              ...rule,
              windows: [
                ...rule.windows,
                {
                  startTime: "09:00",
                  endTime: "17:00",
                  capacity: 1,
                },
              ],
            }
          : rule
      )
    );
  };

  const removeWindow = (dayIndex, windowIndex) => {
    setRules((prev) =>
      prev.map((rule, index) =>
        index === dayIndex
          ? {
              ...rule,
              windows: rule.windows.filter(
                (_, wIndex) =>
                  wIndex !== windowIndex
              ),
            }
          : rule
      )
    );
  };

  const addException = () => {
  setExceptions((prev) => [
    ...prev,
    {
      date: "",
      type: "CLOSED",
      windows: [],
    },
  ]);
};

  const updateException = (
    index,
    field,
    value
  ) => {
    setExceptions((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const removeException = (index) => {
    setExceptions((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!selectedOffering) {
    setError("Please select an offering.");
    return;
  }

  try {
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      offeringId: selectedOffering,

      rules: rules.map((rule) => ({
        weekday: rule.weekday,
        enabled: Boolean(rule.enabled),
        windows: (rule.windows || []).map((window) => ({
          startTime: window.startTime,
          endTime: window.endTime,
          capacity: Number(window.capacity),
        })),
      })),

      exceptions: exceptions
        .filter((exception) => exception.date)
        .map((exception) => ({
          date: exception.date,
          type: exception.type,
          windows:
            exception.type === "OPEN"
              ? [
                  {
                    startTime: exception.startTime,
                    endTime: exception.endTime,
                  },
                ]
              : [],
        })),
    };

    const response = await api.put(
      "/vendor/availability",
      payload
    );

    const data = response.data;

    if (!data?.success) {
      throw new Error(
        data?.message || "Unable to save availability."
      );
    }

    setMessage("Availability updated successfully.");
  } catch (err) {
    console.error("Availability save error:", err.response?.data);

    setError(
      err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to save availability."
    );
  } finally {
    setSaving(false);
  }
};

  const sidebarItems = [
    { label: "Dashboard", to: "/vendor/dashboard" },
    { label: "My Profile", to: "/vendor/profile" },
    { label: "My Services", to: "/vendor/services" },
    {
      label: "Create Service",
      to: "/vendor/services/create",
    },
    {
      label: "Availability",
      to: "/vendor/availability",
      end: true,
    },
    { label: "Bookings", to: "/vendor/bookings" },
  ];

 const handleLogout = () => {
  localStorage.removeItem("marketplace_access_token");
  localStorage.removeItem("marketplace_user");
};

  if (loading) {
    return <Loader fullScreen text="Loading availability..." />;
  }

  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
      sidebarTitle="Vendor"
      onLogout={handleLogout}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-900">
            Availability
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Configure weekly availability and exceptions.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Offering
            </label>

            <select
              value={selectedOffering}
              onChange={(e) =>
                setSelectedOffering(e.target.value)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {offerings.map((offering) => (
                <option
                  key={offering.id}
                  value={offering.id}
                >
                  {offering.serviceTitle} —{" "}
                  {offering.name}
                </option>
              ))}
            </select>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">
              Weekly Rules
            </h2>

            <div className="mt-5 space-y-4">
              {rules.map((rule, dayIndex) => (
                <div
                  key={rule.weekday}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) =>
                          updateRule(
                            dayIndex,
                            "enabled",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />

                      <span className="font-medium text-slate-800">
                        {weekdays.find(
                          ([value]) =>
                            value === rule.weekday
                        )?.[1] || rule.weekday}
                      </span>
                    </label>

                    {rule.enabled && (
                      <button
                        type="button"
                        onClick={() =>
                          addWindow(dayIndex)
                        }
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        + Add Window
                      </button>
                    )}
                  </div>

                  {rule.enabled && (
                    <div className="mt-4 space-y-3">
                      {rule.windows.map(
                        (window, windowIndex) => (
                          <div
                            key={windowIndex}
                            className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_120px_auto]"
                          >
                            <Input
                              label="Start"
                              type="time"
                              value={window.startTime}
                              onChange={(e) =>
                                updateWindow(
                                  dayIndex,
                                  windowIndex,
                                  "startTime",
                                  e.target.value
                                )
                              }
                            />

                            <Input
                              label="End"
                              type="time"
                              value={window.endTime}
                              onChange={(e) =>
                                updateWindow(
                                  dayIndex,
                                  windowIndex,
                                  "endTime",
                                  e.target.value
                                )
                              }
                            />

                            <Input
                              label="Capacity"
                              type="number"
                              min="1"
                              value={window.capacity}
                              onChange={(e) =>
                                updateWindow(
                                  dayIndex,
                                  windowIndex,
                                  "capacity",
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                            />

                            <button
                              type="button"
                              onClick={() =>
                                removeWindow(
                                  dayIndex,
                                  windowIndex
                                )
                              }
                              className="self-end pb-2 text-sm text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Date Exceptions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Close a date or add a one-off availability window.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addException}
              >
                Add Exception
              </Button>
            </div>

            <div className="mt-5 space-y-4">
              {exceptions.length === 0 && (
                <p className="text-sm text-slate-500">
                  No exceptions configured.
                </p>
              )}

              {exceptions.map((exception, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-[1fr_160px_1fr_1fr_auto]"
                >
                  <Input
                    label="Date"
                    type="date"
                    value={exception.date}
                    onChange={(e) =>
                      updateException(
                        index,
                        "date",
                        e.target.value
                      )
                    }
                  />

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Type
                    </label>

                    <select
                      value={exception.type}
                      onChange={(e) =>
                        updateException(
                          index,
                          "type",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                    >
                      <option value="CLOSED">
                        Closed
                      </option>
                      <option value="OPEN">
                        Open
                      </option>
                    </select>
                  </div>

                 {exception.type === "OPEN" && (
  <>
    <Input
      label="Start"
      type="time"
      value={exception.startTime || ""}
      onChange={(e) =>
        updateException(
          index,
          "startTime",
          e.target.value
        )
      }
    />

    <Input
      label="End"
      type="time"
      value={exception.endTime || ""}
      onChange={(e) =>
        updateException(
          index,
          "endTime",
          e.target.value
        )
      }
    />
  </>
)}

                  <button
                    type="button"
                    onClick={() =>
                      removeException(index)
                    }
                    className="self-end pb-2 text-sm text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={saving}
            >
              Save Availability
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Availability;