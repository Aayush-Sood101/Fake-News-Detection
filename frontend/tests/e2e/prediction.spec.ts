import { test, expect } from "@playwright/test";

test.describe("Prediction Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$/);
  });

  test("should submit article and show result", async ({ page }) => {
    await page.goto("/predict");
    await page.fill('input[id="title"]', "Test Article Headline for E2E Testing");
    await page.fill('textarea[id="body"]', "This is the body of the test article.");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Analysis Result")).toBeVisible();
  });

  test("should upload image and analyze", async ({ page }) => {
    await page.goto("/predict");
    await page.fill('input[id="title"]', "Test with Image");
    await page.setInputFiles('input[type="file"]', "tests/fixtures/test_image.jpg");
    await expect(page.locator('img[alt="Preview"]')).toBeVisible();
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Analysis Result")).toBeVisible();
  });

  test("should show prediction in history", async ({ page }) => {
    await page.goto("/predict");
    await page.fill('input[id="title"]', "History Test Article");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Analysis Result")).toBeVisible();
    await page.goto("/history");
    await expect(page.locator("text=History Test Article")).toBeVisible();
  });
});
