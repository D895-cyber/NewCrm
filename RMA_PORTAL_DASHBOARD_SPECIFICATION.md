# RMA Portal Dashboard - Complete Specification

## 🎯 Overview
A specialized portal for RMA (Return Material Authorization) management, tracking, analysis, and related operations including DTR conversion workflow, projector management, and site management.

## 📋 Portal Features

### Core Modules
1. **RMA Management** - Complete RMA lifecycle management
2. **RMA Tracking** - Real-time shipment and status tracking
3. **RMA Analytics** - Insights, trends, and performance metrics
4. **DTR Management** - DTR creation, troubleshooting, and RMA conversion
5. **Projector Management** - Projector inventory, maintenance, and service
6. **Site Management** - Customer site information and RMA history

---

## 🎨 Dashboard Components Specification

### **1. Top KPI Cards**
**Purpose**: At-a-glance view of critical metrics

**Widgets** (5 cards):
```javascript
{
  cards: [
    {
      title: "Total RMAs",
      value: 245,
      change: "+12%",
      changeType: "increase",
      period: "vs last month",
      icon: "FileText",
      color: "blue"
    },
    {
      title: "Active RMAs",
      value: 42,
      change: "+5%",
      changeType: "increase",
      period: "this week",
      icon: "Activity",
      color: "green"
    },
    {
      title: "Pending Approval",
      value: 18,
      change: "-3%",
      changeType: "decrease",
      period: "improvement",
      icon: "Clock",
      color: "yellow"
    },
    {
      title: "Awaiting Parts",
      value: 15,
      change: "+8%",
      changeType: "increase",
      period: "this week",
      icon: "Package",
      color: "orange"
    },
    {
      title: "Completed This Month",
      value: 89,
      change: "+15%",
      changeType: "increase",
      period: "vs last month",
      icon: "CheckCircle",
      color: "purple"
    }
  ]
}
```

**API Endpoint**: `GET /api/rma/dashboard/kpis`

**Response Structure**:
```json
{
  "totalRMAs": 245,
  "activeRMAs": 42,
  "pendingApproval": 18,
  "awaitingParts": 15,
  "completedThisMonth": 89,
  "trends": {
    "totalRMAsChange": 12,
    "activeRMAsChange": 5,
    "pendingApprovalChange": -3,
    "awaitingPartsChange": 8,
    "completedChange": 15
  }
}
```

---

### **2. RMA Status Distribution**
**Purpose**: Visual breakdown of RMA statuses

**Chart Type**: Horizontal bar chart with percentages

**Statuses**:
- Under Review (18) - Gray
- Pending Approval (15) - Yellow
- Parts Ordered (12) - Blue
- Shipped to Site (25) - Green
- Awaiting Installation (8) - Orange
- Completed (89) - Purple
- Rejected/Closed (5) - Red

**API Endpoint**: `GET /api/rma/dashboard/status-distribution`

**Response Structure**:
```json
{
  "distribution": [
    { "status": "Under Review", "count": 18, "percentage": 10.5, "color": "#9CA3AF" },
    { "status": "Pending Approval", "count": 15, "percentage": 8.7, "color": "#FCD34D" },
    { "status": "Parts Ordered", "count": 12, "percentage": 7.0, "color": "#60A5FA" },
    { "status": "Shipped to Site", "count": 25, "percentage": 14.5, "color": "#34D399" },
    { "status": "Awaiting Installation", "count": 8, "percentage": 4.7, "color": "#FB923C" },
    { "status": "Completed", "count": 89, "percentage": 51.7, "color": "#A78BFA" },
    { "status": "Rejected/Closed", "count": 5, "percentage": 2.9, "color": "#EF4444" }
  ],
  "total": 172
}
```

---

### **3. Priority Queue (Action Required)**
**Purpose**: Highlight urgent RMAs requiring immediate attention

**Priority Levels**:
- **CRITICAL**: Overdue, customer escalation, system down
- **HIGH**: Approaching deadline, important customer
- **MEDIUM**: Normal priority
- **LOW**: No urgency

**Display**:
- Top 2 CRITICAL items with details
- Top 2 HIGH items with details
- Summary counts for MEDIUM and LOW

