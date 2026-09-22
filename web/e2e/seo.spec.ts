import { expect, test } from "@playwright/test";

// SEO fundamentals per public route. Requires the deploy that includes
// canonicals, JSON-LD, breadcrumbs, and llms.txt.
const SEO_ROUTES = [
  { path: "/", canonical: "https://shenodev.tech", jsonld: 2 },
  { path: "/work", canonical: "https://shenodev.tech/work", jsonld: 3 },
  { path: "/discovery", canonical: "https://shenodev.tech/discovery", jsonld: 3 },
  { path: "/privacy", canonical: "https://shenodev.tech/privacy", jsonld: 3 },
  { path: "/terms", canonical: "https://shenodev.tech/terms", jsonld: 3 },
  { path: "/refunds", canonical: "https://shenodev.tech/refunds", jsonld: 3 },
  { path: "/cookies", canonical: "https://shenodev.tech/cookies", jsonld: 3 },
] as const;

for (const { path, canonical, jsonld } of SEO_ROUTES) {
  test(`${path} has one h1, canonical, and structured data`, async ({ page }) => {
    const res = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(res?.ok()).toBe(true);
    await expect(page.locator("h1")).toHaveCount(1);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe(canonical);
    expect(await page.locator('script[type="application/ld+json"]').count()).toBe(jsonld);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description?.trim().length).toBeGreaterThan(30);
  });
}

test("breadcrumb trails render with BreadcrumbList schema", async ({ page }) => {
  await page.goto("/privacy", { waitUntil: "domcontentloaded" });
  const nav = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(nav).toBeVisible();
  await expect(nav.getByText("Privacy Policy").last()).toBeVisible();
});

test("llms.txt is served for AI assistants", async ({ page }) => {
  const res = await page.goto("/llms.txt");
  expect(res?.ok()).toBe(true);
  const body = (await res?.text()) ?? "";
  expect(body).toContain("ShenoDev");
  expect(body).toContain("https://shenodev.tech/discovery");
});
