# DTR to RMA Workflow - Updated Process

## 🔄 **UPDATED WORKFLOW** (Corrected)

The workflow has been updated with the correct permissions and process flow.

---

## 🎯 **Correct Workflow Process**

### **Stage 1: DTR Creation (RMA Manager)**

**Who:** RMA Manager ONLY ✅  
**Technician:** CANNOT create DTRs ❌

1. **RMA Manager receives issue report** from customer/site
2. **RMA Manager creates DTR** with:
   - Serial number
   - Complaint description
   - Site information
   - Priority level
   - Problem details

3. **RMA Manager assigns DTR to Technician**
   - Select technician from list
   - Set priority and expected resolution time

---

### **Stage 2: Troubleshooting (Technician)**

**Who:** Assigned Technician ONLY ✅

1. **Technician receives DTR assignment**
2. **Technician performs troubleshooting:**
   - Add troubleshooting step 1
     - Describe action taken
     - Document outcome
     - Attach photos/logs
   - Add troubleshooting step 2
   - Add troubleshooting step 3
   - Continue until resolved or exhausted

3. **Technician can only:**
   - ✅ View assigned DTRs
   - ✅ Add troubleshooting steps to assigned DTRs
   - ✅ Update status of assigned DTRs
   - ❌ Cannot create new DTRs
   - ❌ Cannot assign DTRs to others

---

### **Stage 3: Decision Point (Technician)**

**After troubleshooting, two outcomes:**

#### **Option A: Issue Resolved** ✅
- Technician marks DTR as "Resolved"
- DTR is closed
- No RMA needed

#### **Option B: Issue NOT Resolved** ❌
- Technician marks DTR for RMA conversion
- Provides detailed reason why RMA is needed
- All troubleshooting history preserved

---

### **Stage 4: RMA Conversion (Technician)**

**Who:** Assigned Technician (if issue unresolved) ✅

1. **Technician converts DTR to RMA:**
   - Click "Convert to RMA"
   - Provide conversion reason:
     - "Hardware failure confirmed"
     - "Component replacement required"
     - "All software fixes exhausted"
   - Optionally select RMA Manager
   - Add additional notes

2. **System automatically:**
   - Creates RMA record
   - Transfers all DTR data
   - Includes all troubleshooting history
   - Links RMA to original DTR
   - Assigns to RMA Manager
   - Closes DTR as "Shifted to RMA"

---

### **Stage 5: RMA Management (RMA Manager)**

**Who:** RMA Manager ✅

1. **RMA Manager receives converted RMA**
2. **Reviews complete history:**
   - Original complaint
   - All troubleshooting steps
   - Technician's assessment
   - Conversion reason

3. **RMA Manager actions:**
   - Approve or reject RMA
   - Order replacement parts
   - Manage shipping
   - Track RMA lifecycle
   - Close RMA when complete

---

## 👥 **Updated User Permissions**

### **Admin** 👑
```javascript
Permissions: [
  'view_dashboard',
  'create_dtr',           // Can create DTRs
  'manage_dtr',           // Can manage all DTRs
  'assign_dtr',           // Can assign DTRs
  'troubleshoot_dtr',     // Can add troubleshooting
  'convert_dtr_to_rma',   // Can convert to RMA
  'manage_rma',           // Can manage RMAs
  'assign_rma',           // Can assign RMAs
  // ... all other permissions
]

Can Do:
✅ Everything
✅ Create DTRs
✅ Assign DTRs to technicians
✅ View all DTRs and RMAs
✅ Override any process
```

### **RMA Manager** 📋
```javascript
Permissions: [
  'view_dashboard',
  'create_dtr',           // ✅ Can create DTRs
  'manage_dtr',           // ✅ Can manage DTRs
  'assign_dtr',           // ✅ Can assign to technicians
  'manage_rma',           // ✅ Can manage RMAs
  'assign_rma',           // ✅ Can assign RMAs
  'manage_spare_parts',
  'view_analytics',
  'export_data'
]

Can Do:
✅ Create new DTRs
✅ Assign DTRs to technicians
✅ View all DTRs
✅ Manage RMA lifecycle
✅ Approve/reject RMAs
✅ Access RMA Portal Dashboard

Cannot Do:
❌ Add troubleshooting steps (that's technician's job)
❌ Cannot view DTRs assigned to other managers (unless admin)
```