**API Endpoint**: `GET /api/rma/dashboard/priority-queue`

**Response Structure**:
```json
{
  "critical": {
    "count": 8,
    "items": [
      {
        "rmaNumber": "RMA-2025-045",
        "siteName": "ABC Corp",
        "issue": "3 days overdue",
        "daysOverdue": 3,
        "assignedTo": "Sarah Smith",
        "actions": ["review", "approve", "escalate"]
      }
    ]
  },
  "high": { "count": 15, "items": [...] },
  "medium": { "count": 28 },
  "low": { "count": 12 }
}
```

---

### **4. Recent DTR to RMA Conversions**
**Purpose**: Track newly converted DTRs for review

**Display**: Last 5 conversions with:
- DTR and RMA numbers
- Converting technician
- Conversion reason
- Troubleshooting step count
- Current status
- Action buttons (Review, Approve)

**API Endpoint**: `GET /api/rma/dashboard/recent-conversions`

**Response Structure**:
```json
{
  "conversions": [
    {
      "dtrNumber": "DTR-2025-012",
      "rmaNumber": "RMA-2025-045",
      "technician": {
        "name": "John Doe",
        "userId": "USR-123"
      },
      "conversionReason": "Hardware failure confirmed",
      "troubleshootingSteps": 4,
      "conversionDate": "2025-01-08T10:30:00Z",
      "currentStatus": "Under Review",
      "assignedRMAManager": "Sarah Smith"
    }
  ]
}
```

---

### **5. Active Shipments & Tracking**
**Purpose**: Real-time tracking of all shipments

**Sections**:
- **Outbound (To CDS)**: Defective parts being shipped
- **Return (To Sites)**: Replacement parts being delivered

**Display**: 
- Top 3 shipments per direction
- Tracking number, carrier, status, ETA
- Quick track button

**API Endpoint**: `GET /api/rma/dashboard/active-shipments`

**Response Structure**:
```json
{
  "outbound": {
    "count": 8,
    "shipments": [
      {
        "rmaNumber": "RMA-2025-042",
        "trackingNumber": "TRK-123456",
        "carrier": "BlueDart",
        "status": "In Transit",
        "destination": "CDS Delhi",
        "estimatedDelivery": "2025-01-10",
        "daysInTransit": 2
      }
    ]
  },
  "return": {
    "count": 12,
    "shipments": [...]
  }
}
```

---

### **6. Site & Projector Quick Stats**
**Purpose**: Overview of related entities

**Site Stats**:
- Total sites
- Sites with active RMAs
- High-RMA sites (>5 active RMAs)

**Projector Stats**:
- Total projectors
- Under maintenance
- RMA in progress

**API Endpoints**: 
- `GET /api/dashboard/site-stats`
- `GET /api/dashboard/projector-stats`

---

### **7. SLA & Performance Metrics**
**Purpose**: Track service level agreement compliance

**Metrics**:
- SLA compliance percentage (with/without breach)
- Average resolution time vs target
- Average response time vs target
- Customer satisfaction score

**Visual**: Progress bars with color coding
- Green: Meeting SLA
- Yellow: Close to breach
- Red: Breached

**API Endpoint**: `GET /api/rma/dashboard/sla-metrics`

**Response Structure**:
```json
{
  "slaCompliance": {
    "withinSLA": 87,
    "breached": 13
  },
  "avgResolutionTime": {
    "actual": 5.2,
    "target": 7,
    "unit": "days",
    "status": "good"
  },
  "avgResponseTime": {
    "actual": 2.1,
    "target": 4,
    "unit": "hours",
    "status": "good"
  },
  "customerSatisfaction": {
    "score": 4.3,
    "outOf": 5,
    "totalResponses": 156
  }
}
```

---

### **8. Analytics & Trends**
**Purpose**: Historical data and pattern analysis

**Charts**:
1. **Monthly RMA Trend** (Line chart, last 6 months)
2. **Top Failure Components** (Pie/Bar chart)
3. **RMA by Site** (Top 10 sites)
4. **RMA by Brand/Model** (Top projector models)

**API Endpoint**: `GET /api/rma/dashboard/analytics`

