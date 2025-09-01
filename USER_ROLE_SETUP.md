# User Role System Setup Guide

This guide explains how to set up and use the new user role system with Admin and FSE (Field Service Engineer) dashboards.

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Initialize Database with Users

```bash
# Navigate to server directory
cd server

# Run the user initialization script
node init-users.js
```

This will create:
- **Admin User**: `admin` / `admin123`
- **FSE User 1**: `fse1` / `fse123`
- **FSE User 2**: `fse2` / `fse123`

### 3. Start the Application

```bash
# Start backend server
cd server
npm run dev

# In a new terminal, start frontend
npm run dev
```

## 👥 User Roles & Features

### 🔧 Admin Role
**Login**: `admin` / `admin123`

**Features**:
- Full access to all system modules
- Manage sites, projectors, FSEs
- Create and assign service visits
- View analytics and reports
- Manage purchase orders and RMA
- Bulk upload functionality
- User management

**Dashboard**: Complete admin dashboard with all navigation options

### 🔧 FSE (Field Service Engineer) Role
**Login**: `fse1` / `fse123` or `fse2` / `fse123`

**Features**:
- View assigned service visits
- Update service visit status
- Upload photos with descriptions
- Add work performed details
- Mark issues found and resolved
- View customer feedback
- Personal performance metrics

**Dashboard**: Specialized FSE dashboard focused on service visits

## 🔄 Service Visit Workflow

### Admin Workflow:
1. **Create Service Visit**: Admin creates a new service visit
2. **Assign FSE**: Admin assigns the visit to a specific FSE
3. **Monitor Progress**: Admin can track visit status and updates
4. **Review Results**: Admin reviews photos, work performed, and customer feedback

### FSE Workflow:
1. **View Assignments**: FSE sees assigned service visits in their dashboard
2. **Start Visit**: FSE can start a scheduled visit (status: Scheduled → In Progress)
3. **Upload Photos**: FSE can upload photos with descriptions and categories
4. **Complete Visit**: FSE marks visit as completed (status: In Progress → Completed)
5. **Add Details**: FSE can add work performed, issues found, and recommendations

## 📸 Photo Upload System

FSEs can upload photos with:
- **Categories**: Before Service, During Service, After Service, Issue Found, Parts Used, Other
- **Descriptions**: Detailed descriptions of what the photo shows
- **Automatic Timestamps**: Photos are automatically timestamped

## 🔐 Authentication System

- **JWT Tokens**: Secure authentication with JSON Web Tokens
- **Role-based Access**: Different permissions for admin and FSE roles
- **Session Management**: Automatic token verification and refresh
- **Secure Logout**: Proper token cleanup on logout

## 🛠️ Technical Implementation

### Backend Changes:
- **User Model**: New User schema with role-based permissions
- **Authentication Routes**: Login, logout, profile management
- **JWT Middleware**: Token verification for protected routes
- **FSE Integration**: User accounts linked to FSE records

### Frontend Changes:
- **AuthContext**: Global authentication state management
- **LoginPage**: Beautiful login interface
- **Role-based Routing**: Different dashboards for different roles
- **FSEDashboardPage**: Specialized dashboard for FSE users
- **API Integration**: Automatic token handling in API calls

## 🔧 API Endpoints

### Authentication:
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### FSE-specific:
- `GET /api/service-visits/fse/:fseId` - Get FSE's assigned visits
- `PUT /api/service-visits/:id` - Update visit status
- `POST /api/service-visits/:id/photos` - Upload visit photos

## 🎯 Key Features

### For Admins:
- Complete system overview
- FSE management and assignment
- Service visit creation and monitoring
- Analytics and reporting
- User management

### For FSEs:
- Personal dashboard with metrics
- Assigned service visits
- Photo upload with categorization
- Status updates
- Performance tracking

## 🔒 Security Features

- **Password Hashing**: Bcrypt password encryption
- **JWT Tokens**: Secure session management
- **Role-based Permissions**: Granular access control
- **Input Validation**: Server-side validation
- **Error Handling**: Secure error responses

## 🚀 Getting Started

1. **Install dependencies** (see Quick Setup)
2. **Initialize users** with `node init-users.js`
3. **Start the application**
4. **Login with your credentials**
5. **Explore different dashboards**

## 📝 User Credentials

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| Admin | `admin` | `admin123` | Full system access |
| FSE 1 | `fse1` | `fse123` | Rajesh Kumar - Delhi/Noida |
| FSE 2 | `fse2` | `fse123` | Priya Singh - Mumbai/Pune |

## 🔄 Service Visit Status Flow

```
Scheduled → In Progress → Completed
    ↓           ↓           ↓
Admin assigns  FSE starts   FSE completes
to FSE        the visit    the visit
```

## 📱 Responsive Design

Both admin and FSE dashboards are fully responsive and work on:
- Desktop computers
- Tablets
- Mobile phones

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Dark Theme**: Easy on the eyes
- **Real-time Updates**: Live data synchronization
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages
- **Notifications**: Toast notifications for actions

This system provides a complete role-based solution for projector warranty management with specialized interfaces for different user types. 