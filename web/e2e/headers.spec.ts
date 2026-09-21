import { expect, test } from "@playwright/test";

test("security headers are present on the homepage", async ({ page }) => {
  const res = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(res?.ok()).toBe(true);
  const headers = res?.headers() ?? {};

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["strict-transport-security"]).toContain("max-age=");
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
  // Framework version must not leak
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("hidden admin page is noindex and requires a password", async ({ page }) => {
  const res = await page.goto("/admin/projects", { waitUntil: "domcontentloaded" });
  expect(res?.ok()).toBe(true);
  const robots = await page.getAttribute('meta[name="robots"]', "content");
  expect(robots).toContain("noindex");
  await expect(page.getByLabel("Admin password")).toBeVisible();
});