**Response Structure**:
```json
{
  "monthlyTrend": [
    { "month": "Jan", "count": 45, "completed": 42, "pending": 3 },
    { "month": "Feb", "count": 52, "completed": 48, "pending": 4 }
  ],
  "topFailureComponents": [
    { "component": "Signal Board", "count": 28, "percentage": 28 },
    { "component": "Power Supply", "count": 22, "percentage": 22 },
    { "component": "Lamp", "count": 18, "percentage": 18 }
  ],
  "topSites": [...],
  "topModels": [...]
}
```

---

### **9. Quick Actions Panel**
**Purpose**: Fast access to common operations

**Actions**:
```javascript
[
  { label: "New RMA", icon: "Plus", route: "/rma/create", permission: "create_rma" },
  { label: "Review DTRs", icon: "FileText", route: "/dtr/pending", permission: "view_dtr" },
  { label: "Assign Tasks", icon: "UserCheck", route: "/tasks/assign", permission: "assign_tasks" },
  { label: "Generate Report", icon: "Download", action: "generateReport", permission: "export_data" },
  { label: "Track Shipment", icon: "Package", route: "/tracking", permission: "track_shipments" },
  { label: "Approve RMA", icon: "CheckCircle", route: "/rma/pending-approval", permission: "approve_rma" },
  { label: "Update Status", icon: "Edit", action: "bulkUpdate", permission: "update_rma" },
  { label: "View Alerts", icon: "Bell", route: "/alerts", permission: "view_alerts" }
]
```

---

### **10. Recent Activity Feed**
**Purpose**: Real-time activity log

**Display**: Last 10-20 activities with:
- Timestamp (relative: "5 min ago")
- Activity type icon
- Description
- User who performed action
- Quick action link

**API Endpoint**: `GET /api/dashboard/activity-feed?limit=20`

**WebSocket**: `ws://server/dashboard/activity` (real-time updates)

**Activity Types**:
- RMA status changed
- DTR converted
- Parts shipped
- Installation completed
- New RMA created
- Approval granted/rejected
- Comment added
- Document uploaded

---

### **11. Alerts & Notifications**
**Purpose**: Important notifications requiring attention

**Alert Types**:
- 🔴 Critical: Overdue approvals, SLA breaches
- 🟠 Warning: Delays, approaching deadlines
- 🟡 Info: Updates, completions
- 🔵 System: Reports ready, maintenance

**Display**:
- Unread count badge
- Last 5 alerts
- Quick action buttons
- "Clear All" option

**API Endpoint**: `GET /api/dashboard/alerts`

---

## 🔧 Technical Implementation

### Frontend Components Structure
```
src/
├── components/
│   ├── dashboard/
│   │   ├── RMADashboard.tsx (Main container)
│   │   ├── KPICards.tsx
│   │   ├── StatusDistribution.tsx
│   │   ├── PriorityQueue.tsx
│   │   ├── DTRConversions.tsx
│   │   ├── ActiveShipments.tsx
│   │   ├── QuickStats.tsx
│   │   ├── SLAMetrics.tsx
│   │   ├── AnalyticsTrends.tsx
│   │   ├── QuickActions.tsx
│   │   ├── ActivityFeed.tsx
│   │   └── AlertsPanel.tsx
│   └── charts/
│       ├── LineChart.tsx
│       ├── BarChart.tsx
│       ├── PieChart.tsx
│       └── ProgressBar.tsx
```

### Backend API Routes
```javascript
// Dashboard routes
router.get('/api/rma/dashboard/kpis', getDashboardKPIs);
router.get('/api/rma/dashboard/status-distribution', getStatusDistribution);
router.get('/api/rma/dashboard/priority-queue', getPriorityQueue);
router.get('/api/rma/dashboard/recent-conversions', getRecentConversions);
router.get('/api/rma/dashboard/active-shipments', getActiveShipments);
router.get('/api/rma/dashboard/sla-metrics', getSLAMetrics);
router.get('/api/rma/dashboard/analytics', getAnalytics);
router.get('/api/dashboard/activity-feed', getActivityFeed);
router.get('/api/dashboard/alerts', getAlerts);
router.get('/api/dashboard/site-stats', getSiteStats);
router.get('/api/dashboard/projector-stats', getProjectorStats);
```

