# Database Structure Overview

## Stack Summary
- Database: MongoDB (hosted on Atlas or local) managed via Mongoose ODM
- Connection: configured in `backend/server/index.js` using `MONGODB_URI`
- Naming: each collection defined as a dedicated Mongoose model under `backend/server/models`
- Automation: most collections auto-generate identifiers and maintain timestamps through Mongoose hooks

## High-Level Domain Areas
- **Accounts & Access**: `User`, `FSE` (Field Service Engineers)
- **Sites & Assets**: `Site`, `Projector`, `AMCContract`, `ProjectorMovement`, `ProjectorStatus`
- **Service Operations**: `ServiceAssignment`, `ServiceVisit`, `ServiceReport`, `ServiceTicket`, `Service`
- **Support & Escalations**: `CallLog`, `DTR`, `RMA`
- **Inventory & Procurement**: `SparePart`, `RecommendedSparePart`, `PurchaseOrder`, `ProformaInvoice`
- **Auditing & Integrations**: `AuditLog`, `DeliveryProvider`

## Core Collections

### `User`
- Unique user ID (`USER-*`), username, email (unique/lowercase), hashed password
- Roles: `admin`, `fse`; roles map to permission presets via `getPermissions`
- Optional link to `FSE` via `fseId`
- Tracks `isActive`, `lastLogin`, `profile` details, explicit permission overrides

### `FSE`
- Unique engineer ID (`FSE-*`), contact info, employee ID, designation
- Specializations from predefined list (Installation, Maintenance, Repair, etc.)
- Territories, status (`Active`, `Inactive`, `On Leave`, `On Duty`)
- Certifications, supervisor, emergency contacts, email notification preferences

### `Site`
- Unique `name` and uppercase `siteCode`
- Geographical metadata: `region` (North, South, East, West, Central, etc.), `state`, detailed address
- Primary contact details, business hours, `siteType` (`Mall`, `Cinema`, `Corporate Office`, etc.)
- Embedded `auditoriums` array with projector counts and status per auditorium
- Calculated totals (`totalProjectors`, `activeProjectors`, `totalAuditoriums`)
- Service tracking (`lastServiceDate`, `nextScheduledService`) and contract snapshot (`serviceLevel` enum)

### `Projector`
- Unique `serialNumber` and `projectorNumber`
- Mandatory foreign keys: `siteId`, `auditoriumId`; denormalized site/auditorium names/codes for fast reads
- Lifecycle fields: `installDate`, `warrantyStart`, `warrantyEnd`
- Status enum: `Active`, `Under Service`, `Inactive`, `Needs Repair`, `In Storage`, `Disposed`, `Maintenance`, `Testing`
- Condition enum: `Excellent`, `Good`, `Fair`, `Poor`, `Needs Repair`, `Critical`
- Service metrics: `lastService`, `nextService`, `totalServices`, `hoursUsed`, `expectedLife`, `uptime`
- Maintenance history entries (date, technician, cost)
- AMC linkage (`amcContractId`), RMA linkage (`lastRMA`, `totalRMAs`)
- Virtuals: warranty status, life percentage, AMC status
- Hooks verify site/auditorium existence and update auditorium projector counts

### `AMCContract`
- Auto-generated `contractNumber` (`AMC-YYYY-####`)
- Ties a `Projector` to the owning `Site`/`auditorium`
- Contract period (`contractStartDate`, `contractEndDate`, `contractDuration` months)
- Service schedule (max 4 per contract) with status per visit
- Status enum: `Active`, `Expired`, `Suspended`, `Terminated`
- Financials: `contractValue`, `paymentStatus` (`Paid`, `Partial`, `Pending`, `Overdue`), terms, exclusions
- Coverage list (Preventive Maintenance, Emergency Repairs, Spare Parts (Limited), etc.)
- Assignment to primary FSE, auto-renewal settings
- Contract history log and notification toggles
- Virtuals for contract status, next service due, overdue services, completion counts

### `ServiceAssignment`
- Auto `assignmentId` (`ASSIGN-*`), generated title, description
- Links one FSE to a site with multiple projectors for a campaign
- Embedded `projectors` array specifying service type (`Scheduled Maintenance`, `Emergency Repair`, `Installation`, `Calibration`, `Training`, `AMC Service 1`, `AMC Service 2`), priority, estimates
- Scheduling strategy: `flexible`, `fixed`, `spread` plus options for total days, preferred days, time slots
- Auto-generated multi-day schedule with per-day projector allocations
- Status enum: `Draft`, `Assigned`, `In Progress`, `Completed`, `Cancelled`, `Unable to Complete`
- Tracks progress counts (projectors, days, percentage), costs, travel info, notes, history audit trail

