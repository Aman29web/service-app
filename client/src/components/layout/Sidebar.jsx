import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = ({
  items = [],
  isOpen = true,
  onClose,
  title = "Dashboard",
  user = null,
}) => {
  const hasPermission = (item) => {
    if (!item.permission) {
      return true;
    }

    if (!user?.permissions) {
      return false;
    }

    return user.permissions.includes(item.permission);
  };

  const visibleItems = items.filter(hasPermission);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          flex
          w-64
          flex-col
          border-r
          border-slate-200
          bg-white
          transition-transform
          duration-200
          lg:static
          lg:z-auto
          lg:translate-x-0
          ${
            isOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {title}
            </p>

            {user?.role && (
              <p className="mt-0.5 text-xs text-slate-500">
                {user.role.replaceAll("_", " ")}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {visibleItems.map((item) => {
              if (item.section) {
                return (
                  <p
                    key={item.section}
                    className="mb-2 mt-5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 first:mt-0"
                  >
                    {item.section}
                  </p>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `
                      flex
                      items-center
                      gap-3
                      rounded-lg
                      px-3
                      py-2.5
                      text-sm
                      font-medium
                      transition-colors
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }
                    `
                  }
                >
                  {item.icon && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                      {item.icon}
                    </span>
                  )}

                  <span className="truncate">
                    {item.label}
                  </span>

                  {item.badge !== undefined && (
                    <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-200 p-4">
          {user && (
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="truncate text-sm font-medium text-slate-800">
                {user.name || user.email}
              </p>

              {user.email && user.name && (
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {user.email}
                </p>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;