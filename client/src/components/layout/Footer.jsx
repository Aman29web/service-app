import React from "react";
import { Link } from "react-router-dom";

const Footer = ({
  brandName = "ServiceHub",
}) => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              to="/"
              className="text-lg font-bold text-slate-900"
            >
              {brandName}
            </Link>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              A simple and reliable marketplace for
              discovering and booking professional services.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link
              to="/services"
              className="text-slate-500 hover:text-slate-900"
            >
              Services
            </Link>

            <Link
              to="/login"
              className="text-slate-500 hover:text-slate-900"
            >
              Login
            </Link>

            <Link
              to="/signup"
              className="text-slate-500 hover:text-slate-900"
            >
              Sign Up
            </Link>
          </nav>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <p className="text-center text-xs text-slate-400 md:text-left">
            © {year} {brandName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;