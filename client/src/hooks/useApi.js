import { useCallback, useState } from "react";
import api from "../services/api";

export default function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, url, data, config = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api({
        method,
        url,
        data,
        ...config,
      });

      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Something went wrong";

      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    request,
  };
}