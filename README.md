# Suryam Supervision ERP

Static Supabase-powered ERP foundation for a CCTV installation and security solutions company. The application is intentionally modular: every feature module must use `Store.js` for data access, the centralized permission engine for authorization checks, and the shared UI primitives for consistent enterprise screens.

## Run locally

Open `index.html` directly or serve the folder with any static server. Configure Supabase before production by setting:

```html
<script>window.SURYAM_SUPABASE_URL='...'; window.SURYAM_SUPABASE_ANON_KEY='...';</script>
```

## Enterprise database foundation

`sql/schema.sql` defines the normalized production schema for:

- Company settings, branches, profiles, employees and engineers.
- RBAC tables: `roles`, `permissions`, `role_permissions`, and `user_roles`.
- Customers with addresses, contacts, documents, notes and installed assets.
- Customer asset lifecycle tables for locations, service history, warranty and photos.
- Lead source/status/follow-up foundation for later CRM work.
- Product catalog, brands, categories, warehouses, racks, bins and stock movements.
- Notifications, activity logs, audit logs and key/value settings.

The schema includes primary keys, foreign keys, soft-delete columns, created/updated audit columns, indexes, views, triggers, and helper functions.

## RBAC and permission engine

RBAC is data-driven and should never be hardcoded in modules. Database permissions support these actions for each module/table:

- `view`
- `create`
- `edit`
- `delete`
- `export`
- `approve`
- `print`
- `upload`
- `configure`

Seed roles include Admin, Manager, Sales, Installation Engineer, Service Engineer, Store Manager, HR, Accounts, Employee, Customer and Viewer. `js/permissions.js` centralizes client-side checks with helpers such as `canView()`, `canCreate()`, `canEdit()`, `canDelete()`, `canApprove()`, `canExport()` and `canPrint()`.

## Authentication platform

`js/auth.js` now restores and refreshes sessions, loads profile/role/permission/company/branch context, applies theme preferences, initializes the permission engine, and redirects users based on their role context.

## Store layer

`js/store.js` remains the only Supabase access layer. It preserves the existing API and adds reusable platform operations:

- Pagination, filtering, sorting, search and count support.
- Bulk insert, update and soft delete helpers.
- RPC helpers.
- Storage upload and delete helpers.
- Sequential transaction orchestration.
- Offline queue and retry support for development/offline operation.

## Customer asset management

Installed devices are represented as tracked customer assets. Supported asset types include Camera, NVR, DVR, UPS, SMPS, Switch, Hard Disk, Cable, Access Control, Biometric, Intercom, Boom Barrier and Fire Alarm. Each asset supports QR code, barcode, serial number, purchase/installation dates, warranty, AMC status, customer/location assignment, photos, configuration, service dates, engineer assignment and lifecycle status.

## Warehouse foundation

Inventory storage is normalized around warehouses, racks and bins. Bins track available, reserved and issued stock so future inventory workflows can reserve, issue and adjust stock without changing the data model.

## Notification engine

Notifications support browser, email, WhatsApp and SMS channels with scheduling, delivery status, read timestamps and JSON payloads for future reminder automation.

## Audit system

The `audit_row_change()` trigger records INSERT, UPDATE and DELETE activity into `audit_logs`, including actor, entity/table, record id, old value, new value and timestamp. `activity_logs` remains available for higher-level business events.

## Row level security

RLS is enabled across enterprise tables. Policies route access through the database permission function `has_permission()`, with additional owner/assignment-oriented policies for profiles and leads. Future policies should continue to model these rules:

- Admin: full access through permissions.
- Manager: branch-scoped operational access.
- Sales: own/assigned leads and customer follow-up data.
- Engineers: assigned installation/service work and assets.
- Accounts: accounting data.
- HR: employee data.
- Customer: own customer/assets/service records.

## Router and UI foundation

The router supports protected routes, permission guards, 404 handling and forbidden-state rendering. Shared UI helpers now include loading spinners, empty/error states, skeleton loaders, confirmation dialog markup, toasts, drawers, modals and reusable data tables.

## Current modules

- Public website with hero, service discovery, contact actions and free site survey route.
- ERP shell with dashboard, CRM, customers, inventory, installation, service, AMC, employees, accounts, reports and settings routes.
- This PR intentionally does not build CRM, inventory, installation or service screens; it only establishes the reusable enterprise foundation for future modules.
