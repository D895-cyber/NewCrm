# CRM System - Technical Architecture

## 🏗️ **System Architecture Overview**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                PRESENTATION LAYER                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   React     │  │   Mobile    │  │   Admin     │  │   Dashboard &            │ │
│  │   Web App   │  │   Interface  │  │   Panel     │  │   Analytics             │ │
│  │             │  │             │  │             │  │                          │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                API GATEWAY LAYER                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   REST      │  │   WebSocket │  │   File      │  │   Authentication        │ │
│  │   API       │  │   Real-time │  │   Upload    │  │   & Authorization      │ │
│  │             │  │   Updates   │  │   Service   │  │                          │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BUSINESS LOGIC LAYER                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   DTR       │  │   Service   │  │   Warranty  │  │   Inventory &            │ │
│  │   Service   │  │   Visit     │  │   Service   │  │   Procurement           │ │
│  │             │  │   Service   │  │             │  │                          │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   User      │  │   Site      │  │   FSE       │  │   Reporting &            │ │
│  │   Service   │  │   Service   │  │   Service   │  │   Analytics             │ │
│  │             │  │             │  │             │  │                          │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA ACCESS LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   MongoDB   │  │   Cloud     │  │   File      │  │   Cache &                │ │
│  │   ODM       │  │   Storage   │  │   System    │  │   Session Store         │ │
│  │   (Mongoose)│  │   Service   │  │             │  │                          │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              INFRASTRUCTURE LAYER                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   MongoDB   │  │   Cloud     │  │   File      │  │   Redis /                │ │
│  │   Database  │  │   Storage   │  │   Storage   │  │   Memory Cache          │ │
│  │             │  │   (AWS S3)  │  │   (Local)   │  │                          │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 **Technology Stack**

### **Frontend**
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Lucide Icons** - Modern icon set

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - Object modeling
- **JWT** - Authentication

### **Infrastructure**
- **Cloud Storage** - File management
- **Real-time Updates** - WebSocket support
- **Mobile Responsive** - Progressive Web App
- **API First** - RESTful architecture

---