### **Technician** 🔧
```javascript
Permissions: [
  'view_dashboard',
  'troubleshoot_dtr',     // ✅ Can add troubleshooting
  'convert_dtr_to_rma',   // ✅ Can convert to RMA
  'view_analytics'
]

Can Do:
✅ View assigned DTRs ONLY
✅ Add troubleshooting steps to assigned DTRs
✅ Update status of assigned DTRs
✅ Mark DTR for RMA conversion
✅ Convert assigned DTR to RMA (if unresolved)
✅ View RMAs they created from DTRs

Cannot Do:
❌ Create new DTRs
❌ Assign DTRs
❌ View other technicians' DTRs
❌ Manage RMAs (after conversion, RMA Manager takes over)
```

### **Engineer** 👨‍💻
```javascript
Permissions: [
  'view_dashboard',
  'troubleshoot_dtr',     // ✅ Can add troubleshooting
  'convert_dtr_to_rma',   // ✅ Can convert to RMA
  'manage_service_visits',
  'view_analytics'
]

Can Do:
✅ Same as Technician
✅ Plus: Manage service visits

Cannot Do:
❌ Create DTRs
❌ Assign DTRs
```

---

## 🔒 **Security & Access Control**

### **DTR Creation Endpoint**
```javascript
POST /api/dtr

Access:
✅ Admin
✅ RMA Manager
❌ Technician (403 Forbidden)
❌ Engineer (403 Forbidden)
```

### **Assign Technician Endpoint**
```javascript
POST /api/dtr/:id/assign-technician

Access:
✅ Admin
✅ RMA Manager
❌ Technician (403 Forbidden)
```

### **Add Troubleshooting Endpoint**
```javascript
POST /api/dtr/:id/troubleshooting

Access:
✅ Admin (all DTRs)
✅ Technician (assigned DTRs only)
✅ Engineer (assigned DTRs only)
❌ RMA Manager (403 Forbidden)

Validation:
- Technicians can ONLY add to their assigned DTRs
- Returns 403 if trying to add to non-assigned DTR
```

### **Convert to RMA Endpoint**
```javascript
POST /api/dtr/:id/convert-to-rma

Access:
✅ Admin (all DTRs)
✅ RMA Manager (all DTRs)
✅ Technician (assigned DTRs only)
✅ Engineer (assigned DTRs only)

Validation:
- Technicians can ONLY convert their assigned DTRs
- Returns 403 if trying to convert non-assigned DTR
```

---

## 📊 **Complete Workflow Example**

### **Day 1, 09:00 - Issue Reported**
```
Customer calls: "Projector XYZ-123 has no display"
```

### **Day 1, 09:30 - RMA Manager Creates DTR**
```
RMA Manager (Sarah):
- Logs into system
- Creates DTR-2025-001
- Serial: XYZ-123
- Issue: No display output
- Priority: High
- Assigns to: John (Technician)
```

### **Day 1, 10:00 - Technician Receives Assignment**
```
Technician (John):
- Receives notification
- Views assigned DTR-2025-001
- Status: Assigned to me
```

### **Day 1, 10:30 - Troubleshooting Step 1**
```
Technician (John):
- Action: Checked all cable connections
- Outcome: All cables secure, issue persists
- Status: In Progress
```

### **Day 1, 11:00 - Troubleshooting Step 2**
```
Technician (John):
- Action: Tested with different input source
- Outcome: Same issue across HDMI, VGA, USB-C
- Status: In Progress
```

### **Day 1, 14:00 - Troubleshooting Step 3**
```
Technician (John):
- Action: Replaced HDMI cable with known working cable
- Outcome: No change, issue persists
- Status: In Progress
```

### **Day 1, 15:00 - Troubleshooting Step 4**
```
Technician (John):
- Action: Tested signal board output with multimeter
- Outcome: No signal detected from board
- Conclusion: Hardware failure confirmed
- Status: Ready for RMA
```

