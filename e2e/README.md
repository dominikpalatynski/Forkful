# E2E Testing Documentation

## Overview

This document summarizes the E2E testing setup for the Forkful application using Playwright, including authentication configuration, best practices, and lessons learned.

## What We Implemented

### 1. Authentication Setup for Playwright

Created a robust authentication setup that runs once before all tests, storing the authenticated session for reuse across test suites.

**Files Created/Modified:**

- `e2e/auth.setup.ts` - Authentication setup script
- `playwright.config.js` - Updated configuration to use setup project
- Login form components - Added `data-testid` attributes for reliable test selectors

### 2. Test Selectors (data-testid attributes)

Added test-specific attributes to login form components for reliable element targeting:

```tsx
// src/components/auth/form/LoginEmailField.tsx
<Input data-testid="auth-input-email" />

// src/components/auth/form/LoginPasswordField.tsx
<Input data-testid="auth-input-password" />

// src/components/auth/LoginForm.tsx
<Button data-testid="auth-submit-button" />
```

**Why `data-testid`?**

- More stable than CSS classes (which may change for styling)
- More reliable than text content (which may be translated or changed)
- Clear intent: these are for testing purposes
- Recommended by Playwright and React Testing Library

### 3. Playwright Configuration

Updated `playwright.config.js` to include:

- Setup project that runs before tests
- Storage state configuration for session reuse
- Dependency chain (chromium depends on setup)

```javascript
projects: [
  {
    name: "setup",
    testMatch: /.*\.setup\.ts/,
  },
  {
    name: "chromium",
    use: {
      ...devices["Desktop Chrome"],
      storageState: "playwright/.auth/user.json",
    },
    dependencies: ["setup"],
  },
];
```

### 4. Environment Variables

Authentication credentials are stored in `.env.integration`:

```env
E2E_USERNAME=your-test-user@email.com
E2E_PASSWORD=your-test-password
```

## Authentication Flow

1. **Setup runs once** (`e2e/auth.setup.ts`):
   - Navigates to `/auth/login`
   - Waits for network idle (ensures React hydration complete)
   - Fills credentials using reliable input methods
   - Waits for button to be enabled
   - Submits form
   - Waits for navigation to `/recipes`
   - Verifies successful login
   - Saves authentication state to `playwright/.auth/user.json`

2. **Tests reuse authenticated session**:
   - All chromium tests load the saved storage state
   - No need to login again in each test
   - Faster test execution

## Challenges Overcome & Lessons Learned

### Challenge 1: Form Button Disabled State

**Problem:**
Submit button was disabled due to React Hook Form's `isDirty` check:

```tsx
disabled={!form.formState.isDirty || isPending}
```

**Initial Approach (Failed):**

- Used `fill()` method - didn't trigger form's dirty state

**Solution:**

- Use `pressSequentially()` to simulate actual typing
- Triggers proper onChange events
- React Hook Form detects changes and enables button

### Challenge 2: Autocomplete Interference

**Problem:**
Browser autocomplete was filling fields with partial/cached values, causing incorrect values:

- Expected: `e2e_test@mail.com`
- Received: `est@mail.com` or `t@mail.com`

**Failed Approaches:**

1. `fill()` alone - autocomplete overrode values
2. `clear()` + `pressSequentially()` - race condition with autocomplete
3. `click()` + `clear()` + `pressSequentially()` - still had timing issues

**Working Solution:**

```typescript
// Triple-click selects all text (including autocomplete)
await emailInput.click({ clickCount: 3 });

// Type replaces selected text
await emailInput.pressSequentially(E2E_USERNAME, { delay: 30 });
```

### Challenge 3: React Hydration Timing

**Problem:**
Form wasn't ready for interaction immediately after page load.

**Solution:**

```typescript
await page.goto(`${baseURL}/auth/login`, { waitUntil: "networkidle" });
await page.waitForTimeout(500); // Additional safety margin
```

**Why `networkidle`?**

- Waits for all network requests to finish (500ms of no activity)
- Ensures React components are fully hydrated
- React Hook Form is initialized and ready
- More reliable than `load` or `domcontentloaded` for SPAs

## Best Practices for Future E2E Tests

### ✅ DO:

1. **Use `data-testid` attributes** for test selectors
   - Stable and explicit
   - Won't break when styling changes

   ```tsx
   <Button data-testid="submit-button">Submit</Button>
   ```

