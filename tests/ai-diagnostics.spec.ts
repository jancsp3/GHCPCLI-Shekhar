import { test, expect } from '../src/fixtures/ai-diagnostics';

test.describe('Saucedemo Tests with AI Diagnostics', () => {
  
  test('Test 1: Login with valid credentials', async ({ page, aiDiagnostics }) => {
    try {
      await page.goto('https://www.saucedemo.com/');
      await page.fill('[data-test="username"]', 'standard_user');
      await page.fill('[data-test="password"]', 'secret_sauce');
      await page.click('[data-test="login-button"]');
      
      await expect(page).toHaveURL(/.*inventory/);
    } catch (error) {
      await aiDiagnostics.analyzeError(error as Error);
      throw error;
    }
  });

  test('Test 2: Intentional failure to show diagnostics', async ({ page, aiDiagnostics }) => {
    try {
      await page.goto('https://www.saucedemo.com/');
      await page.fill('[data-test="username"]', 'invalid_user');
      await page.fill('[data-test="password"]', 'wrong_password');
      await page.click('[data-test="login-button"]');
      
      // This will fail - element doesn't exist with this selector
      const errorMsg = page.locator('[data-test="nonexistent-element"]');
      await expect(errorMsg).toContainText('This will fail', { timeout: 1000 });
    } catch (error) {
      await aiDiagnostics.analyzeError(error as Error);
      throw error;
    }
  });

});
