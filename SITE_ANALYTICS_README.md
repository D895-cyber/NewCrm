# Site Analytics & Analysis System

## Overview

The Site Analytics & Analysis system provides comprehensive insights into your projector warranty business by analyzing sites across different geographical and organizational dimensions. This system enables you to understand performance patterns, identify areas for improvement, and make data-driven decisions.

## Features

### 🎯 **Multi-Dimensional Analysis**
- **Regional Analysis**: Analyze sites by geographical regions (North, South, East, West, Central, etc.)
- **State-wise Analysis**: Detailed breakdown by individual states
- **Site Code Analysis**: Search and filter by specific site codes
- **Cross-dimensional Filtering**: Combine multiple filters for precise analysis

### 📊 **Comprehensive Data Insights**

#### **Site Analysis**
- Total sites and auditoriums per location
- Site types and status distribution
- Contact information and business hours
- Contract details and service levels

#### **Projector Analysis**
- Total projectors per site
- Status distribution (Active, Under Service, Needs Repair, Inactive)
- Brand and model breakdown
- Condition assessment
- Uptime and performance metrics
- Service history and maintenance records

#### **RMA Analysis**
- Total RMA cases per site
- Case status distribution
- Priority level breakdown
- Product-wise RMA analysis
- Average resolution time
- Total cost analysis
- CDS workflow tracking

#### **Spare Parts Analysis**
- Total spare parts inventory
- Category-wise distribution
- Stock status (In Stock, Low Stock, Out of Stock)
- Brand-wise breakdown
- Total inventory value
- Low stock alerts

#### **Service Analysis**
- Total service visits
- Service type distribution
- Customer satisfaction scores
- Issues found and resolution tracking
- FSE performance metrics

### 📈 **Visual Analytics Dashboard**

#### **Overview Tab**
- Summary cards with key metrics
- Regional distribution charts
- Projector status pie charts
- Real-time statistics

#### **Site Analysis Tab**
- Detailed site-by-site breakdown
- Comprehensive metrics for each location
- Performance indicators and alerts
- Comparative analysis

#### **Regional Analysis Tab**
- Region-wise site distribution
- Projector density mapping
- Site type diversity
- Performance comparison across regions

#### **State Analysis Tab**
- State-wise detailed breakdown
- Site code distribution
- Projector density analysis
- Regional grouping within states

## API Endpoints

### **Base URL**: `/api/analytics`

#### **1. Site Analysis** - `GET /sites`
**Query Parameters:**
- `region` (optional): Filter by specific region
- `state` (optional): Filter by specific state  
- `siteCode` (optional): Search by site code (partial match)

**Response:**
```json
{
  "totalSites": 25,
  "sites": [
    {
      "site": {
        "_id": "...",
        "name": "Site Name",
        "siteCode": "SITE001",
        "region": "North",
        "state": "Delhi",
        "siteType": "Mall",
        "status": "Active"
      },
      "analysis": {
        "projectors": { ... },
        "rma": { ... },
        "spareParts": { ... },
        "services": { ... }
      }
    }
  ]
}
```

#### **2. Regional Analysis** - `GET /regions`
**Response:**
```json
[
  {
    "_id": "North",
    "siteCount": 8,
    "states": ["Delhi", "Haryana", "Punjab"],
    "siteTypes": ["Mall", "Cinema", "Corporate Office"],
    "totalProjectors": 156,
    "activeProjectors": 142
  }
]
```

#### **3. State Analysis** - `GET /states`
**Query Parameters:**
- `region` (optional): Filter by specific region

**Response:**
```json
[
  {
    "_id": "Delhi",
    "region": "North",
    "siteCount": 4,
    "siteCodes": ["SITE001", "SITE002"],
    "siteTypes": ["Mall", "Cinema"],
    "totalProjectors": 78,
    "activeProjectors": 72
  }
]
```

#### **4. Dashboard Statistics** - `GET /dashboard-stats`
**Response:**
```json
{
  "sites": {
    "totalSites": 25,
    "byRegion": ["North", "South", "East", "West"],
    "byState": ["Delhi", "Mumbai", "Bangalore"],
    "byType": ["Mall", "Cinema", "Corporate Office"]
  },
  "projectors": {
    "totalProjectors": 548,
    "activeProjectors": 498,
    "underService": 35,
    "needsRepair": 15
  },
  "rma": {
    "totalRMAs": 89,
    "underReview": 12,
    "completed": 67,
    "totalCost": 1250000
  },
  "spareParts": {
    "totalParts": 234,
    "inStock": 189,
    "lowStock": 32,
    "outOfStock": 13
  }
}
```

## Usage Examples

### **1. Filter Sites by Region**
```javascript
// Get all sites in North region
const response = await fetch('/api/analytics/sites?region=North');
const data = await response.json();
```

### **2. Filter Sites by State**
```javascript
// Get all sites in Delhi state
const response = await fetch('/api/analytics/sites?state=Delhi');
const data = await response.json();
```

