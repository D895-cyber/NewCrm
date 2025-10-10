## CRM Technical README

This document consolidates the technical architecture, database schema, API surface, environment configuration, and operational guidance for the Projector Warranty CRM.

---

## Architecture Overview

- Frontend: React 18 + TypeScript (Vite) with mobile-first UI
- Backend: Node.js (Express) with modular route controllers
- Database: MongoDB via Mongoose ODM
- Storage: Local `uploads/` in development; Cloud options (Cloudinary/S3) in production
- Background services: Scheduler and shipment tracking updaters

High-level layers:

```
Presentation (React Web, Mobile UI)
   ↓
API Gateway (REST, Uploads, Auth)
   ↓
Business Logic (Visits, Tickets, RMA, Inventory, Analytics)
   ↓
Data Access (Mongoose)
   ↓
Infrastructure (MongoDB, Cloud Storage, Cache)
```

Key server entrypoint: `backend/server/index.js` (CORS, security via Helmet, route mounting, DB connection, SPA fallback).

---

## Project Structure (high-level)

- `frontend/`: React app (components, pages, mobile views, utils)
- `backend/`
  - `server/models/`: Mongoose schemas (see Schema section)
  - `server/routes/`: Express route modules
  - `server/services/`: domain services (e.g., analytics, workflow, tracking)
  - `server/scripts/`: admin/maintenance scripts (imports, fixes)
- `uploads/`, `cloud-storage/`: local file serving mounts
- Root scripts and deployment docs: `deploy*.sh/.bat`, `render.yaml`, `apprunner.yaml`, various guides

---

## Environment & Configuration

Use `.env` under `backend/server/` (and optionally at `backend/`) based on `env.example`.

```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/projector_warranty
JWT_SECRET=your-super-secret-jwt-key-here

# Optional CORS/frontend origin
# FRONTEND_URL=https://your-service.onrender.com
# ALLOWED_ORIGINS=https://custom-domain.com

# Cloudinary (if enabled)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email SMTP (notifications)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
ADMIN_EMAIL=admin@projectorcare.com
MANAGER_EMAIL=manager@projectorcare.com

# Optional Sentry
SENTRY_DSN=your-sentry-dsn
```

Notes
- Health check: `GET /api/health` returns status, DB connection, environment, version
- Static assets: `uploads/` and `cloud-storage/` are exposed under `/uploads` and `/cloud-storage`
- CORS is environment-aware and can be customized with `FRONTEND_URL` and `ALLOWED_ORIGINS`

---

## Database Schema (MongoDB via Mongoose)

Primary models (see `backend/server/models/`):

- User
  - `userId` (auto `USER-*`), `username`, `email` (unique), `password` (bcrypt-hashed)
  - `role` enum: `admin`, `fse`; derived permissions via `getPermissions()`
  - Optional `fseId` link, `isActive`, `lastLogin`, `profile`

- FSE (Field Service Engineer)
  - Engineer identity, contact, specialization, territories, status, notification prefs

- Site
  - Unique `name`, `siteCode` (uppercase), `region`, `state`, full `address`
  - `contactPerson`, `businessHours`, `siteType`, `status`
  - Embedded `auditoriums[]` with projector counts and status
  - Calculated totals: `totalProjectors`, `activeProjectors`, `totalAuditoriums`
  - Service and contract snapshot: `lastServiceDate`, `nextScheduledService`, `contractDetails{ serviceLevel }`

- Projector
  - Keys: `projectorNumber`, `serialNumber` (unique), `model`, `brand`
  - Relations: `siteId` (+ denormalized `siteName`, `siteCode`), `auditoriumId/name`
  - Warranty: `installDate`, `warrantyStart`, `warrantyEnd` with computed `warrantyStatus`
  - Status/condition enums, service metrics, AMC link `amcContractId`, RMA links, maintenance history

- AMCContract
  - `contractNumber` (`AMC-YYYY-####`), contract period, service schedule, status, financials
  - Coverage set, FSE assignment, history, virtuals (status/next due)

- ServiceAssignment
  - `assignmentId` (`ASSIGN-*`), description, assigned FSE + projectors with service types and schedule strategy
  - Auto-generated multi-day schedule, progress metrics, notes, audit trail

- ServiceVisit
  - `visitId` (`VISIT-*`), references FSE/Site/Projector/AMC
  - Status workflow, photo-first workflow flags, signatures, issues/recommendations, expenses, feedback

- ServiceReport
  - Detailed ASCOMP-aligned report fields, measurements, gallery, signatures, metadata

- ServiceTicket
  - `ticketNumber` (`ST-YYYY-####`), AMC and projector linkage, schedule type, priorities, status workflow, history

- CallLog
  - `callLogNumber` (`CL-YYYY-###`), issue details, priority, status, SLA, escalations, satisfaction rating

- DTR (Daily Trouble Report)
  - Projector issues lifecycle, SLA, escalation, RMA workflow linkage, resolution metrics

- RMA
  - `rmaNumber` (`RMA-YYYY-###`), core IDs, mandatory dates
  - Product/defect details, replacement, expanded shipping objects (outbound & return) + legacy fields
  - Case/approval status, warranty state, SLA counters, tracking history, delivery provider integration, cost tracking

