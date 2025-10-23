import { test as setup, expect } from 'playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, '../playwright/.auth/user.json');

const E2E_USERNAME = process.env.E2E_USERNAME;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

if (!E2E_USERNAME || !E2E_PASSWORD) {
  throw new Error('E2E_USERNAME and E2E_PASSWORD must be set');
}

setup('authenticate', async ({ page, baseURL }) => {
  // Navigate to login page and wait for it to load
  await page.goto(`${baseURL}/auth/login`, { waitUntil: 'networkidle' });

  // Wait for and fill email input
  const emailInput = page.locator('input[data-testid="auth-input-email"]');
  await emailInput.waitFor({ state: 'visible' });

  // Focus the input and triple-click to select all content (works across platforms)
  await emailInput.click({ clickCount: 3 });

  // Type the email (this will replace any selected text)
  await emailInput.pressSequentially(E2E_USERNAME, { delay: 30 });

  // Verify the value
  await expect(emailInput).toHaveValue(E2E_USERNAME);

  // Wait for and fill password input
  const passwordInput = page.locator('input[data-testid="auth-input-password"]');
  await passwordInput.waitFor({ state: 'visible' });

  // Focus the input and triple-click to select all content (works across platforms)
  await passwordInput.click({ clickCount: 3 });

  // Type the password (this will replace any selected text)
  await passwordInput.pressSequentially(E2E_PASSWORD, { delay: 30 });

  // Verify the value
  await expect(passwordInput).toHaveValue(E2E_PASSWORD);

  // Wait for submit button to be enabled (form becomes dirty)
  const submitButton = page.locator('button[data-testid="auth-submit-button"]');
  await submitButton.waitFor({ state: 'visible' });
  await expect(submitButton).toBeEnabled({ timeout: 5000 });
  await submitButton.click();

  // Wait for successful navigation to recipes page
  await page.waitForURL(`${baseURL}/recipes`, { timeout: 10000 });

  // Verify we're logged in by checking for the "Nowy przepis" button
  await expect(page.getByRole('button', { name: /Nowy przepis/i })).toBeVisible({
    timeout: 10000,
  });

  // Store authentication state
  await page.context().storageState({ path: authFile });
});