### **3. Search by Site Code**
```javascript
// Search sites with code containing "MALL"
const response = await fetch('/api/analytics/sites?siteCode=MALL');
const data = await response.json();
```

### **4. Combined Filters**
```javascript
// Get sites in North region, Delhi state, with code containing "CINEMA"
const response = await fetch('/api/analytics/sites?region=North&state=Delhi&siteCode=CINEMA');
const data = await response.json();
```

### **5. Get Regional Summary**
```javascript
// Get analysis for all regions
const response = await fetch('/api/analytics/regions');
const data = await response.json();
```

### **6. Get State Analysis for Specific Region**
```javascript
// Get state analysis for North region
const response = await fetch('/api/analytics/states?region=North');
const data = await response.json();
```

## Frontend Integration

### **Component Usage**
```tsx
import { AnalyticsPage } from './components/pages/AnalyticsPage';

// Use in your routing
<Route path="/analytics" element={<AnalyticsPage />} />
```

### **State Management**
The component manages several state variables:
- `siteAnalysis`: Detailed site analysis data
- `regionalAnalysis`: Regional summary data
- `stateAnalysis`: State-wise breakdown
- `dashboardStats`: Overall dashboard statistics
- `selectedRegion`, `selectedState`, `siteCodeFilter`: Filter states

### **Data Loading**
```tsx
useEffect(() => {
  loadAnalyticsData();
}, [selectedRegion, selectedState, siteCodeFilter]);
```

### **Export Functionality**
```tsx
const exportSiteAnalysis = () => {
  const exportData = siteAnalysis.map(site => ({
    'Site Name': site.site.name,
    'Site Code': site.site.siteCode,
    'Region': site.site.region,
    'State': site.site.state,
    // ... more fields
  }));
  
  const csv = convertToCSV(exportData);
  downloadCSV(csv, 'site-analysis-report.csv');
};
```

## Data Models

### **Site Analysis Structure**
```typescript
interface SiteAnalysis {
  site: {
    _id: string;
    name: string;
    siteCode: string;
    region: string;
    state: string;
    address: any;
    siteType: string;
    status: string;
    totalAuditoriums: number;
  };
  analysis: {
    projectors: ProjectorStats;
    rma: RMAStats;
    spareParts: SparePartsStats;
    services: ServiceStats;
  };
}
```

### **Projector Statistics**
```typescript
interface ProjectorStats {
  total: number;
  active: number;
  underService: number;
  inactive: number;
  needsRepair: number;
  byBrand: Record<string, number>;
  byModel: Record<string, number>;
  byCondition: Record<string, number>;
}
```

### **RMA Statistics**
```typescript
interface RMAStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byProduct: Record<string, number>;
  avgResolutionTime: number;
  totalCost: number;
}
```

## Performance Considerations

### **Database Indexing**
The system uses optimized MongoDB indexes for:
- Site region and state queries
- Projector site relationships
- RMA site associations
- Spare parts projector links

### **Aggregation Pipelines**
- Efficient MongoDB aggregation for regional and state analysis
- Optimized lookups for related data
- Minimal data transfer with lean queries

### **Caching Strategy**
- Consider implementing Redis caching for frequently accessed analytics
- Cache regional and state summaries
- Implement TTL-based cache invalidation

## Security Features

### **Authentication Required**
- All analytics endpoints require valid JWT tokens
- User role-based access control
- Secure data filtering

### **Data Privacy**
- Site-specific data isolation
- User permission validation
- Audit trail for analytics access

## Troubleshooting

### **Common Issues**

#### **1. No Data Returned**
- Check if sites exist in the database
- Verify site-projector relationships
- Ensure proper data population

#### **2. Slow Query Performance**
- Check MongoDB indexes
- Verify aggregation pipeline optimization
- Monitor database performance

#### **3. Authentication Errors**
- Verify JWT token validity
- Check user permissions
- Ensure proper token format

### **Debug Mode**
Enable debug logging in development:
```javascript
// In server configuration
if (process.env.NODE_ENV === 'development') {
  console.log('Analytics query:', filter);
  console.log('Query execution time:', executionTime);
}
```

## Future Enhancements

### **Planned Features**
1. **Real-time Analytics**: Live dashboard updates
2. **Predictive Analytics**: ML-based failure prediction
3. **Advanced Filtering**: Date ranges, cost thresholds
4. **Custom Reports**: User-defined analysis templates
5. **Data Export**: Multiple format support (PDF, Excel)
6. **Alert System**: Automated threshold-based notifications

### **Integration Opportunities**
1. **Business Intelligence Tools**: Power BI, Tableau
2. **External APIs**: Weather data, economic indicators
3. **Mobile Analytics**: FSE mobile app integration
4. **Email Reports**: Automated scheduled reports

## Support

For technical support or feature requests:
- Check the server logs for detailed error information
- Verify database connectivity and data integrity
- Review API endpoint documentation
- Contact the development team for advanced issues

---

**Version**: 1.0.0  
**Last Updated**: August 2024  
**Compatibility**: Node.js 16+, MongoDB 5+, React 18+






