# ServiceHub – Services Marketplace

ServiceHub is a three-sided services marketplace where customers can discover and book services, vendors can manage their services and availability, and admins can manage vendors, categories, bookings, payments, and permissions.

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication

## Main Features

### Customer
- Customer registration and login
- Browse and search published services
- View service details and available slots
- Book services
- View and cancel bookings
- Reschedule bookings
- View booking history

### Vendor
- Vendor registration
- Vendor profile management
- Vendor approval workflow
- Create and manage services
- Manage service offerings
- Configure weekly availability
- Configure date exceptions
- View and manage bookings
- Confirm, reject and complete bookings

### Admin
- Admin dashboard
- Approve/reject vendors
- Manage categories
- Manage services
- View and filter bookings
- Manage payments
- Manage roles and permissions
- Force-cancel bookings
- View audit information

## Booking Lifecycle

```text
PENDING
   ├── CONFIRMED
   │      ├── COMPLETED
   │      ├── CANCELLED
   │      └── NO_SHOW
   ├── REJECTED
   └── CANCELLED
