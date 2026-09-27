import { expect, test, type Page } from "@playwright/test";

/**
 * No mocking here: these hit the real backend through the browser, so the CORS
 * policy, the admin secret check, and the cached GET are exercised together.
 *
 * Requires a reachable API. Set E2E_API_URL and E2E_ADMIN_SECRET to run.
 */
const API_URL = process.env.E2E_API_URL;
const ADMIN_SECRET = process.env.E2E_ADMIN_SECRET;

// The cookie banner mounts after hydration and can cover the submit button, so
// a click occasionally lands on the dialog instead. Seeding consent removes it.
const seedCookieConsent = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "shenodev-cookie-consent",
      JSON.stringify({ value: "declined", at: Date.now() }),
    );
  });
};

test.describe("admin gate against the live API", () => {
  test.skip(!API_URL || !ADMIN_SECRET, "E2E_API_URL / E2E_ADMIN_SECRET not set");

  test("a wrong password is rejected by the API and keeps the gate closed", async ({ page }) => {
    await seedCookieConsent(page);
    await page.goto("/admin/projects", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Admin password").fill("definitely-not-the-secret");
    await page.getByRole("button", { name: /unlock dashboard/i }).click();

    await expect(page.getByText(/wrong password|could not verify/i)).toBeVisible();
    await expect(page.getByRole("tab", { name: /projects/i })).toHaveCount(0);
  });

  test("the public feed is not a password oracle", async ({ request }) => {
    // The public feed must answer 200 for every visitor regardless of the
    // secret. If the dashboard ever verifies against this route again, any
    // password would unlock the dashboard.
    const withBadSecret = await request.get(`${API_URL}/api/projects`, {
      headers: { "x-admin-secret": "definitely-not-the-secret" },
    });
    const withNoSecret = await request.get(`${API_URL}/api/projects`);
    expect(withBadSecret.status()).toBe(200);
    expect(withNoSecret.status()).toBe(200);
  });

  test("the admin feed rejects a wrong secret", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/projects/admin`, {
      headers: { "x-admin-secret": "definitely-not-the-secret" },
    });
    expect(res.status()).toBe(401);
  });

  test("the admin feed accepts the real secret", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/projects/admin`, {
      headers: { "x-admin-secret": ADMIN_SECRET ?? "" },
    });
    expect(res.status()).toBe(200);
    // A credential-dependent response must never sit in a shared cache.
    expect(res.headers()["cache-control"] ?? "").not.toContain("public");
  });

  test("the real secret unlocks the dashboard", async ({ page }) => {
    await seedCookieConsent(page);
    await page.goto("/admin/projects", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Admin password").fill(ADMIN_SECRET ?? "");
    await page.getByRole("button", { name: /unlock dashboard/i }).click();

    await expect(page.getByText("Project dashboard")).toBeVisible();
  });

  test("the public projects feed is cacheable by browsers and CDNs", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/projects`);
    expect(res.status()).toBe(200);
    // `public` plus a browser max-age is the contract. Do NOT assert s-maxage
    // here: Vercel's edge strips it and manages the shared-cache TTL itself,
    // so a deployed response legitimately reads `public, max-age=30` while the
    // origin locally still sends the full s-maxage / stale-while-revalidate.
    expect(res.headers()["cache-control"]).toContain("public");
    expect(res.headers()["cache-control"]).toMatch(/max-age=\d+/);
  });
});
