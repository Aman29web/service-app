export const PERMISSIONS = [
  "service.create",
  "service.update",
  "service.delete",
  "service.publish",
  "service.suspend",

  "booking.create",
  "booking.view",
  "booking.cancel",
  "booking.update",

  "vendor.view",
  "vendor.approve",
  "vendor.reject",
  "vendor.update",

  "category.create",
  "category.update",
  "category.delete",

  "payment.view",
  "payment.refund",

  "role.create",
  "role.update",
  "role.assign",

  "audit.view",

  "admin.dashboard",
];

export const ROLE_PERMISSIONS = {
  CUSTOMER: [
    "booking.create",
    "booking.view",
    "booking.cancel",
  ],

  VENDOR: [
    "service.create",
    "service.update",
    "service.delete",
    "service.publish",
    "booking.view",
    "booking.update",
  ],

  ADMIN: [
    "admin.dashboard",
    "vendor.view",
    "vendor.approve",
    "vendor.reject",
    "category.create",
    "category.update",
    "category.delete",
    "booking.view",
    "booking.cancel",
    "payment.view",
    "role.view",
    "audit.view",
  ],

  SUPER_ADMIN: ["*"],
};

export function hasPermission(user, permission) {
  if (!user) return false;

  if (user.role === "SUPER_ADMIN") {
    return true;
  }

  return (user.permissions || []).includes(permission);
}