---

## 📱 Responsive Design

### Desktop (1920px+)
- 3-column layout
- All widgets visible
- Charts full-featured

### Tablet (768px - 1919px)
- 2-column layout
- Collapsed sidebars
- Simplified charts

### Mobile (< 768px)
- Single column
- Stacked widgets
- Swipeable cards
- Bottom navigation

---

## 🎨 Color Scheme & Branding

### Status Colors
```css
--status-under-review: #9CA3AF (Gray)
--status-pending: #FCD34D (Yellow)
--status-ordered: #60A5FA (Blue)
--status-shipped: #34D399 (Green)
--status-waiting: #FB923C (Orange)
--status-completed: #A78BFA (Purple)
--status-rejected: #EF4444 (Red)
```

### Priority Colors
```css
--priority-critical: #DC2626 (Red)
--priority-high: #F59E0B (Orange)
--priority-medium: #FBBF24 (Yellow)
--priority-low: #10B981 (Green)
```

---

## 🔄 Real-Time Updates

### WebSocket Events
```javascript
// Client subscribes to:
ws.subscribe('dashboard:kpis:update');
ws.subscribe('dashboard:rma:statusChange');
ws.subscribe('dashboard:dtr:conversion');
ws.subscribe('dashboard:shipment:update');
ws.subscribe('dashboard:alert:new');

// Server emits:
ws.emit('dashboard:kpis:update', newKPIData);
ws.emit('dashboard:activity:new', newActivity);
```

### Auto-Refresh Intervals
- KPI Cards: 30 seconds
- Status Distribution: 1 minute
- Priority Queue: 30 seconds
- Activity Feed: Real-time (WebSocket)
- Shipment Tracking: 5 minutes
- Analytics: 5 minutes

---

## 🔐 Role-Based Dashboard Views

### Admin
- See all data
- Access to all quick actions
- Can override/edit any RMA
- Full analytics access

### RMA Manager
- See assigned RMAs
- Approval actions
- Team performance metrics
- Can reassign RMAs

### Technician
- See assigned DTRs
- DTR-to-RMA conversions
- Limited RMA view (only converted ones)
- Performance metrics

### Viewer (Reports/Analytics)
- Read-only access
- Full analytics
- Export reports
- No edit permissions

---

## 📊 Performance Optimization

### Caching Strategy
```javascript
// Redis cache for dashboard data
cache.set('dashboard:kpis', data, TTL_30_SECONDS);
cache.set('dashboard:analytics', data, TTL_5_MINUTES);
cache.set('dashboard:status', data, TTL_1_MINUTE);
```

### Lazy Loading
- Charts load on scroll
- Activity feed pagination
- Infinite scroll for alerts

### Data Aggregation
- Pre-computed metrics (run daily)
- Materialized views for analytics
- Indexed database queries

---

## 🎯 Success Metrics

Track dashboard effectiveness:
1. **Time to Key Information**: < 3 seconds
2. **Action Completion Rate**: > 85%
3. **User Satisfaction**: > 4.0/5.0
4. **Dashboard Load Time**: < 2 seconds
5. **Error Rate**: < 0.5%

---

## 🚀 Implementation Phases

### Phase 1: Core Dashboard (Week 1-2)
- ✅ KPI Cards
- ✅ Status Distribution
- ✅ Priority Queue
- ✅ Quick Actions

### Phase 2: Advanced Features (Week 3-4)
- ✅ DTR Conversions widget
- ✅ Active Shipments
- ✅ SLA Metrics
- ✅ Activity Feed

### Phase 3: Analytics (Week 5-6)
- ✅ Trend charts
- ✅ Failure analysis
- ✅ Site/Projector stats
- ✅ Custom reports

### Phase 4: Real-Time & Polish (Week 7-8)
- ✅ WebSocket integration
- ✅ Alerts system
- ✅ Responsive design
- ✅ Performance optimization

---

## 📝 Next Steps

1. **Review this specification** and provide feedback
2. **Create wireframes/mockups** for visual approval
3. **Set up backend routes** and data structures
4. **Build frontend components** incrementally
5. **Test with real data** and iterate
6. **Deploy and monitor** performance

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Status**: Ready for Implementation





