# FSE Workflow Testing Guide

## Overview
This guide helps you test the complete FSE (Field Service Engineer) workflow, including the integration between the step-by-step workflow and the comprehensive ASCOMP service report form.

## What's Been Fixed
✅ **Integration Issue Resolved**: The FSEWorkflow now properly integrates with the ASCOMPServiceReportForm
✅ **Seamless Data Flow**: Workflow data (photos, work details, issues) automatically flows into the ASCOMP report
✅ **Two Report Options**: FSEs can choose between a basic report or the comprehensive ASCOMP report

## Testing the Complete FSE Workflow

### Step 1: Access the FSE Workflow
1. **Navigate to Mobile FSE Portal**:
   - Go to: `#mobile-fse` (or click "Mobile Portal" button in FSE Dashboard)
   - Or access directly: `http://localhost:3000/#mobile-fse`

2. **Start the Workflow**:
   - Click "Start Workflow" button on the dashboard
   - This opens the step-by-step FSE workflow

### Step 2: Test Each Workflow Step

#### Step 1: Select Service Visit
- **Expected**: List of available service visits
- **Test**: Select a visit from the list
- **Verify**: Visit details are loaded and step is marked complete

#### Step 2: Start Service
- **Expected**: Service visit details displayed
- **Test**: Click "Start Service" button
- **Verify**: Start time is recorded and step is marked complete

#### Step 3: Capture Photos
- **Expected**: Photo capture interface
- **Test**: 
  - Select photo category (Before/During/After Service)
  - Take or upload photos
  - Add descriptions
- **Verify**: Photos are captured and step is marked complete

#### Step 4: Record Work Details
- **Expected**: Work recording form
- **Test**:
  - Enter work performed description
  - Add issues found
  - Add parts used
  - Add recommendations
- **Verify**: All data is saved and step is marked complete

#### Step 5: Generate Report ⭐ **KEY STEP**
- **Expected**: Two options available:
  1. **Generate Basic Report** - Simple report with collected data
  2. **Fill ASCOMP Report** - Comprehensive 11-step ASCOMP form

- **Test ASCOMP Integration**:
  1. Click "Fill ASCOMP Report" button
  2. ASCOMP form should open in a modal
  3. Verify that workflow data is pre-filled:
     - Site name
     - Projector serial/model
     - Engineer information
     - Work performed
     - Issues found
     - Parts used
     - Recommendations

#### Step 6: Site In-charge Signature
- **Expected**: Signature capture form
- **Test**: Enter site in-charge and FSE names
- **Verify**: Signatures are captured and step is marked complete

#### Step 7: Complete Service
- **Expected**: Service completion summary
- **Test**: Click "Complete Service"
- **Verify**: 
  - Service visit status is updated to "Completed"
  - Report is submitted successfully
  - Success message is displayed

## Testing the ASCOMP Report Form Integration

### Pre-filled Data Verification
When you click "Fill ASCOMP Report" in Step 5, verify these fields are pre-filled:

1. **Engineer Information**:
   - Name: From user profile
   - Phone: From user profile
   - Email: From user profile

2. **Site Information**:
   - Site Name: From selected visit
   - Projector Serial: From selected visit
   - Projector Model: From selected visit

3. **Work Details** (from Step 4):
   - Work Performed: Text from workflow
   - Issues Found: List from workflow
   - Parts Used: List from workflow
   - Recommendations: Text from workflow

### ASCOMP Form Testing
1. **Navigate through all 11 steps** of the ASCOMP form
2. **Fill in technical details**:
   - Optical components status
   - Electronics status
   - Mechanical components status
   - Image evaluation
   - Color measurements
   - Screen and voltage parameters
   - Environment status
   - Observations

3. **Submit the report**:
   - Click "Submit Report" in Step 11
   - Verify success message
   - Check that workflow continues to Step 6

## Expected Data Flow

```
FSE Workflow Steps → ASCOMP Report Form → Database
     ↓                    ↓                    ↓
1. Select Visit      → Pre-fill site info  → Save report
2. Start Service     → Record timestamps   → Update visit
3. Capture Photos    → Include photos      → Link photos
4. Record Work       → Pre-fill work data  → Save details
5. Generate Report   → Open ASCOMP form    → Submit report
6. Site Signature    → Capture signatures  → Save signatures
7. Complete Service  → Final submission    → Mark complete
```

## Troubleshooting

### Common Issues and Solutions

1. **ASCOMP Form Not Opening**:
   - Check browser console for errors
   - Verify the global function `openASCOMPForm` is set
   - Try refreshing the page

2. **Data Not Pre-filled**:
   - Ensure you've completed Steps 1-4 before opening ASCOMP form
   - Check that `selectedVisit` and `workflowData` are populated
   - Verify the `initialData` prop is being passed correctly

3. **Report Submission Fails**:
   - Check network tab for API errors
   - Verify backend is running
   - Check console for error messages

4. **Photos Not Included**:
   - Ensure photos were captured in Step 3
   - Check that photo files are properly converted to URLs
   - Verify photo data structure matches expected format

## Test Scenarios

### Scenario 1: Complete Workflow with ASCOMP Report
1. Start workflow
2. Complete all steps 1-4
3. In Step 5, choose "Fill ASCOMP Report"
4. Complete all 11 ASCOMP form steps
5. Submit report
6. Complete remaining workflow steps
7. Verify final completion

### Scenario 2: Basic Report Only
1. Start workflow
2. Complete all steps 1-4
3. In Step 5, choose "Generate Basic Report"
4. Complete remaining workflow steps
5. Verify basic report is created

### Scenario 3: Data Validation
1. Start workflow with incomplete data
2. Try to proceed to ASCOMP form
3. Verify validation prevents submission
4. Complete missing data
5. Retry submission

## Success Criteria

✅ **Workflow Integration**: FSEWorkflow and ASCOMPServiceReportForm work together seamlessly
✅ **Data Flow**: All workflow data properly flows into the ASCOMP report
✅ **User Experience**: FSEs can complete the entire process without confusion
✅ **Report Quality**: Both basic and ASCOMP reports are properly generated
✅ **Status Updates**: Service visits are properly marked as completed
✅ **Error Handling**: Appropriate error messages and recovery options

## Next Steps

After successful testing:
1. Deploy to staging environment
2. Train FSEs on the new workflow
3. Monitor usage and gather feedback
4. Make improvements based on real-world usage

---

**Note**: This integration ensures that FSEs can follow a structured workflow while still having access to the comprehensive ASCOMP reporting format when needed.
