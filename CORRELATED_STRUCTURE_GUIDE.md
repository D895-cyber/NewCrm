# 🏗️ Correlated Structure Guide

## Overview

The CRM system has been restructured to create a more efficient, correlated architecture between Sites, Projectors, and AMC modules. This eliminates data duplication and improves data tracking across all modules.

## 🏢 Core Structure

### Site Module (Core Module)
Every site (client location) is stored once with essential details:

- **Site Name** - Unique identifier for the location
- **State** - Geographic state
- **Region** - Business region (North, South, East, West, etc.)
- **Site Code** - Auto-generated unique code (e.g., SITE-2024-0001)
- **Address** - Complete address information
- **Contact Person** - Primary contact details
- **Business Hours** - Operating schedule
- **Site Type** - Mall, Cinema, Corporate Office, etc.

### Auditoriums (Sub-module of Site)
Each site can have multiple auditoriums:

- **Audi Number** - Unique identifier (e.g., AUDI-01, AUDI-02)
- **Name** - Auditorium name (e.g., "Main Auditorium", "VIP Screen")
- **Capacity** - Seating capacity
- **Screen Size** - Screen dimensions
- **Projector Count** - Number of projectors in this auditorium
- **Status** - Active, Inactive, Under Maintenance

## 📽️ Projector Module

Projectors are now linked to specific auditoriums within sites:

### Core Fields
- **Projector Number** - Unique identifier (e.g., PROJ-1234)
- **Serial Number** - Manufacturer serial number
- **Model** - Projector model
- **Brand** - Manufacturer brand

### Relationships
- **Site ID** - Links to the parent site
- **Site Name** - Auto-populated site name
- **Site Code** - Auto-populated site code
- **Auditorium ID** - Links to specific auditorium
- **Auditorium Name** - Auto-populated auditorium name

### Technical Details
- **Install Date** - Installation date
- **Warranty End** - Warranty expiration
- **Status** - Active, Under Service, Inactive, Needs Repair
- **Condition** - Excellent, Good, Fair, Needs Repair
- **Hours Used** - Total operating hours
- **Expected Life** - Expected lifespan in hours

### AMC Integration
- **AMC Contract ID** - Links to AMC contract
- **AMC Status** - Virtual field showing AMC status

## 📋 AMC Module (Annual Maintenance Contract)

AMC contracts are now directly linked to specific projectors at specific sites:

### Core Fields
- **Contract Number** - Auto-generated (e.g., AMC-2024-0001)
- **Contract Period** - Start and end dates
- **Contract Duration** - Length in months

### Relationships
- **Site ID** - Links to the parent site
- **Site Name** - Auto-populated site name
- **Site Code** - Auto-populated site code
- **Auditorium ID** - Links to specific auditorium
- **Auditorium Name** - Auto-populated auditorium name
- **Projector ID** - Links to specific projector
- **Projector Number** - Auto-populated projector number
- **Projector Serial** - Auto-populated serial number

### Service Schedule
Each contract includes 4 scheduled services per year:

- **Service 1** - Scheduled date, actual date, status
- **Service 2** - Scheduled date, actual date, status
- **Service 3** - Scheduled date, actual date, status
- **Service 4** - Scheduled date, actual date, status

Service statuses: Scheduled, In Progress, Completed, Overdue, Cancelled

### Financial Details
- **Contract Value** - Total contract amount
- **Payment Status** - Paid, Partial, Pending, Overdue
- **Payment Terms** - Payment conditions

## 🔗 Data Flow and Relationships

```
Site (1) → Auditoriums (Many)
  ↓
Auditorium (1) → Projectors (Many)
  ↓
Projector (1) → AMC Contract (1)
```

### Key Benefits
1. **No Duplication** - Site information stored once
2. **Clear Hierarchy** - Site → Auditorium → Projector → AMC
3. **Easy Tracking** - Follow any projector from site to contract
4. **Data Integrity** - Referential integrity maintained
5. **Scalability** - Easy to add new auditoriums or projectors

## 📊 API Endpoints

### Sites
- `GET /api/sites` - Get all sites with auditoriums
- `GET /api/sites/:id` - Get site with full details
- `POST /api/sites` - Create new site
- `PUT /api/sites/:id` - Update site
- `DELETE /api/sites/:id` - Delete site

### Auditoriums
- `POST /api/sites/:id/auditoriums` - Add auditorium to site
- `PUT /api/sites/:id/auditoriums/:audiNumber` - Update auditorium
- `DELETE /api/sites/:id/auditoriums/:audiNumber` - Delete auditorium

### Projectors
- `GET /api/projectors` - Get all projectors
- `GET /api/projectors/:id` - Get projector details
- `POST /api/projectors` - Create new projector
- `PUT /api/projectors/:id` - Update projector
- `DELETE /api/projectors/:id` - Delete projector

### AMC Contracts
- `GET /api/amc-contracts` - Get all AMC contracts
- `GET /api/amc-contracts/:id` - Get contract details
- `POST /api/amc-contracts` - Create new contract
- `PUT /api/amc-contracts/:id` - Update contract
- `DELETE /api/amc-contracts/:id` - Delete contract

## 🚀 Migration Process

### Step 1: Run Migration Script
```bash
cd server/migrations
node update-to-correlated-structure.js
```

### Step 2: Verify Data
- Check that all sites have auditoriums
- Verify projectors are linked to auditoriums
- Confirm AMC contracts are properly linked

### Step 3: Update Frontend
- Update forms to include auditorium selection
- Modify displays to show correlated information
- Update search and filter functionality

## 📝 Best Practices

### Creating New Sites
1. Always create at least one auditorium
2. Use descriptive auditorium names
3. Set appropriate capacity and screen size

### Adding Projectors
1. Select the correct site first
2. Choose the appropriate auditorium
3. Ensure projector number is unique
4. Set realistic warranty and life expectations

### Managing AMC Contracts
1. Link to existing projectors
2. Set appropriate service intervals
3. Monitor service completion status
4. Track payment status

## 🔍 Data Queries

### Find All Projectors at a Site
```javascript
const projectors = await Projector.find({ siteId: siteId });
```

### Find All Projectors in an Auditorium
```javascript
const projectors = await Projector.find({ 
  siteId: siteId, 
  auditoriumId: auditoriumId 
});
```

### Find AMC Contracts for a Site
```javascript
const contracts = await AMCContract.find({ siteId: siteId });
```

### Find Overdue Services
```javascript
const overdueServices = await AMCContract.find({
  'serviceSchedule.status': 'Overdue'
});
```

## ⚠️ Important Notes

1. **Data Integrity** - Sites cannot be deleted if they have projectors or AMC contracts
2. **Auditorium Deletion** - Auditoriums cannot be deleted if they contain projectors
3. **Auto-population** - Site and auditorium details are automatically populated in projectors
4. **Service Scheduling** - Service dates are automatically calculated based on contract start date
5. **Projector Counts** - Auditorium projector counts are automatically updated

## 🎯 Future Enhancements

1. **Multi-site Contracts** - Support for contracts covering multiple sites
2. **Auditorium Templates** - Predefined auditorium configurations
3. **Bulk Operations** - Add multiple projectors or auditoriums at once
4. **Advanced Reporting** - Cross-module analytics and reporting
5. **Mobile Support** - Enhanced mobile interface for field operations

---

This correlated structure provides a solid foundation for efficient CRM operations while maintaining data integrity and improving user experience.
