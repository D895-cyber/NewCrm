# Local Setup Guide - Projector Warranty Management System

This guide will help you set up the complete projector warranty management system locally with Express.js backend and MongoDB database.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/downloads)
- **npm** or **yarn** package manager (comes with Node.js)

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd projector-warranty-management
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd server
npm install
```

#### Create Environment File
```bash
# Create .env file in server directory
touch .env
```

#### Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your configuration
nano .env  # or use your preferred editor
```

**Required Environment Variables (.env file):**
```env
# MongoDB Connection (choose one option)
MONGODB_URI=mongodb://localhost:27017/projector_warranty

# For MongoDB Atlas (cloud option):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/projector_warranty

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

**Example .env file contents:**
```env
MONGODB_URI=mongodb://localhost:27017/projector_warranty
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

#### Start MongoDB Service

**On Windows:**
```bash
# Start MongoDB service
net start MongoDB

# Or if installed manually:
mongod --dbpath "C:\data\db"
```

**On macOS:**
```bash
# Using Homebrew
brew services start mongodb-community

# Or manually:
mongod --config /usr/local/etc/mongod.conf
```

**On Linux:**
```bash
# Using systemd
sudo systemctl start mongod

# Or manually:
mongod --dbpath /var/lib/mongodb
```

#### Start the Backend Server
```bash
# Development mode (with auto-restart)
npm run dev

# OR production mode
npm start
```

**✅ Success indicators:**
```
Server running on port 5000
MongoDB connected successfully
Health check: http://localhost:5000/api/health
```

**❌ Common startup errors:**
- `EADDRINUSE: Port 5000 already in use` - Kill process using port 5000
- `MongoNetworkError` - MongoDB not running or wrong connection string
- `Cannot find module` - Run `npm install` in server directory

### 3. Frontend Setup

#### Install Dependencies
```bash
# Navigate back to project root
cd ..

# Install frontend dependencies
npm install
```

#### Start the Frontend
```bash
# Start React development server
npm start
```

The frontend will start on `http://localhost:3000`

### 4. Test Backend Connection

**Before starting frontend, verify backend is running:**

```bash
# Test backend health endpoint
curl http://localhost:5000/api/health

# Should return:
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "database": "connected"
}
```

### 5. Initialize Database

Once both servers are running:

1. Open your browser and go to `http://localhost:3000`
2. If backend is connected, the system will show connection status
3. Navigate to any page to automatically initialize with sample data
4. You should see the dashboard load with projector data

**Connection Status Indicators:**
- 🟢 **Backend Online** - Green wifi icon, system fully functional
- 🔴 **Backend Offline** - Red wifi icon, shows setup instructions

## Database Setup Options

### Option 1: Local MongoDB (Recommended for Development)

1. **Install MongoDB Community Edition**
   - Download from: https://www.mongodb.com/try/download/community
   - Follow installation guide for your OS
   - Start MongoDB service (see commands above)

2. **Verify Installation**
   ```bash
   # Connect to MongoDB shell
   mongosh
   
   # Show databases
   show dbs
   
   # Exit shell
   exit
   ```

3. **Use Default Connection String**
   ```env
   MONGODB_URI=mongodb://localhost:27017/projector_warranty
   ```

### Option 2: MongoDB Atlas (Cloud Option)

1. **Create MongoDB Atlas Account**
   - Go to: https://www.mongodb.com/atlas
   - Sign up for free account
   - Create a new cluster

2. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

3. **Update Environment Variable**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/projector_warranty?retryWrites=true&w=majority
   ```

## Project Structure

```
projector-warranty-management/
├── server/                 # Express.js backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── index.js           # Server entry point
│   ├── package.json       # Backend dependencies
│   └── .env               # Environment variables
├── components/            # React components
│   ├── pages/            # Page components
│   └── ui/               # UI components
├── utils/                # Utility functions
│   └── api/              # API client
├── styles/               # CSS styles
└── App.tsx               # Main React component
```

## API Endpoints

The backend provides the following REST API endpoints:

### Health & Setup
- `GET /api/health` - Check server status
- `POST /api/init-database` - Initialize with sample data

### Sites Management
- `GET /api/sites` - Get all sites
- `POST /api/sites` - Create new site
- `GET /api/sites/:id` - Get site by ID
- `PUT /api/sites/:id` - Update site
- `DELETE /api/sites/:id` - Delete site
- `GET /api/sites/stats/overview` - Get site statistics

### Projectors
- `GET /api/projectors` - Get all projectors
- `GET /api/projectors/:serial` - Get projector by serial
- `POST /api/projectors` - Create new projector
- `PUT /api/projectors/:serial` - Update projector
- `DELETE /api/projectors/:serial` - Delete projector

### Services
- `GET /api/services` - Get all service records
- `POST /api/services` - Create new service
- `GET /api/services/projector/:serial` - Get services by projector

### RMA & Spare Parts
- `GET /api/rma` - Get all RMA records
- `POST /api/rma` - Create new RMA
- `GET /api/spare-parts` - Get all spare parts
- `POST /api/spare-parts` - Create new spare part

## Features Available

### ✅ Implemented Features

1. **Site Management**
   - Add new sites dynamically
   - View all sites with filters
   - Edit and delete sites
   - Site statistics dashboard

2. **Projector Management**
   - Serial number lookup
   - Complete projector lifecycle tracking
   - Service history integration

3. **Service Tracking**
   - Service record management
   - Technician assignment
   - Cost tracking

4. **RMA Management**
   - Return merchandise authorization
   - Status tracking
   - Part replacement workflow

5. **Spare Parts Inventory**
   - Stock management
   - Low stock alerts
   - Part categorization

### 🔄 Data Flow

```
Frontend (React) ↔ Express.js API ↔ MongoDB Database
                    ↓
            - Site Management
            - Projector Tracking
            - Service Records
            - RMA Processing
            - Inventory Management