### `ServiceVisit`
- Unique `visitId` (`VISIT-*`), references FSE, Site, Projector
- Visit classification: `Scheduled Maintenance`, `Emergency Repair`, `Installation`, `Calibration`, `Inspection`, `Training`, `AMC Service 1`, `AMC Service 2`
- AMC linkage and interval, scheduled/actual dates, start/end times, status workflow (`Scheduled`, `In Progress`, `Completed`, `Cancelled`, `Rescheduled`, `Unable to Complete`)
- Photo-first workflow status flags (photos captured, service completed, report generated, signatures)
- Rich photo categorisation: before, during, after, issues, parts used (with Cloudinary metadata)
- Digital signatures (site in-charge + FSE), site in-charge contact details
- Legacy `photos` array retained for backward compatibility
- Issues found and recommendations use custom setters to normalise empty inputs
- Tracks expenses, travel metrics, customer feedback, next visit planning
- Methods expose workflow requirements (photos/signature) and percentage completion

### `ServiceReport`
- Mirrors ASCOMP service report template; `reportNumber` required
- Site, projector, engineer, and environmental details
- Multiple structured sections: opticals, electronics, consumables, coolant, light engine patterns, mechanical, image evaluation
- Measurement capture (lamp power, voltage, color coordinates, screen data)
- Observations, recommended parts, environmental readings, system status
- Photo gallery with category enums, signatures (engineer/customer), optional original PDF metadata
- Flexible metadata array for additional key-value pairs

### `ServiceTicket`
- Auto `ticketNumber` (`ST-YYYY-####`) tied to an `AMCContract`
- Captures client/site info, projector details, service type (`Preventive Maintenance`, `Emergency Repair`, `Installation`, `Calibration`, `RMA Replacement`)
- Service schedule classification (`First Service`, `Second Service`, `Emergency`, `Custom`)
- Assigned FSE (resolved to contact details automatically)
- Status workflow: `Scheduled`, `Assigned`, `In Progress`, `Completed`, `Cancelled`, `Rescheduled`
- Priorities (`Low`, `Medium`, `High`, `Critical`)
- Requirements, spare parts used/required, service report linkage, customer communication, follow-up handling
- History trail and reminder toggles; virtuals for overdue detection and scheduling windows

### `CallLog`
- Unique `callLogNumber` (`CL-YYYY-###`)
- Site, customer, contact details, issue description
- Priority (`Low`, `Medium`, `High`, `Critical`), status (`Open`, `In Progress`, `Resolved`, `Closed`)
- RMA integration flags, category (`Technical`, `Billing`, `Service`, `Hardware`, `Software`, `Other`)
- SLA target (hours) with automatic breach detection when closed
- Escalation level (0-3) with escalation contact info
- Customer satisfaction rating (1-5), feedback, related projectors list, attachments
- Workflow metadata (opened/closed by, transfers)

### `DTR` (Daily Trouble Report)
- Tracks projector issues across the lifecycle: serial/site, ticket numbers, site contacts, issue details
- Status enums for multiple workflow stages (initial response, diagnosis, resolution)
- SLA tracking (target hours, breach flag), escalation (levels 0-3), resolution metrics, customer satisfaction (1-5)
- RMA integration fields (`rmaStatus`, `rmaWorkflow`) and projector detail snapshot

### `RMA`
- Auto `rmaNumber` (`RMA-YYYY-###`)
- Core fields: `callLogNumber`, `rmaOrderNumber`, `siteName`, `serialNumber`
- Mandatory dates: `ascompRaisedDate`, `customerErrorDate`
- Product/defective part metadata, replacement details, symptom notes
- Enhanced shipping object for outbound and return legs (tracking, carrier, status enums, weight, dimensions, insurance, signature requirement)
- Legacy shipping fields retained (`shippedDate`, `trackingNumber`, `shippedThru`)
- Workflow statuses (case status `Under Review` → `Completed`, approval status, CDS workflow breakdown)
- Warranty status enum: `In Warranty`, `Extended Warranty`, `Out of Warranty`, `Expired`
- Time tracking (`daysCountShippedToSite`, `daysCountReturnToCDS`), SLA evaluation, priority (`Low`, `Medium`, `High`, `Critical`)
- Tracking history entries with direction (`outbound`, `return`), carrier, metadata
- Delivery provider integration (API credentials, sync timestamps)
- Cost tracking for outbound/return shipping and SLA breach notes

