import { test, expect } from 'playwright/test';

test('app loads successfully', async ({ page }) => {
  // Go to your app
  await page.goto('http://localhost:3000');
  
  // Check if ANYTHING appears on the page
  // Replace 'react' with any text you know is on your homepage
  await expect(page.locator('body')).toBeVisible();
  
  console.log('✅ App loaded!');
});