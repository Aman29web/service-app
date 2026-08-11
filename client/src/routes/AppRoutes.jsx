import { Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/auth/Login";
import CustomerSignup from "../pages/auth/CustomerSignup";
import VendorSignup from "../pages/auth/VendorSignup";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

import CustomerDashboard from "../pages/customer/CustomerDashboard";
import Services from "../pages/customer/Services";
import ServiceDetails from "../pages/customer/ServiceDetails";
import AvailableSlots from "../pages/customer/AvailableSlots";
import BookService from "../pages/customer/BookService";
import MyBookings from "../pages/customer/MyBookings";

import VendorDashboard from "../pages/vendor/VendorDashboard";
import VendorProfile from "../pages/vendor/VendorProfile";
import MyServices from "../pages/vendor/MyServices";
import CreateService from "../pages/vendor/CreateService";
import EditService from "../pages/vendor/EditService";
import Availability from "../pages/vendor/Availability";
import VendorBookings from "../pages/vendor/VendorBookings";

import AdminDashboard from "../pages/admin/AdminDashboard";
import Vendors from "../pages/admin/Vendors";
import VendorApproval from "../pages/admin/VendorApproval";
import Categories from "../pages/admin/Categories";
import Bookings from "../pages/admin/Bookings";
import Payments from "../pages/admin/Payments";
import Roles from "../pages/admin/Roles";
import AuditLogs from "../pages/admin/AuditLogs";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

const CustomerRoute = ({ children }) => (
  <ProtectedRoute>
    <RoleRoute roles={["CUSTOMER"]}>{children}</RoleRoute>
  </ProtectedRoute>
);

const VendorRoute = ({ children }) => (
  <ProtectedRoute>
    <RoleRoute roles={["VENDOR"]}>{children}</RoleRoute>
  </ProtectedRoute>
);

const AdminRoute = ({ children }) => (
  <ProtectedRoute>
    <RoleRoute roles={["ADMIN", "SUPER_ADMIN"]}>
      {children}
    </RoleRoute>
  </ProtectedRoute>
);

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/customer-signup" element={<CustomerSignup />} />
      <Route path="/vendor-signup" element={<VendorSignup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/customer"
        element={<CustomerRoute><CustomerDashboard /></CustomerRoute>}
      />

      <Route
        path="/services"
        element={<CustomerRoute><Services /></CustomerRoute>}
      />

      <Route
        path="/services/:id"
        element={<CustomerRoute><ServiceDetails /></CustomerRoute>}
      />

      <Route
        path="/services/:id/slots"
        element={<CustomerRoute><AvailableSlots /></CustomerRoute>}
      />

      <Route
        path="/services/:id/book"
        element={<CustomerRoute><BookService /></CustomerRoute>}
      />

      <Route
        path="/customer/bookings"
        element={<CustomerRoute><MyBookings /></CustomerRoute>}
      />

      <Route
        path="/vendor"
        element={<VendorRoute><VendorDashboard /></VendorRoute>}
      />

      <Route
        path="/vendor/profile"
        element={<VendorRoute><VendorProfile /></VendorRoute>}
      />

      <Route
        path="/vendor/services"
        element={<VendorRoute><MyServices /></VendorRoute>}
      />

      <Route
        path="/vendor/services/create"
        element={<VendorRoute><CreateService /></VendorRoute>}
      />

      <Route
        path="/vendor/services/:id/edit"
        element={<VendorRoute><EditService /></VendorRoute>}
      />

      <Route
        path="/vendor/availability"
        element={<VendorRoute><Availability /></VendorRoute>}
      />

      <Route
        path="/vendor/bookings"
        element={<VendorRoute><VendorBookings /></VendorRoute>}
      />

      <Route
        path="/admin"
        element={<AdminRoute><AdminDashboard /></AdminRoute>}
      />

      <Route
        path="/admin/vendors"
        element={<AdminRoute><Vendors /></AdminRoute>}
      />

      <Route
        path="/admin/vendor-approval"
        element={<AdminRoute><VendorApproval /></AdminRoute>}
      />

      <Route
        path="/admin/categories"
        element={<AdminRoute><Categories /></AdminRoute>}
      />

      <Route
        path="/admin/bookings"
        element={<AdminRoute><Bookings /></AdminRoute>}
      />

      <Route
        path="/admin/payments"
        element={<AdminRoute><Payments /></AdminRoute>}
      />

      <Route
        path="/admin/roles"
        element={<AdminRoute><Roles /></AdminRoute>}
      />

      <Route
        path="/admin/audit-logs"
        element={<AdminRoute><AuditLogs /></AdminRoute>}
      />

      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}