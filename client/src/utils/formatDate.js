export function formatDate(date, options = {}) {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    options.locale || "en-IN",
    {
      dateStyle: options.dateStyle || "medium",
      timeStyle: options.timeStyle,
      timeZone: options.timeZone,
    }
  ).format(parsedDate);
}

export function formatDateOnly(date) {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(parsedDate);
}

export function formatTime(date) {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(parsedDate);
}