- SparePart / RecommendedSparePart
  - Inventory details, thresholds, pricing, supplier, storage location; recommendation metadata

- PurchaseOrder / ProformaInvoice
  - Line items, financial summaries, approval workflow, OEM PO substructure, virtuals for overdue/delivery

- AuditLog
  - Actor, action, payload context for traceability

- DeliveryProvider
  - Carrier API credentials, webhook endpoints, sync metadata

- Service (catalog)
  - Canonical service types, durations, categories, pricing

- ReportTemplate, PartComment, ProjectorMovement, ProjectorStatus
  - Supporting models for report formats, part discussion threads, logistics and state tracking

Relationships at a glance

```
Site ──1:N── Projector ──1:1── AMCContract ──↔── ServiceTicket ──↔── ServiceVisit ──→ ServiceReport
                                      │                                   
                                      └── RMA / DTR / CallLog (as needed)

Inventory across flows: SparePart ⇄ RecommendedSparePart ⇄ PurchaseOrder ⇄ ProformaInvoice
Users ↔ FSE (optional mapping); AuditLog and DeliveryProvider provide telemetry & integrations
```

Indexes
- Common indexes exist on lookups such as `siteCode`, `status`, dates, and nested fields to improve query performance (see individual schema files).

---

## API Surface

Base URL: `/api`

Mounted route groups (from `backend/server/index.js`):

- Auth: `/auth` (login, refresh), Settings: `/settings`
- Sites: `/sites`, Projectors: `/projectors`, Services Catalog: `/services`
- Service Visits: `/service-visits`, Service Reports: `/service-reports`, Report Templates: `/report-templates`
- FSE: `/fse`
- AMC Contracts: `/amc-contracts`, Service Tickets: `/service-tickets`, Service Assignments: `/service-assignments`
- RMA: `/rma`, DTR: `/dtr`, Call/Workflow: `/workflow`
- Spare Parts: `/spare-parts`, Recommended Spares: `/recommended-scares` (typo in name if any, see file), Purchase Orders: `/purchase-orders`, Proforma Invoices: `/proforma-invoices`
- Analytics: `/analytics`
- Projector Tracking: `/projector-tracking`
- Import: `/import` (bulk upload endpoints)
- Part Comments: `/part-comments`
- Webhooks: `/webhooks`

Most resources expose standard CRUD patterns: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` as applicable, plus domain-specific actions (exports, metrics, status transitions).

Health and static
- `GET /health` – service heartbeat
- `/uploads/*`, `/cloud-storage/*` – static file serving

---

## Auth, Roles, and Security

- JWT-based auth with role-based permission presets (`admin`, `fse`)
- Helmet for baseline HTTP hardening
- CORS configured per environment with allowlists; `credentials` enabled
- File uploads validated by route-level middleware (see upload routes)
- Audit logs and history arrays on transactional models support traceability

---

## Background & Scheduled Jobs

- `schedulerService.start()` – kicks off periodic tasks after DB connect
- `TrackingUpdateService.start()` – initializes shipment tracking updates (RMA shipping flows)

If MongoDB is unavailable in development, a mock in-memory store is bootstrapped for non-persistent testing.

---

## Local Development

Prerequisites
- Node.js 18+
- MongoDB (local) or Atlas URI

Commands
- Root: `npm run dev` (concurrently starts frontend and backend)
- Backend only: `cd backend && npm run dev`
- Frontend only: `cd frontend && npm run dev`

URLs
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`

---

## Deployment

- Single service: see `render.yaml`, `RENDER_*` guides; set `MONGODB_URI`, `JWT_SECRET`, Cloudinary and SMTP as needed
- Docker Compose: see `docker-compose.yml` and related deployment guides
- Static frontend build is served by the backend when `frontend/dist` exists

Operational tips
- Monitor `/api/health` and application logs
- Configure `FRONTEND_URL` and `ALLOWED_ORIGINS` to lock down CORS in production

---

## Data Import/Export & Utilities

- Bulk import endpoints under `/api/import` with helpers and sample files (e.g., `rma-import-sample.csv`)
- Maintenance scripts under `backend/server/scripts/` (e.g., import RMAs, update providers)
- Clearing demo data: `POST /api/clear-all-data` (removes sample content)

---

## Reporting, Photos, and Storage

- Service report PDFs per `PDF_REPORT_GUIDE.md`
- Photo workflow and categories documented in `PHOTO_WORKFLOW_TEST_README.md`
- Local `uploads/` in development; Cloudinary in production (via env)

---

## Analytics

- `/api/analytics` exposes metrics, trends, and KPIs used by dashboards

---

## Troubleshooting

- Database connectivity
  - Ensure `MONGODB_URI` is set; falls back to local; in dev, mock mode is used if both fail
- CORS issues
  - Verify `FRONTEND_URL`/`ALLOWED_ORIGINS`; check server logs for origin diagnostics
- Static frontend not served
  - Confirm `frontend/dist/index.html` exists and server resolved path

---

## References

- `CRM_TECHNICAL_ARCHITECTURE.md` – extended architecture diagrams and rationale
- `DATABASE_STRUCTURE_README.md` – detailed schema narratives and enums
- `PDF_REPORT_GUIDE.md` – report generation details
- Additional guides in repository root (deployment, mobile, workflows)