```

## Troubleshooting

### Common Issues & Solutions

#### 1. "Failed to fetch" / "Backend Offline" Error

**❌ Symptoms:** Red connection indicator, "Backend server not running" message

**✅ Solutions:**
```bash
# 1. Verify backend server is running
cd server
npm run dev

# 2. Check if port 5000 is available
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# 3. Test backend directly
curl http://localhost:5000/api/health
```

#### 2. MongoDB Connection Failed
```bash
# Check if MongoDB is running
ps aux | grep mongod  # On macOS/Linux
tasklist | findstr mongod  # On Windows

# Start MongoDB
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
net start MongoDB  # Windows
```

#### 3. Port Already in Use
```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000  # Windows (note PID, then taskkill /PID <PID> /F)
```

#### 4. CORS Issues
If you see CORS errors in browser console:
- Verify `CORS_ORIGIN=http://localhost:3000` in server/.env
- Restart backend server after changing .env
- Check network tab for blocked requests

#### 5. Database Not Initializing
```bash
# Manual database initialization
curl -X POST http://localhost:5000/api/init-database

# Check database exists
mongosh
use projector_warranty
show collections
```

#### 6. Frontend Shows "No Sites" Even When Backend Connected
- The frontend now shows specific connection status
- Green wifi icon = backend connected
- If connected but no data, backend may need database initialization
- Check browser console for API errors

### Logs and Debugging

#### Backend Logs
```bash
# View server logs
cd server
npm run dev  # Logs will show in terminal
```

#### Frontend Debugging
- Open browser Developer Tools (F12)
- Check Console tab for errors
- Network tab shows API requests

#### Database Debugging
```bash
# Connect to MongoDB shell
mongosh

# Use your database
use projector_warranty

# Show collections
show collections

# Query data
db.sites.find().pretty()
db.projectors.find().pretty()
```

## Development Workflow

### Adding New Features

1. **Backend Changes**
   ```bash
   cd server
   # Make changes to models, routes, etc.
   # Server auto-restarts with nodemon
   ```

2. **Frontend Changes**
   ```bash
   # Make changes to React components
   # Hot reload updates automatically
   ```

3. **Database Schema Changes**
   ```bash
   # Update models in server/models/
   # Clear database if needed:
   mongosh
   use projector_warranty
   db.dropDatabase()
   # Restart server to reinitialize
   ```

### Production Deployment

1. **Environment Setup**
   ```env
   NODE_ENV=production
   MONGODB_URI=<production-database-url>
   PORT=80
   ```

2. **Build Frontend**
   ```bash
   npm run build
   ```

3. **Start Production Server**
   ```bash
   cd server
   npm start
   ```

## Support

### Getting Help

1. **Check Logs** - Look at server and browser console logs
2. **Verify Setup** - Ensure all prerequisites are installed
3. **Test API** - Use Postman or curl to test endpoints directly
4. **Database State** - Check MongoDB collections for data integrity

### Useful Commands

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check MongoDB version
mongod --version

# Test backend health
curl http://localhost:5000/api/health

# View running processes
ps aux | grep node  # macOS/Linux

# Check port usage
netstat -tlnp | grep :5000  # Linux
```

## Startup Checklist

**Before using the application, ensure:**

- [ ] ✅ MongoDB is running (`mongod` process active)
- [ ] ✅ Backend server running (`http://localhost:5000/api/health` responds)
- [ ] ✅ Frontend shows green "Backend Online" indicator
- [ ] ✅ Database initialized (sites/projectors visible)
- [ ] ✅ No CORS errors in browser console

## Quick Commands Reference

```bash
# Start everything (run in separate terminals)

# Terminal 1: MongoDB (if not running as service)
mongod

# Terminal 2: Backend Server
cd server && npm run dev

# Terminal 3: Frontend
npm start

# Test connection
curl http://localhost:5000/api/health
```

## Next Steps

After successful setup:

1. **Connection Verification** - Ensure green wifi icon shows "Backend Online"
2. **Explore the Interface** - Navigate through all pages
3. **Add Sample Data** - Create sites, projectors, services  
4. **Test Features** - Try search, filters, CRUD operations
5. **Customize** - Modify components and styling as needed
6. **Extend** - Add new features or integrate with other systems

## Visual Connection Status

- 🟢 **Backend Online** (Green wifi icon) = Ready to use
- 🔴 **Backend Offline** (Red wifi icon) = Follow setup instructions shown
- ⏳ **Checking...** = Connection test in progress

Your projector warranty management system is now ready for development and testing!