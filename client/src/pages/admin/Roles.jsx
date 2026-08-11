import { useEffect, useState } from "react";
import api from "../../services/api";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import { PERMISSIONS } from "../../utils/permissions";

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = async () => {
    try {
      const response = await api.get("/admin/roles");

      const data = response.data?.data || response.data;

      setRoles(data.roles || data.items || data || []);
    } catch (error) {
      console.error("Failed to load roles", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const updateRole = async (role) => {
    try {
      await api.patch(`/admin/roles/${role.id}`, {
        permissions: role.permissions,
      });
    } catch (error) {
      console.error("Failed to update role", error);
    }
  };

  const togglePermission = (roleId, permission) => {
    setRoles((current) =>
      current.map((role) => {
        if (role.id !== roleId) return role;

        const permissions = role.permissions || [];

        return {
          ...role,
          permissions: permissions.includes(permission)
            ? permissions.filter((item) => item !== permission)
            : [...permissions, permission],
        };
      })
    );
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <p className="text-sm text-gray-500">
          Manage granular permissions for roles.
        </p>
      </div>

      {roles.length === 0 ? (
        <EmptyState title="No roles found" />
      ) : (
        roles.map((role) => (
          <div
            key={role.id}
            className="rounded-xl border bg-white p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{role.name}</h2>
                <p className="text-sm text-gray-500">
                  {role.description || "Role permissions"}
                </p>
              </div>

              <Button onClick={() => updateRole(role)}>
                Save
              </Button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PERMISSIONS.map((permission) => (
                <label
                  key={permission}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                >
                  <input
                    type="checkbox"
                    checked={(role.permissions || []).includes(
                      permission
                    )}
                    onChange={() =>
                      togglePermission(role.id, permission)
                    }
                  />

                  <span className="text-sm">{permission}</span>
                </label>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}