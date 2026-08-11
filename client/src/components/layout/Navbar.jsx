import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Button from "../common/Button";

const Navbar = ({
  user = null,
  onLogout,
  links = [],
  brandName = "ServiceHub",
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await onLogout?.();
    } finally {
      setIsMobileMenuOpen(false);
      navigate("/login");
    }
  };

  const getDashboardPath = () => {
    if (!user?.role) {
      return "/";
    }

    switch (user.role) {
      case "SUPER_ADMIN":
      case "ADMIN":
      case "SUB_ADMIN":
        return "/admin/dashboard";

      case "VENDOR":
        return "/vendor/dashboard";

      case "CUSTOMER":
        return "/customer/dashboard";

      default:
        return "/";
    }
  };

  const navLinkClasses = ({ isActive }) =>
    `
      rounded-md
      px-3
      py-2
      text-sm
      font-medium
      transition-colors
      ${
        isActive
          ? "bg-blue-50 text-blue-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }
    `;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          to={getDashboardPath()}
          className="flex items-center gap-2"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            SH
          </div>

          <span className="text-lg font-bold text-slate-900">
            {brandName}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={navLinkClasses}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop User */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">
                  {user.name || user.email}
                </p>

                {user.role && (
                  <p className="text-xs text-slate-500">
                    {user.role.replaceAll("_", " ")}
                  </p>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() =>
            setIsMobileMenuOpen((prev) => !prev)
          }
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className="block h-0.5 w-6 bg-current" />
          <span className="mt-1.5 block h-0.5 w-6 bg-current" />
          <span className="mt-1.5 block h-0.5 w-6 bg-current" />
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() =>
                    setIsMobileMenuOpen(false)
                  }
                  className={navLinkClasses}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-4 border-t border-slate-200 pt-4">
              {user ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {user.name || user.email}
                    </p>

                    {user.role && (
                      <p className="text-xs text-slate-500">
                        {user.role.replaceAll("_", " ")}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  fullWidth
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate("/login");
                  }}
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;