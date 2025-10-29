# RMA User Setup Guide

## 🎯 User Roles for DTR to RMA Workflow

This guide helps you create users for the complete DTR to RMA workflow system.

---

## 👥 **User Roles Available**

### 1. **Admin** 👑
- Full system access
- Can see all RMAs and DTRs
- Manage all users and settings
- Access to complete dashboard

### 2. **RMA Manager** 📋
- Manage RMA lifecycle
- Approve/reject RMAs
- Assign RMAs
- View assigned RMAs only
- Access RMA Portal Dashboard

### 3. **Technician** 🔧
- Create and manage DTRs
- Perform troubleshooting
- Convert DTR to RMA
- View converted RMAs

### 4. **Engineer** 👨‍💻
- Similar to Technician
- Handle complex technical issues
- Manage service visits

### 5. **FSE (Field Service Engineer)** 🚗
- Service visit management
- Upload photos
- Update service status

---

## 🚀 **Quick Setup - Create RMA Users**

### **Method 1: Using Scripts (Recommended)**

I've created ready-to-use scripts for you!

#### **Step 1: Create RMA Manager**
```bash
# From project root
node create-rma-manager.js
```

**Default Credentials:**
- Username: `rma_manager`
- Email: `rma.manager@ascomp.com`
- Password: `rma123`
- Role: `rma_manager`

#### **Step 2: Create Technician**
```bash
# From project root
node create-technician.js
```

**Default Credentials:**
- Username: `technician`
- Email: `technician@ascomp.com`
- Password: `tech123`
- Role: `technician`

---

### **Method 2: Manual Creation via Database**

#### **Using MongoDB Compass or Atlas:**

1. Open your database
2. Go to `users` collection
3. Insert new document:

**RMA Manager:**
```json
{
  "username": "rma_manager",
  "email": "rma.manager@ascomp.com",
  "password": "$2a$12$[hashed_password]",
  "role": "rma_manager",
  "isActive": true,
  "profile": {
    "firstName": "RMA",
    "lastName": "Manager",
    "phone": "+91-9876543210"
  },
  "permissions": [
    "view_dashboard",
    "manage_rma",
    "manage_spare_parts",
    "assign_rma",
    "view_analytics",
    "export_data"
  ],
  "createdAt": "2025-01-08T10:00:00.000Z",
  "updatedAt": "2025-01-08T10:00:00.000Z"
}
```

**Technician:**
```json
{
  "username": "technician",
  "email": "technician@ascomp.com",
  "password": "$2a$12$[hashed_password]",
  "role": "technician",
  "isActive": true,
  "profile": {
    "firstName": "John",
    "lastName": "Technician",
    "phone": "+91-9876543211"
  },
  "permissions": [
    "view_dashboard",
    "manage_dtr",
    "troubleshoot_dtr",
    "convert_dtr_to_rma",
    "view_analytics"
  ],
  "createdAt": "2025-01-08T10:00:00.000Z",
  "updatedAt": "2025-01-08T10:00:00.000Z"
}
```

**Note:** Password must be bcrypt hashed. Use the scripts instead for automatic hashing.

---

### **Method 3: Create via User Management Page**

1. Login as **Admin**
2. Go to **User Management** page
3. Click **"Add User"**
4. Fill in details:
   - Username
   - Email
   - Password
   - **Role**: Select `rma_manager` or `technician`
   - First Name, Last Name, Phone
5. Click **Save**

---

## 📋 **Role Permissions Breakdown**

### **Admin Permissions:**
```javascript
[
  'view_dashboard',
  'manage_sites',
  'manage_projectors',
  'manage_fse',
  'manage_service_visits',
  'manage_purchase_orders',
  'manage_rma',
  'manage_spare_parts',
  'view_analytics',
  'export_data',
  'manage_dtr',
  'troubleshoot_dtr',
  'convert_dtr_to_rma',
  'assign_rma'
]
```

### **RMA Manager Permissions:**
```javascript
[
  'view_dashboard',
  'manage_rma',
  'manage_spare_parts',
  'assign_rma',
  'view_analytics',
  'export_data'
]
```

### **Technician Permissions:**
```javascript
[
  'view_dashboard',
  'manage_dtr',
  'troubleshoot_dtr',
  'convert_dtr_to_rma',
  'view_analytics'
]
```

### **Engineer Permissions:**
```javascript
[
  'view_dashboard',
  'manage_dtr',
  'troubleshoot_dtr',
  'manage_service_visits',
  'view_analytics'
]
```

### **FSE Permissions:**
```javascript
[
  'view_dashboard',
  'manage_service_visits',
  'upload_photos',
  'update_service_status'
]
```

---

## 🔐 **Default Credentials Summary**

| Role | Username | Email | Password | Access |
|------|----------|-------|----------|--------|
| Admin | admin | admin@ascomp.com | admin123 | Everything |
| RMA Manager | rma_manager | rma.manager@ascomp.com | rma123 | RMA Portal Dashboard |
| Technician | technician | technician@ascomp.com | tech123 | DTR Management |

