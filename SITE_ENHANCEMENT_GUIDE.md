# Site Enhancement Guide

## Overview
The Site model has been enhanced with three new fields to improve searchability and organization:

1. **Site Code** - A unique identifier for each site
2. **Region** - Geographic region classification
3. **State** - State information (separate from address.state)

## New Fields Added

### 1. Site Code
- **Type**: String (required, unique, uppercase)
- **Format**: Auto-generated based on region and site name
- **Example**: `NOMAL123` (North + Mall + random suffix)
- **Purpose**: Quick identification and reference

### 2. Region
- **Type**: String (required, enum)
- **Options**: North, South, East, West, Central, Northeast, Northwest, Southeast, Southwest
- **Purpose**: Geographic grouping and filtering

### 3. State
- **Type**: String (required)
- **Purpose**: State-level filtering and organization
- **Note**: This is separate from `address.state` for better search flexibility

## Database Changes

### Schema Updates
- Added `siteCode`, `region`, and `state` fields to Site model
- Added database indexes for better search performance
- Updated validation rules

### Migration
- Migration script automatically populates new fields for existing sites
- Region is auto-assigned based on state mapping
- Site codes are auto-generated for existing sites

## API Endpoints

### New Search Endpoints
```
GET /api/sites/region/:region    - Get sites by region
GET /api/sites/state/:state      - Get sites by state  
GET /api/sites/code/:siteCode    - Get sites by site code
```

### Enhanced Search
The main search endpoint now includes the new fields:
```
GET /api/sites/search/:query
```
Searches across: name, siteCode, region, state, city, contact person

### Enhanced Statistics
```
GET /api/sites/stats/overview
```
Now includes:
- `sitesByRegion` - Count of sites by region
- `sitesByState` - Count of sites by state

## Frontend Updates

### Form Fields
The site creation/editing form now includes:
- Site Code input (auto-uppercase)
- Region dropdown (9 options)
- State input field

### Display Updates
Site cards now show:
- Site code and region information
- Enhanced search functionality

### Search Enhancement
The search bar now searches across:
- Site name
- Site code
- Region
- State
- City
- Contact person name/email

## Usage Examples

### Creating a New Site
1. Go to Sites page
2. Click "Add Site"
3. Fill in required fields including:
   - Site Code (e.g., "NOMAL123")
   - Region (select from dropdown)
   - State (e.g., "Delhi")
4. Complete other fields and save

### Searching Sites
You can now search by:
- **Site Code**: "NOMAL" will find sites with that code
- **Region**: "North" will find all North region sites
- **State**: "Maharashtra" will find all sites in that state
- **Combined**: "North Mall" will find North region malls

### Filtering by Region/State
Use the new API endpoints:
```javascript
// Get all North region sites
const northSites = await apiClient.getSitesByRegion('North');

// Get all Maharashtra sites
const maharashtraSites = await apiClient.getSitesByState('Maharashtra');

// Get sites by code pattern
const codeSites = await apiClient.getSitesByCode('NOMAL');
```

## State to Region Mapping

The system automatically maps Indian states to regions:

### North
- Delhi, Haryana, Punjab, Himachal Pradesh, Uttarakhand, Jammu and Kashmir, Ladakh, Chandigarh

### South
- Tamil Nadu, Karnataka, Kerala, Andhra Pradesh, Telangana, Puducherry, Lakshadweep, Andaman and Nicobar Islands

### East
- West Bengal, Bihar, Jharkhand, Odisha, Sikkim

### West
- Maharashtra, Gujarat, Rajasthan, Goa, Dadra and Nagar Haveli, Daman and Diu

### Central
- Madhya Pradesh, Chhattisgarh, Uttar Pradesh

### Northeast
- Assam, Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Tripura

## Benefits

1. **Better Organization**: Sites can be grouped by region and state
2. **Improved Search**: Multiple search criteria for faster site finding
3. **Unique Identification**: Site codes provide quick reference
4. **Geographic Analysis**: Regional statistics and reporting
5. **Scalability**: Better structure for growing site networks

## Migration Notes

- Existing sites have been automatically updated with new fields
- Site codes are auto-generated for existing sites
- Regions are auto-assigned based on existing state information
- No data loss occurred during migration

## Future Enhancements

Potential improvements:
- Region-based reporting and analytics
- Geographic visualization (maps)
- Regional service team assignments
- Automated region-based workflows




