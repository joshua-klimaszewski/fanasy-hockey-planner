import { test, expect } from '@playwright/test';

test.describe('Fantasy Hockey Planner', () => {
  test('should display the main page', async ({ page }) => {
    await page.goto('/');

    // Check header is visible
    await expect(page.locator('text=Fantasy Hockey Planner')).toBeVisible();

    // Check week selector is visible
    await expect(page.locator('text=Week')).toBeVisible();

    // Check roster grid sections
    await expect(page.locator('text=Starting Lineup')).toBeVisible();
    await expect(page.locator('text=Bench')).toBeVisible();
  });

  test('should navigate between weeks', async ({ page }) => {
    await page.goto('/');

    // Get initial week text
    const weekSelector = page.locator('h2:has-text("Week")');
    const initialText = await weekSelector.textContent();

    // Click next week button
    await page.locator('button[aria-label="Next week"]').click();

    // Week should change
    await expect(weekSelector).not.toHaveText(initialText!);

    // Click previous week button
    await page.locator('button[aria-label="Previous week"]').click();

    // Should be back to initial week
    await expect(weekSelector).toHaveText(initialText!);
  });
});