### `SparePart`
- Unique `partNumber`, `partName`, category (`Spare Parts`, `RMA`)
- Brand, supported `projectorModel`, optional `projectorSerial` link
- Recommendation metadata (service reference, technician, reason, priority)
- Inventory stats: `stockQuantity`, `reorderLevel`, `unitPrice`, `supplier`, storage `location`
- Status auto-derived: `In Stock`, `Low Stock`, `Out of Stock`, `RMA Pending`, `RMA Approved`

### `PurchaseOrder`
- Auto `poNumber` (`PO-YYYY-####`)
- Customer, site, contact info, priority (`Low` → `Critical`)
- Line items with quantity, pricing, part references
- Financial summary: `subtotal`, `taxRate`, `taxAmount`, `discount`, `totalAmount`
- Status workflow: `Draft`, `Pending`, `Approved`, `In Progress`, `Completed`, `Rejected`, `Cancelled`
- Approval metadata, proforma invoice linkage, OEM PO sub-structure (status `Not Created` → `Received`)
- Related projector info, attachments, history log
- Virtuals for overdue tracking and days until delivery

### `AuditLog`
- Records actions, actors, context, payload snapshots for system auditing

### `DeliveryProvider`
- Stores carrier API credentials, webhook endpoints, service metadata for shipment tracking integrations

### `Service`
- Canonical registry of available service types, durations, categories, pricing used across assignments/tickets

## Common Patterns & Conventions
- **Identifiers**: many collections auto-generate year-prefixed IDs via `pre('save')` hooks
- **Status Fields**: consistent enums for lifecycle tracking (Scheduled/In Progress/Completed, etc.)
- **Priority Fields**: typically `Low`, `Medium`, `High`, `Critical`
- **SLA Tracking**: collections handling incidents (CallLog, DTR, RMA) include SLA targets and breach flags
- **History/Workflow**: major transactional models maintain history arrays capturing actions, timestamps, actors, and notes
- **Attachments**: photo/file arrays store filename, original name, storage path, optional cloud metadata (Cloudinary)
- **Timestamps**: `timestamps: true` enabled across schemas; some schemas manually update `updatedAt`

## Relationships at a Glance
- `Site` ⇄ `Projector` (1:N) through `siteId` and `auditoriums`
- `Projector` ⇄ `AMCContract` (1:1) referencing projector and site context
- `AMCContract` ⇄ `ServiceTicket` ⇄ `ServiceVisit` ⇄ `ServiceReport` chains ticketing to visit execution and reporting
- `ServiceAssignment` orchestrates multiple `ServiceVisit` entries for a designated FSE
- `RMA` links back to `CallLog`, `Projector`, and shipping integrations
- `SparePart` entries referenced in `ServiceVisit`, `ServiceTicket`, `PurchaseOrder`
- `User` optionally references `FSE` to align login accounts with field engineers

## Visual Map (Text Diagram)
```
              +------------------+
              |      User        |
              +------------------+
                       |
                       v
              +------------------+
              |       FSE        |
              +------------------+
                       |
           assigns/service via
                       |
   +-----------+   +------------------+        creates        +------------------+
   |   Site    |<--|    Projector     |<----------------------|  ServiceAssignment|
   +-----------+   +------------------+                      +------------------+
        |                   |                                      |
        | hosts             | has 1:1                               |
        v                   v                                      v
   +-----------+     +------------------+      schedules      +------------------+
   |Auditorium |     |   AMCContract    |-------------------->|   ServiceVisit   |
   +-----------+     +------------------+                      +------------------+
                              |                                       |
                              | links tickets                          |
                              v                                       v
                        +------------------+   generates        +------------------+
                        |  ServiceTicket   |------------------->|   ServiceReport  |
                        +------------------+                     +------------------+
                              |
                              | may require
                              v
                        +------------------+
                        |      RMA         |
                        +------------------+
                              |
                              v
                        +------------------+
                        |    CallLog       |
                        +------------------+

Inventory & Procurement (used across visits/tickets/RMAs):
  SparePart ⇄ RecommendedSparePart ⇄ PurchaseOrder ⇄ ProformaInvoice

Supporting telemetry:
  AuditLog (actions), DeliveryProvider (shipping APIs)
```