2. **Wait for `networkidle` for React/Astro pages**

   ```typescript
   await page.goto(url, { waitUntil: "networkidle" });
   ```

3. **Use `pressSequentially()` for form inputs with React Hook Form**
   - Triggers proper onChange events
   - Marks form as dirty

   ```typescript
   await input.pressSequentially(value, { delay: 30 });
   ```

4. **Handle autocomplete with triple-click**

   ```typescript
   await input.click({ clickCount: 3 }); // Select all
   await input.pressSequentially(value);
   ```

5. **Verify element state before interaction**

   ```typescript
   await expect(button).toBeEnabled({ timeout: 5000 });
   await button.click();
   ```

6. **Store credentials in environment variables**
   - Never hardcode credentials
   - Use `.env.integration` file

7. **Reuse authentication state**
   - Setup project runs once
   - All tests use saved session
   - Faster test execution

### ❌ AVOID:

1. **Don't use `fill()` with React Hook Form**
   - May not trigger onChange events properly
   - Form might not recognize as "dirty"

2. **Don't rely on text content for selectors**

   ```typescript
   // ❌ BAD - breaks with translations/copy changes
   page.getByText("Sign in");

   // ✅ GOOD - stable selector
   page.locator('[data-testid="auth-submit-button"]');
   ```

3. **Don't skip waiting for page readiness**

   ```typescript
   // ❌ BAD - might interact before React hydrates
   await page.goto(url);
   await input.click();

   // ✅ GOOD - wait for full readiness
   await page.goto(url, { waitUntil: "networkidle" });
   await page.waitForTimeout(500);
   await input.click();
   ```

4. **Don't use platform-specific keyboard shortcuts**

   ```typescript
   // ❌ BAD - only works on Windows/Linux
   await input.press("Control+a");

   // ✅ GOOD - works cross-platform
   await input.click({ clickCount: 3 });
   ```

5. **Don't commit authentication credentials**
   - Add `.env.integration` to `.gitignore`
   - Document required env vars in README

6. **Don't login in every test**
   - Use setup project + storage state
   - Only login once per test run

7. **Don't ignore timing issues**
   - If a test is flaky, add proper waits
   - Use `waitFor()`, `waitForTimeout()`, `expect().toBeVisible()`
   - Never rely on implicit waits

## File Structure

```
e2e/
├── auth.setup.ts           # Authentication setup (runs once)
├── tests/
│   └── base.spec.ts        # Example test file
└── README.md               # This file

playwright/
└── .auth/
    └── user.json           # Stored authentication state (auto-generated)

playwright.config.js        # Playwright configuration
.env.integration           # E2E environment variables (not committed)
```

## Running Tests

```bash
# Run all E2E tests (setup runs automatically)
npm run test:e2e

# Run tests in UI mode
npx playwright test --ui

# Run specific test file
npx playwright test e2e/tests/base.spec.ts

# Show last test report
npx playwright show-report
```

## Debugging Failed Tests

1. **Check screenshots**: `test-results/[test-name]/test-failed-1.png`
2. **Check error context**: `test-results/[test-name]/error-context.md`
3. **Run in headed mode**: `npx playwright test --headed`
4. **Use debug mode**: `npx playwright test --debug`
5. **Check console logs**: Add `await page.pause()` to inspect state

## Common Issues & Solutions

### Issue: "Element is not enabled"

**Solution:** Wait for button to be enabled before clicking

```typescript
await expect(button).toBeEnabled({ timeout: 5000 });
await button.click();
```

### Issue: "Timeout waiting for element"

**Solution:** Increase timeout or check selector

```typescript
await element.waitFor({ state: "visible", timeout: 10000 });
```

### Issue: "Unexpected value in input field"

**Solution:** Use triple-click + pressSequentially to handle autocomplete

```typescript
await input.click({ clickCount: 3 });
await input.pressSequentially(value, { delay: 30 });
```

### Issue: Authentication state not persisting

**Solution:** Ensure setup project runs and saves state

```typescript
await page.context().storageState({ path: authFile });
```

## Future Improvements

- [ ] Add visual regression testing
- [ ] Add API mocking for faster tests
- [ ] Create helper functions for common interactions
- [ ] Add custom fixtures for common test scenarios
- [ ] Set up parallel test execution
- [ ] Add CI/CD integration
- [ ] Create page object models for complex pages