## 📊 **Database Schema Overview**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE MODELS                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐   │
│  │     User    │    │     FSE     │    │     Site    │    │   Projector     │   │
│  │             │    │             │    │             │    │                 │   │
│  │ • _id       │    │ • _id       │    │ • _id       │    │ • _id           │   │
│  │ • name      │    │ • name      │    │ • name      │    │ • serialNumber  │   │
│  │ • email     │    │ • contact   │    │ • code      │    │ • model         │   │
│  │ • role      │    │ • region    │    │ • region    │    │ • brand         │   │
│  │ • password  │    │ • skills    │    │ • address   │    │ • installDate   │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────────┘   │
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐   │
│  │     DTR     │    │   Service   │    │   Service   │    │   SparePart     │   │
│  │             │    │    Visit    │    │   Report    │    │                 │   │
│  │ • _id       │    │ • _id       │    │ • _id       │    │ • _id           │   │
│  │ • caseId    │    │ • visitId   │    │ • reportId  │    │ • partNumber    │   │
│  │ • serialNum │    │ • fseId     │    │ • visitId   │    │ • name          │   │
│  │ • status    │    │ • siteId    │    │ • findings  │    │ • cost          │   │
│  │ • priority  │    │ • status    │    │ • actions   │    │ • stock         │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────────┘   │
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐   │
│  │     RMA     │    │   Purchase  │    │   Warranty  │    │   Analytics     │   │
│  │             │    │    Order    │    │   Service   │    │                 │   │
│  │ • _id       │    │ • _id       │    │ • _id       │    │ • _id           │   │
│  │ • caseId    │    │ • orderId   │    │ • caseId    │    │ • metrics       │   │
│  │ • status    │    │ • items     │    │ • type      │    │ • trends        │   │
│  │ • parts     │    │ • total     │    │ • status    │    │ • kpis          │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 **API Endpoints Structure**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API ROUTES                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   /api/auth     │  │   /api/dtr      │  │ /api/visits     │                  │
│  │                 │  │                 │  │                 │                  │
│  │ • POST /login   │  │ • GET /         │  │ • GET /         │                  │
│  │ • POST /logout  │  │ • POST /        │  │ • POST /        │                  │
│  │ • POST /refresh │  │ • PUT /:id      │  │ • PUT /:id      │                  │
│  │                 │  │ • DELETE /:id   │  │ • DELETE /:id   │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  /api/sites     │  │ /api/projectors │  │ /api/parts      │                  │
│  │                 │  │                 │  │                 │                  │
│  │ • GET /         │  │ • GET /         │  │ • GET /         │                  │
│  │ • POST /        │  │ • POST /        │  │ • POST /        │                  │
│  │ • PUT /:id      │  │ • PUT /:id      │  │ • PUT /:id      │                  │
│  │ • DELETE /:id   │  │ • DELETE /:id   │  │ • DELETE /:id   │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  /api/reports   │  │ /api/analytics  │  │ /api/upload     │                  │
│  │                 │  │                 │  │                 │                  │
│  │ • GET /         │  │ • GET /metrics  │  │ • POST /photo   │                  │
│  │ • POST /        │  │ • GET /trends   │  │ • POST /file    │                  │
│  │ • PUT /:id      │  │ • GET /kpis     │  │ • DELETE /:id   │                  │
│  │ • DELETE /:id   │  │ • GET /export   │  │                 │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 **Security Architecture**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SECURITY LAYERS                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Frontend      │  │   API Gateway   │  │   Database      │                  │
│  │   Security      │  │   Security      │  │   Security      │                  │
│  │                 │  │                 │  │                 │                  │
│  │ • Input         │  │ • JWT Tokens    │  │ • Data          │                  │
│  │   Validation    │  │ • Rate Limiting │  │   Encryption    │                  │
│  │ • XSS           │  │ • CORS          │  │ • Access        │                  │
│  │   Protection    │  │ • Input         │  │   Control       │                  │
│  │ • CSRF          │  │   Sanitization  │  │ • Audit Logs    │                  │
│  │   Protection    │  │ • HTTPS         │  │ • Backup        │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   File Upload   │  │   Session       │  │   Network       │                  │
│  │   Security      │  │   Management    │  │   Security      │                  │
│  │                 │  │                 │  │                 │                  │
│  │ • File Type     │  │ • Secure        │  │ • HTTPS/TLS     │                  │
│  │   Validation    │  │   Cookies       │  │ • Firewall      │                  │
│  │ • Size Limits   │  │ • Session       │  │ • DDoS          │                  │
│  │ • Virus Scan    │  │   Timeout       │  │   Protection    │                  │
│  │ • Cloud Storage │  │ • Secure        │  │ • VPN Access    │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 **Mobile & Responsive Design**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RESPONSIVE DESIGN                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Desktop       │  │     Tablet      │  │     Mobile      │                  │
│  │   (1200px+)     │  │   (768-1199px)  │  │   (<768px)      │                  │
│  │                 │  │                 │  │                 │                  │
│  │ • Full          │  │ • Adaptive      │  │ • Mobile-first  │                  │
│  │   Dashboard     │  │   Layout        │  │   Design        │                  │
│  │ • Sidebar       │  │ • Collapsible   │  │ • Touch         │                  │
│  │   Navigation    │  │   Navigation    │  │   Optimized     │                  │
│  │ • Multi-column  │  │ • Responsive    │  │ • Swipe         │                  │
│  │   Layout        │  │   Tables        │  │   Gestures      │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Progressive   │  │   Offline       │  │   Performance   │                  │
│  │   Web App       │  │   Capability    │  │   Optimization  │                  │
│  │                 │  │                 │  │                 │                  │
│  │ • Installable   │  │ • Service       │  │ • Lazy Loading  │                  │
│  │ • App-like      │  │   Worker        │  │ • Image         │                  │
│  │   Experience    │  │ • Cache         │  │   Optimization  │                  │
│  │ • Push          │  │   Strategy      │  │ • Code          │                  │
│  │   Notifications │  │ • Offline       │  │   Splitting     │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 **Deployment & Scalability**

### **Current Setup**
- **Development**: Local MongoDB + Node.js
- **File Storage**: Local file system
- **Frontend**: Vite dev server

### **Production Ready**
- **Database**: MongoDB Atlas (Cloud)
- **File Storage**: AWS S3 / Cloudinary
- **Backend**: Node.js on cloud platform
- **Frontend**: CDN + static hosting
- **Load Balancing**: Multiple instances
- **Monitoring**: Application performance monitoring

### **Scalability Features**
- **Horizontal Scaling**: Stateless API design
- **Database**: MongoDB sharding support
- **Caching**: Redis for session and data
- **CDN**: Global content delivery
- **Microservices**: Modular architecture ready

---

## 🔍 **Performance Optimization**

### **Frontend**
- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: WebP format + lazy loading
- **Bundle Analysis**: Tree shaking and minification
- **Caching**: Service worker for offline support

### **Backend**
- **Database Indexing**: Optimized queries
- **Connection Pooling**: Efficient database connections
- **Compression**: Gzip compression for responses
- **Rate Limiting**: API protection and optimization

### **Monitoring**
- **Real-time Metrics**: Response times and throughput
- **Error Tracking**: Comprehensive error logging
- **Performance Alerts**: Automated monitoring
- **User Analytics**: Usage patterns and optimization

---

**This architecture provides a solid foundation for enterprise-grade projector warranty management with room for future growth and enhancement.**
