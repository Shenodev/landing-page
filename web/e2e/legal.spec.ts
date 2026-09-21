import { expect, test } from "@playwright/test";

const LEGAL_PAGES = [
  { path: "/privacy", heading: "Privacy Policy" },
  { path: "/terms", heading: "Terms of Service" },
  { path: "/refunds", heading: "Refund Policy" },
  { path: "/cookies", heading: "Cookie Policy" },
] as const;

for (const { path, heading } of LEGAL_PAGES) {
  test(`${path} renders with heading`, async ({ page }) => {
    const res = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(res?.ok()).toBe(true);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  });
}

test("/privacy includes the data-deletion request form", async ({ page }) => {
  await page.goto("/privacy", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Request Data Deletion" })).toBeVisible();
  await expect(page.getByLabel("Full Name")).toBeVisible();
  await expect(page.getByLabel("Email used in your submission")).toBeVisible();
});

test("/unsubscribe renders without submitting anything", async ({ page }) => {
  const res = await page.goto("/unsubscribe", { waitUntil: "domcontentloaded" });
  expect(res?.ok()).toBe(true);
  await expect(page.getByRole("heading", { name: "Unsubscribe" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
});

test("robots.txt and sitemap.xml are served", async ({ page }) => {
  const robots = await page.goto("/robots.txt");
  expect(robots?.ok()).toBe(true);
  const sitemap = await page.goto("/sitemap.xml");
  expect(sitemap?.ok()).toBe(true);
  const body = (await sitemap?.text()) ?? "";
  expect(body).toContain("/terms");
});
