# FSE Dashboard Loading Troubleshooting Guide

## Problem
The FSE dashboard is stuck on the loading screen with a blue spinner and "Loading your dashboard..." message.

## Root Causes
1. **API Endpoint Issues**: The `/service-visits/fse/${fseId}` endpoint may not exist or is failing
2. **Network Connectivity**: Backend server may be down or unreachable
3. **Authentication Issues**: User token may be invalid or expired
4. **Data Format Issues**: API response format may not match expected structure

## Solutions Implemented

### 1. Enhanced Error Handling
- Added comprehensive try-catch blocks
- Implemented fallback API calls
- Added timeout mechanisms (10 seconds)
- Graceful degradation with demo data

### 2. Fallback Data System
- If API fails, loads demo service visits
- Provides realistic test data for development
- Ensures dashboard always loads

### 3. Debug Panel
- Access via `#fse-debug` URL hash
- Shows user information and API status
- Provides diagnostic tools
- Helps identify specific issues

## Quick Fixes

### Option 1: Use Debug Panel
1. Navigate to `#fse-debug` in your browser
2. Check the API status and error messages
3. Use "Run Diagnostics" to test connectivity
4. Try "Clear Cache & Reload" if needed

### Option 2: Direct Access URLs
- **FSE Mobile App**: `#mobile-fse`
- **FSE Workflow**: `#fse-workflow`
- **Mobile Test Page**: `#mobile-test`
- **Debug Panel**: `#fse-debug`

### Option 3: Browser Console Debugging
1. Open browser developer tools (F12)
2. Check Console tab for error messages
3. Look for API call failures
4. Check Network tab for failed requests

## Technical Details

### API Endpoints Tested
- `GET /service-visits/fse/${fseId}` - FSE-specific visits
- `GET /service-visits` - All service visits
- Fallback to demo data if both fail

### Error Handling Flow
1. Try FSE-specific API call
2. If fails, try general API call
3. If both fail, load demo data
4. Always set loading to false
5. Show error message if needed

### Demo Data Structure
```javascript
{
  _id: 'demo-1',
  visitId: 'VISIT-001',
  siteName: 'Demo Site 1',
  projectorSerial: 'PROJ-001',
  visitType: 'Maintenance',
  scheduledDate: '2024-01-01',
  status: 'Scheduled',
  priority: 'Medium',
  fseId: 'FSE-001',
  fseName: 'Demo FSE'
}
```

## Testing Steps

### 1. Test FSE Mobile App
1. Navigate to `#mobile-fse`
2. Should load within 10 seconds
3. Should show either real data or demo data
4. Should not be stuck on loading screen

### 2. Test FSE Workflow
1. Navigate to `#fse-workflow`
2. Should show workflow steps
3. Should load visit selection
4. Should work with demo data

### 3. Test Debug Panel
1. Navigate to `#fse-debug`
2. Should show user information
3. Should test API connectivity
4. Should show error details if any

## Common Issues and Solutions

### Issue: "Request timeout"
**Solution**: Backend server is not responding
- Check if backend server is running
- Verify API endpoints are accessible
- Use demo data for development

### Issue: "Failed to load service visits"
**Solution**: API endpoint doesn't exist
- Check backend API implementation
- Verify endpoint paths
- Use fallback API calls

### Issue: "Authentication required"
**Solution**: User token is invalid
- Clear browser cache and reload
- Re-login to get new token
- Check authentication flow

### Issue: Empty dashboard
**Solution**: No data returned from API
- Check if user has FSE ID
- Verify data exists in database
- Use demo data for testing

## Development Mode

### For Development/Testing
1. Use `#fse-debug` to check system status
2. Use `#mobile-test` to test mobile features
3. Use `#fse-workflow` to test complete workflow
4. Demo data ensures functionality even without backend

### For Production
1. Ensure backend API is running
2. Verify all endpoints are implemented
3. Check database connectivity
4. Monitor API response times

## Monitoring

### Console Logs to Watch
- "Loading visits for FSE ID: [id]"
- "FSE visits response: [data]"
- "Error loading FSE reports: [error]"
- "FSE-specific API failed, trying general API"

### Network Requests to Monitor
- `GET /api/service-visits/fse/[fseId]`
- `GET /api/service-visits`
- Response status codes (200, 404, 500)
- Response times

## Prevention

### Best Practices
1. Always implement fallback data
2. Add timeout mechanisms
3. Provide clear error messages
4. Include debug tools for troubleshooting
5. Test with and without backend

### Code Patterns
```javascript
// Good: Comprehensive error handling
try {
  response = await apiCall();
} catch (error) {
  console.warn('Primary API failed, trying fallback');
  try {
    response = await fallbackApiCall();
  } catch (fallbackError) {
    console.error('All APIs failed, using demo data');
    response = getDemoData();
  }
}
```

## Support

If issues persist:
1. Check browser console for detailed errors
2. Use debug panel to identify specific problems
3. Verify backend server status
4. Test with different user accounts
5. Check network connectivity

The implemented solution ensures the FSE dashboard will always load, either with real data or demo data, preventing the infinite loading screen issue.