**⚠️ SECURITY WARNING:** Change all default passwords after first login!

---

## 🧪 **Testing the Workflow**

### **Test DTR to RMA Workflow:**

1. **Login as Technician** (`technician@ascomp.com`)
   - Create a new DTR
   - Add troubleshooting steps
   - Mark for RMA conversion
   - Convert to RMA

2. **Login as RMA Manager** (`rma.manager@ascomp.com`)
   - View RMA Portal Dashboard
   - See newly converted RMA
   - Review and approve
   - Manage RMA lifecycle

3. **Login as Admin** (`admin@ascomp.com`)
   - View everything
   - See all DTRs and RMAs
   - Access complete dashboard

---

## 📊 **What Each Role Sees**

### **Admin Dashboard:**
```
✅ All RMAs (entire system)
✅ All DTRs
✅ All sites and projectors
✅ Complete analytics
✅ All shipments
✅ System-wide metrics
```

### **RMA Manager Dashboard:**
```
✅ Only assigned RMAs
✅ Personal performance metrics
✅ Assigned shipments
✅ Limited analytics (own data)
✅ Team metrics
```

### **Technician Dashboard:**
```
✅ Own DTRs
✅ Converted RMAs (that they created)
✅ Troubleshooting tasks
✅ Limited analytics
```

---

## 🔄 **Complete Workflow Example**

### **Step 1: DTR Creation** (Technician)
```
1. Login as: technician@ascomp.com
2. Navigate to: Daily Trouble Reports
3. Click: "New DTR"
4. Fill in: Projector serial, complaint, site
5. Submit DTR
```

### **Step 2: Troubleshooting** (Technician)
```
1. Open DTR
2. Click: "Add Troubleshooting"
3. Document: Action taken and outcome
4. Repeat until issue resolved or escalated
```

### **Step 3: Convert to RMA** (Technician)
```
1. Open DTR
2. Click: "Convert to RMA"
3. Select: RMA Manager
4. Provide: Conversion reason
5. Submit conversion
```

### **Step 4: RMA Management** (RMA Manager)
```
1. Login as: rma.manager@ascomp.com
2. Navigate to: RMA Portal Dashboard
3. View: Recent DTR Conversions
4. Click: "Review" on converted RMA
5. Approve/Reject RMA
6. Manage: Parts, shipping, lifecycle
```

---

## 🛠️ **Customization**

### **Edit User Details in Scripts:**

Open `create-rma-manager.js` and modify:

```javascript
const rmaManagerData = {
  username: 'your_username',        // Change username
  email: 'your.email@company.com',  // Change email
  password: 'your_password',        // Change password
  role: 'rma_manager',
  profile: {
    firstName: 'Your',              // Change first name
    lastName: 'Name',               // Change last name
    phone: '+91-1234567890'         // Change phone
  }
};
```

Then run: `node create-rma-manager.js`

---

## 🚨 **Troubleshooting**

### **Script Fails:**
```bash
# Make sure MongoDB is connected
# Check .env file has MONGODB_URI

# Install dependencies if needed
npm install mongoose bcryptjs dotenv
```

### **User Already Exists:**
```
The script will ask if you want to delete and recreate.
Type 'yes' to proceed or 'no' to cancel.
```

### **Can't Login:**
```
1. Check username/email spelling
2. Verify password is correct
3. Check user.isActive = true in database
4. Clear browser cache/cookies
```

### **No Permissions:**
```
1. Check user.role is set correctly
2. Verify permissions array
3. Re-login to refresh session
```

---

## 📝 **Multiple Users**

### **Create Multiple RMA Managers:**

Edit the script and change:
```javascript
username: 'rma_manager_2',
email: 'rma.manager2@ascomp.com',
```

### **Create Multiple Technicians:**

Edit the script and change:
```javascript
username: 'technician_2',
email: 'technician2@ascomp.com',
```

---

## ✅ **Verification Checklist**

After creating users:

- [ ] RMA Manager can login
- [ ] RMA Manager sees RMA Portal Dashboard
- [ ] RMA Manager can view assigned RMAs
- [ ] Technician can login
- [ ] Technician can create DTRs
- [ ] Technician can add troubleshooting steps
- [ ] Technician can convert DTR to RMA
- [ ] Admin can see all data
- [ ] Passwords work correctly
- [ ] Roles display correctly

---

## 🎉 **You're Ready!**

Your DTR to RMA workflow system is now fully configured with the proper user roles!

**Next Steps:**
1. Create users using the scripts
2. Login and test each role
3. Create a test DTR
4. Convert it to RMA
5. Manage through RMA Portal

---

## 📞 **Support**

If you need help:
1. Check the logs for errors
2. Verify database connection
3. Ensure all models are up to date
4. Check user permissions in database

**Created:** January 2025  
**Version:** 1.0.0  
**Status:** Ready to Use

























