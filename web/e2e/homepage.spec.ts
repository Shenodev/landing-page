import { expect, test } from "@playwright/test";

test("homepage loads with hero, services, and footer", async ({ page }) => {
  const res = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(res?.ok()).toBe(true);

  await expect(page).toHaveTitle(/ShenoDev/);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

  // Primary nav + key sections render
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.locator("#services")).toBeVisible();
  await expect(page.locator("#contact")).toBeVisible();

  // Footer carries business + legal links
  const footer = page.locator("footer");
  await expect(footer.getByRole("link", { name: "Privacy Policy" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Terms of Service" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "hello@contact.shenodev.tech" })).toBeVisible();

  // Skip link exists for keyboard users
  await expect(page.getByRole("link", { name: /skip/i }).first()).toBeAttached();
});

test("cookie banner appears on first visit and dismisses", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const banner = page.getByRole("dialog", { name: "Cookie consent" });
  await expect(banner).toBeVisible({ timeout: 15000 });
  await expect(banner.getByRole("link", { name: "Cookie Policy" })).toBeVisible();

  await banner.getByRole("button", { name: "Decline" }).click();
  await expect(banner).toBeHidden();
});
