import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import authService from "../services/authService";

export const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = "marketplace_access_token";
const USER_KEY = "marketplace_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(() =>
    localStorage.getItem(ACCESS_TOKEN_KEY)
  );

  const [loading, setLoading] = useState(true);

  const saveAuth = useCallback((data) => {
    const token = data?.accessToken || data?.token;
    const currentUser = data?.user;

    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      setAccessToken(token);
    }

    if (currentUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      setUser(currentUser);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout request failed", error);
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.me();

      const data = response?.data?.data || response?.data;

      if (data) {
        setUser(data.user || data);
        localStorage.setItem(
          USER_KEY,
          JSON.stringify(data.user || data)
        );
      }
    } catch (error) {
      if (error.response?.status === 401) {
        await logout();
      }
    }
  }, [logout]);

  useEffect(() => {
    const initialize = async () => {
      if (accessToken) {
        await refreshUser();
      }

      setLoading(false);
    };

    initialize();
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    const data = response?.data?.data || response?.data;

    saveAuth(data);

    return data;
  };

  const registerCustomer = async (payload) => {
    const response = await authService.registerCustomer(payload);
    const data = response?.data?.data || response?.data;

    saveAuth(data);

    return data;
  };

  const registerVendor = async (payload) => {
    const response = await authService.registerVendor(payload);
    const data = response?.data?.data || response?.data;

    saveAuth(data);

    return data;
  };

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      isAuthenticated: Boolean(accessToken && user),
      login,
      registerCustomer,
      registerVendor,
      logout,
      refreshUser,
    }),
    [
      user,
      accessToken,
      loading,
      login,
      registerCustomer,
      registerVendor,
      logout,
      refreshUser,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}