# Suryam Supervision ERP

Static Supabase-powered ERP, CRM, field service and marketing website for a CCTV installation and security solutions company.

## Run locally

Open `index.html` directly or serve the folder with any static server. Configure Supabase before production by setting:

```html
<script>window.SURYAM_SUPABASE_URL='...'; window.SURYAM_SUPABASE_ANON_KEY='...';</script>
```

## Modules

- Public website with hero, service discovery, contact actions and free site survey route.
- ERP shell with dashboard, CRM, customers, inventory, installation, service, AMC, employees, accounts, reports and settings routes.
- Store abstraction is the only Supabase access layer and includes local offline fallback for development.
- PostgreSQL schema includes core profiles, customers, leads, products, service tickets, audit logs, indexes, triggers, RLS and seed products.