### **Day 1, 16:00 - Technician Converts to RMA**
```
Technician (John):
- Clicks "Convert to RMA"
- Reason: "Signal board hardware failure confirmed. All troubleshooting steps exhausted. Component replacement required."
- Selects: Sarah (RMA Manager)
- Creates: RMA-2025-045
- DTR-2025-001 Status: Shifted to RMA
```

### **Day 2, 09:00 - RMA Manager Reviews**
```
RMA Manager (Sarah):
- Views RMA Portal Dashboard
- Sees new RMA-2025-045 from DTR-2025-001
- Reviews 4 troubleshooting steps
- Reviews John's assessment
- Decision: Approve RMA
```

### **Day 2, 10:00 - RMA Manager Takes Action**
```
RMA Manager (Sarah):
- Approves RMA-2025-045
- Orders signal board from CDS
- Status: Parts Ordered
- Expected delivery: 3 days
```

---

## 🎯 **Key Differences from Before**

### **❌ OLD (Incorrect) Workflow:**
```
Technician creates DTR
     ↓
Technician troubleshoots
     ↓
Technician converts to RMA
     ↓
RMA Manager receives RMA
```

### **✅ NEW (Correct) Workflow:**
```
RMA Manager creates DTR
     ↓
RMA Manager assigns to Technician
     ↓
Technician troubleshoots assigned DTR
     ↓
Technician converts to RMA (if unresolved)
     ↓
RMA Manager receives and manages RMA
```

---

## 🔐 **Updated Login Credentials**

### **RMA Manager:**
```
Email: rma.manager@ascomp.com
Password: rma123
Role: rma_manager

Can:
- Create DTRs ✅
- Assign to technicians ✅
- Manage RMAs ✅
```

### **Technician:**
```
Email: technician@ascomp.com
Password: tech123
Role: technician

Can:
- View assigned DTRs ✅
- Add troubleshooting ✅
- Convert to RMA ✅

Cannot:
- Create DTRs ❌
- Assign DTRs ❌
```

---

## 📝 **Testing the Correct Workflow**

### **Test Script:**

1. **Login as RMA Manager** (`rma.manager@ascomp.com`)
   ```
   ✅ Go to "Daily Trouble Reports"
   ✅ Click "New DTR"
   ✅ Fill in details
   ✅ Click "Assign Technician"
   ✅ Select technician from dropdown
   ✅ Submit DTR
   ```

2. **Login as Technician** (`technician@ascomp.com`)
   ```
   ✅ View "My Assigned DTRs"
   ✅ Open assigned DTR
   ✅ Click "Add Troubleshooting Step"
   ✅ Document action and outcome
   ✅ Submit step
   ✅ Repeat 3-4 times
   ✅ Click "Convert to RMA"
   ✅ Provide reason
   ✅ Submit conversion
   ```

3. **Login as RMA Manager** (`rma.manager@ascomp.com`)
   ```
   ✅ Go to RMA Portal Dashboard (#rma-dashboard)
   ✅ View "Recent DTR Conversions"
   ✅ See converted RMA
   ✅ Review all troubleshooting history
   ✅ Click "Approve"
   ✅ Manage RMA lifecycle
   ```

---

## ✅ **Verification Checklist**

- [ ] RMA Manager can create DTRs
- [ ] RMA Manager can assign DTRs to technicians
- [ ] Technician CANNOT create DTRs (gets 403 error)
- [ ] Technician can view only assigned DTRs
- [ ] Technician can add troubleshooting to assigned DTRs
- [ ] Technician CANNOT troubleshoot other's DTRs (gets 403)
- [ ] Technician can convert assigned DTR to RMA
- [ ] Technician CANNOT convert other's DTRs (gets 403)
- [ ] RMA Manager receives converted RMA
- [ ] All troubleshooting history preserved in RMA
- [ ] Permissions enforced correctly

---

## 🚀 **Ready to Use**

The workflow has been updated with correct permissions!

**Run the scripts to create users:**
```bash
node create-rma-manager.js
node create-technician.js
```

Then test the correct workflow! 🎉

---

**Updated:** January 2025  
**Version:** 2.0.0  
**Status:** ✅ Corrected Workflow

























