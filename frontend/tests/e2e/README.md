# End-to-End Tests for NetraAI Healthcare Platform

This directory contains comprehensive E2E tests for all user journeys in the NetraAI Healthcare Platform.

## Test Files

### 1. `patient-journey.spec.ts` (30 tests)
Tests the complete patient workflow:
- **Signup and Login** (3 tests)
  - Patient registration
  - Login with credentials
  - Authentication guards
  
- **Upload Fundus Image and Get Prediction** (3 tests)
  - Navigate to scan upload
  - Upload image and receive ML prediction
  - View scan history
  
- **Book Appointment** (3 tests)
  - Navigate to appointments
  - View available doctors
  - Book appointment with doctor
  
- **View Prescription and Medications** (2 tests)
  - View prescriptions from doctor
  - Mark medications as taken
  
- **Gamification and Achievements** (2 tests)
  - View achievements page
  - Display gamification points
  
- **Additional Features** (7 tests)
  - Chatbot, mental health, exercises, documents, settings, etc.

### 2. `doctor-journey.spec.ts` (28 tests)
Tests the complete doctor workflow:
- **Login and Dashboard** (2 tests)
  - Doctor login
  - Dashboard metrics display
  
- **Manage Appointments** (3 tests)
  - View appointments list
  - Accept pending appointments
  - Set availability schedule
  
- **Video Consultation** (2 tests)
  - Navigate to video consultation
  - Access video interface with LiveKit
  
- **Write Prescription** (3 tests)
  - Navigate to prescriptions
  - Create new prescription
  - View prescription history
  
- **View Patient Scans** (2 tests)
  - View patient scans list
  - View scan details with predictions
  
- **Additional Features** (8 tests)
  - Ratings, revenue, alerts, profile, messages, documents, templates, exercises

### 3. `admin-journey.spec.ts` (30 tests)
Tests the complete admin workflow:
- **Login and Dashboard** (2 tests)
  - Admin login
  - Dashboard metrics display
  
- **User Management** (4 tests)
  - View patients list
  - View doctors list
  - Disable user account
  - Search for users
  
- **Audit Logs** (4 tests)
  - View audit logs
  - Filter by action
  - Filter by date range
  - Export audit logs
  
- **System Monitoring** (2 tests)
  - View system health dashboard
  - View analytics dashboard
  
- **Content Management** (3 tests)
  - Manage blog posts
  - View contact messages
  - Manage newsletter
  
- **Reports and Configuration** (4 tests)
  - View reports
  - System configuration
  - Security settings
  - Epidemic radar
  
- **Additional Features** (5 tests)
  - Team management, reviews, messages, achievements, settings

### 4. `admin-compliance.spec.ts` (10 tests)
Tests the admin compliance portal:
- **Compliance Dashboard** (4 tests)
  - Display compliance dashboard
  - Navigate to FDA APM monitoring
  - Display recent alerts
  - Show quick actions
  
- **FDA APM Monitoring** (6 tests)
  - Display model performance metrics
  - Filter metrics by time range
  - Acknowledge alerts
  - Resolve alerts with notes
  - Export performance report
  - View model selector

## Running Tests

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Tests in Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

### Run Tests in UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Run Tests in Debug Mode
```bash
npm run test:e2e:debug
```

### Run Specific Test File
```bash
npx playwright test tests/e2e/patient-journey.spec.ts
npx playwright test tests/e2e/doctor-journey.spec.ts
npx playwright test tests/e2e/admin-journey.spec.ts
```

### Run Specific Test
```bash
npx playwright test -g "should login as patient successfully"
```

## Test Configuration

Tests are configured in `playwright.config.ts`:
- **Base URL:** http://127.0.0.1:5173
- **Timeout:** 60 seconds per test
- **Retries:** 1 retry in CI, 0 locally
- **Screenshots:** Captured on failure
- **Videos:** Recorded on failure
- **Traces:** Generated on first retry
- **HTML Report:** Generated after test run

## Helper Functions

### Bypass Auth (for testing)
```typescript
// Set bypass auth for patient
await page.addInitScript(() => {
  localStorage.setItem('bypassRole', 'patient');
  localStorage.setItem('bypassEmail', 'playwright+patient@example.com');
});
```

### API Mocking
```typescript
// Mock API response
await page.route('**/api/endpoint**', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: 'mock data' }),
  });
});
```

## Test Results

After running tests, results are available in:
- **HTML Report:** `playwright-report/index.html`
- **Test Results:** `test-results/`
- **Screenshots:** `test-results/*/test-failed-*.png`
- **Videos:** `test-results/*/video.webm`
- **Traces:** `test-results/*/trace.zip`

### View HTML Report
```bash
npx playwright show-report
```

## Known Issues

### Page Load Timeouts
Some pages may timeout during tests due to slow API responses. This is being addressed in Agent 7 (Performance Optimization).

**Affected Pages:**
- `/patient/scan`
- `/patient/history`
- `/patient/appointments`
- `/doctor/appointments`
- `/doctor/prescriptions`
- `/admin/patients`
- `/admin/doctors`
- `/admin/compliance/*`

**Workaround:** Increase timeout in test or optimize API endpoints.

### Achievements Loading Bug
Known issue #3 - Achievements page shows 0 achievements and loading state is stuck.

**Status:** Documented in `tests/bugfix/bug3-achievements-loading-exploration.spec.ts`

### Compliance Portal
All compliance tests are failing, indicating the compliance portal may not be fully implemented or accessible.

**Recommendation:** Verify compliance portal implementation and API endpoints.

## Best Practices

### Writing New Tests
1. Use descriptive test names
2. Organize tests in `describe` blocks
3. Use `beforeEach` for common setup
4. Mock API responses for isolated tests
5. Add proper assertions
6. Handle async operations with `await`
7. Use page object pattern for reusable code

### Example Test Structure
```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Common setup
    await setBypassAuth(page);
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/some-page');
    
    // Act
    await page.click('button');
    
    // Assert
    await expect(page.locator('h1')).toContainText('Expected Text');
  });
});
```

## Debugging Tests

### Debug Mode
```bash
npm run test:e2e:debug
```

This opens the Playwright Inspector where you can:
- Step through tests
- Inspect page elements
- View console logs
- Take screenshots

### Headed Mode
```bash
npm run test:e2e:headed
```

This runs tests in a visible browser window so you can see what's happening.

### Slow Motion
```typescript
// In test file
test.use({ launchOptions: { slowMo: 1000 } });
```

### Pause Test
```typescript
await page.pause();
```

## CI/CD Integration

Tests can be integrated into CI/CD pipeline:

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Contributing

When adding new tests:
1. Follow existing test structure
2. Add tests to appropriate file (patient/doctor/admin)
3. Use helper functions for common operations
4. Mock API responses
5. Add descriptive test names
6. Update this README if adding new test files

## Support

For issues or questions:
- Check `AGENT_6_COMPLETE_REPORT.md` for detailed test results
- Review Playwright documentation: https://playwright.dev
- Check test artifacts in `test-results/`

---

**Last Updated:** 2024-02-15  
**Test Suite Version:** 1.0.0  
**Total Tests:** 98  
**Pass Rate:** 63.3%
