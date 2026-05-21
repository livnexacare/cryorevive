---
title: Admin Panel for Event Bookings
status: done
priority: high
type: feature
tags: [admin, bookings, management, pricing]
created_by: agent
created_at: 2026-05-21T04:11:31Z
position: 8
---

## Notes
Admin panel to view and manage incoming event bookings. Includes authentication, bookings table with status updates, filtering, basic analytics, and tiered pricing management.

## Checklist
- [x] Create admin login page at /admin
- [x] Create bookings dashboard at /admin/dashboard
- [x] Add booking status management (pending, confirmed, completed, cancelled)
- [x] Add filter/search functionality
- [x] Add booking statistics
- [x] Add tiered pricing management (admin controls)
- [x] Run check_for_errors

## Acceptance
- Admin can log in at /admin
- Admin can view all bookings in a table
- Admin can change booking status and view details
- Admin can adjust event pricing for different athlete count tiers