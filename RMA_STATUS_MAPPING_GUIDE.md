# RMA Status Mapping Guide

## CSV Import Status Mapping

This document explains how status values from your CSV file are mapped to the database.

### Your CSV Status Values → Database Values

| CSV Value (Case Insensitive) | Maps to Database Value |
|-------------------------------|------------------------|
| `closed` | **Closed** |
| `under review` | **Under Review** |
| `open` | **Open** |
| `faulty in transit to cds` | **Faulty Transit to CDS** |
| `rma yet to be raised` | **RMA Raised Yet to Deliver** |

### Additional Supported Status Values

The system also supports these standard RMA workflow statuses:

- **Open** - New RMA case opened
- **Under Review** - Initial review stage
- **RMA Raised Yet to Deliver** - RMA approved but not yet shipped
- **Sent to CDS** - Faulty part sent to CDS for analysis
- **Faulty Transit to CDS** - Part damaged during transit to CDS
- **CDS Approved** - CDS approved the RMA claim
- **Replacement Shipped** - Replacement part shipped to customer
- **Replacement Received** - Customer received replacement part
- **Installation Complete** - New part installed successfully
- **Faulty Part Returned** - Defective part returned to CDS
- **CDS Confirmed Return** - CDS confirmed receipt of faulty part
- **Completed** - RMA process fully completed
- **Closed** - RMA case closed
- **Rejected** - RMA claim rejected

## Case Sensitivity

The import system is **case-insensitive** for status values. All of these will work:
- `closed`, `Closed`, `CLOSED`
- `under review`, `Under Review`, `UNDER REVIEW`
- `open`, `Open`, `OPEN`

## Workflow Sequence

Typical RMA workflow progression:

1. **Open** → New case created
2. **Under Review** → Initial review and assessment
3. **RMA Raised Yet to Deliver** → Approved, awaiting shipment
4. **Replacement Shipped** → Part sent to customer
5. **Replacement Received** → Customer confirms receipt
6. **Installation Complete** → New part installed
7. **Faulty Part Returned** → Old part sent back
8. **CDS Confirmed Return** → CDS confirms receipt
9. **Completed** → Process complete
10. **Closed** → Case archived

## Notes

- `Open` status is preserved as-is during import (maps to "Open")
- All status mappings are handled in `backend/server/routes/import.js`
- Status values are standardized during CSV import to maintain consistency
- The system is case-insensitive, so `open`, `Open`, and `OPEN` all work correctly

