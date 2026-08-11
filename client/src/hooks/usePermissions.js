import useAuth from "./useAuth";

export default function usePermissions() {
  const { user } = useAuth();

  const permissions = user?.permissions || [];

  const hasPermission = (permission) => {
    if (user?.role === "SUPER_ADMIN") {
      return true;
    }

    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions = []) => {
    return requiredPermissions.some(hasPermission);
  };

  const hasAllPermissions = (requiredPermissions = []) => {
    return requiredPermissions.every(hasPermission);
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}