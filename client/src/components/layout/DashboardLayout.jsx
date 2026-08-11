import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const DashboardLayout = ({
  children,
  user = null,
  sidebarItems = [],
  navbarLinks = [],
  sidebarTitle = "Dashboard",
  brandName = "ServiceHub",
  onLogout,
  showFooter = true,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        user={user}
        links={navbarLinks}
        brandName={brandName}
        onLogout={onLogout}
      />

      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar
          items={sidebarItems}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          title={sidebarTitle}
          user={user}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <span className="text-lg">☰</span>
              Menu
            </button>
          </div>

          <main className="flex-1">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </main>

          {showFooter && <Footer brandName={brandName} />}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;