export const API_URL = (() => {
  const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const normalized = String(rawUrl).trim().replace(/\/+$|\s+/g, "");

  if (/\/api$/i.test(normalized)) {
    return normalized;
  }

  return `${normalized}/api`;
})();
