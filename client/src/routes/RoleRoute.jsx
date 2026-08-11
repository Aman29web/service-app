import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function RoleRoute({ roles = [], children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role;

  if (
    userRole === "SUPER_ADMIN" ||
    roles.includes(userRole)
  ) {
    return children;
  }

  if (userRole === "CUSTOMER") {
    return <Navigate to="/customer" replace />;
  }

  if (userRole === "VENDOR") {
    return <Navigate to="/vendor" replace />;
  }

  return <Navigate to="/login" replace />;
}