## How It Flows (Plain Language)
- **Start with the Site**: Every customer location (`Site`) has one or more auditoriums and the projectors installed there.
- **Keep assets up to date**: Each `Projector` stores where it lives, its warranty window, and whether an `AMCContract` is attached for annual maintenance coverage.
- **Plan field work**: An admin builds a `ServiceAssignment` for an `FSE`, choosing which projectors to service and how the work should spread across days. This assignment automatically creates individual `ServiceVisit` slots.
- **Execute visits**: When an engineer performs a visit, the `ServiceVisit` tracks photos, signatures, issues found, and parts used. Completing the workflow prompts creation of a detailed `ServiceReport` in the ASCOMP format.
- **Track tickets**: If a service need comes from a contract schedule (or an urgent incident), a `ServiceTicket` ties the AMC contract, projector, and FSE together. Tickets can spawn visits and capture the parts consumed.
- **Handle issues & escalations**: Customer calls land in `CallLog`. If the problem points to a defective component, an `RMA` record is opened; it follows shipping both ways and updates SLA counters. Ongoing projector issues also live in `DTR` for trend analysis.
- **Manage inventory**: Whenever parts are needed, the system references `SparePart` stock. If stock is low, `PurchaseOrder` and `ProformaInvoice` handle procurement, and `RecommendedSparePart` records what technicians suggested in the field.
- **Stay compliant**: `User` accounts (sometimes mapped to `FSE`) control access. Every major action is captured inside `AuditLog`, and shipping providers are configured in `DeliveryProvider` for live tracking.

## Reference: Enumerations & Key Value Sets
- **Regions** (`Site.region`): `North`, `South`, `East`, `West`, `Central`, `Northeast`, `Northwest`, `Southeast`, `Southwest`, `North & East`, `North & West`, `South & East`, `South & West`, `West & Central`, `All Regions`
- **Site Types**: `Mall`, `Cinema`, `Corporate Office`, `Convention Center`, `Hotel`, `Restaurant`, `Educational Institute`, `Other`
- **Projector Status**: `Active`, `Under Service`, `Inactive`, `Needs Repair`, `In Storage`, `Disposed`, `Maintenance`, `Testing`
- **Projector Condition**: `Excellent`, `Good`, `Fair`, `Poor`, `Needs Repair`, `Critical`
- **Service Visit Status**: `Scheduled`, `In Progress`, `Completed`, `Cancelled`, `Rescheduled`, `Unable to Complete`
- **Service Visit Unable Reason**: `Missing Parts`, `Equipment Failure`, `Access Issues`, `Customer Request`, `Safety Concerns`, `Technical Complexity`, `Other`
- **Call Log Status**: `Open`, `In Progress`, `Resolved`, `Closed`
- **Call Log Category**: `Technical`, `Billing`, `Service`, `Hardware`, `Software`, `Other`
- **Ticket Service Types**: `Preventive Maintenance`, `Emergency Repair`, `Installation`, `Calibration`, `RMA Replacement`
- **Ticket Schedule**: `First Service`, `Second Service`, `Emergency`, `Custom`
- **RMA Case Status**: `Under Review`, `Sent to CDS`, `CDS Approved`, `Replacement Shipped`, `Replacement Received`, `Installation Complete`, `Faulty Part Returned`, `CDS Confirmed Return`, `Completed`, `Rejected`
- **RMA Approval**: `Pending Review`, `Approved`, `Rejected`, `Under Investigation`
- **Shipping Status**: `pending`, `picked_up`, `in_transit`, `out_for_delivery`, `delivered`, `exception`, `returned`

## How to Extend Safely
- Follow existing enum patterns to maintain UI consistency
- Add indexes for frequently queried fields (see schema-level indexes)
- When adding relationships, denormalise key display fields (names/codes) to keep API responses user-friendly
- Update relevant history/audit arrays when introducing new workflow steps
- Respect existing setters (e.g., `ServiceVisit.issuesFound`) to avoid data shape regressions

---
For a visual flow, see `CRM_FLOWCHART.md` (system architecture) and `RMA_CDS_WORKFLOW_DIAGRAM.md` (RMA process details).

