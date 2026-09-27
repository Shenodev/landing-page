import { expect, test, type Page } from "@playwright/test";

/**
 * The admin gate must verify the password with the API before it treats the
 * dashboard as unlocked. Any other outcome (401, 403, 5xx, network failure,
 * CORS rejection) has to keep the user on the password screen.
 */

// The cookie banner mounts after hydration and can cover the submit button, so
// a click occasionally lands on the dialog instead. Seeding consent removes
// that race without weakening what these tests assert.
const seedCookieConsent = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "shenodev-cookie-consent",
      JSON.stringify({ value: "declined", at: Date.now() }),
    );
  });
};

test.describe("admin password gate", () => {
  test("a wrong password keeps the dashboard locked", async ({ page }) => {
    await seedCookieConsent(page);
    await page.goto("/admin/projects", { waitUntil: "domcontentloaded" });

    // Fail the verification call with a 401, the way the API answers a bad secret.
    await page.route("**/api/projects/admin", (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: '{"message":"Invalid or missing admin secret"}' }),
    );

    await page.getByLabel("Admin password").fill("totally-wrong-password");
    await page.getByRole("button", { name: /unlock dashboard/i }).click();

    await expect(page.getByText(/wrong password/i)).toBeVisible();
    // The dashboard tabs must not render for a rejected password.
    await expect(page.getByRole("tab", { name: /projects/i })).toHaveCount(0);
    await expect(page.getByText("Project dashboard")).toHaveCount(0);
  });

  test("a server error keeps the dashboard locked", async ({ page }) => {
    await seedCookieConsent(page);
    await page.goto("/admin/projects", { waitUntil: "domcontentloaded" });

    // A 5xx used to be indistinguishable from success: only 401 was treated as
    // a wrong password, so the dashboard rendered over the error.
    await page.route("**/api/projects/admin", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: '{"message":"Internal Server Error"}' }),
    );

    await page.getByLabel("Admin password").fill("any-password-at-all");
    await page.getByRole("button", { name: /unlock dashboard/i }).click();

    await expect(page.getByText(/could not verify the password/i)).toBeVisible();
    await expect(page.getByRole("tab", { name: /projects/i })).toHaveCount(0);
  });

  test("a blocked request keeps the dashboard locked", async ({ page }) => {
    await seedCookieConsent(page);
    await page.goto("/admin/projects", { waitUntil: "domcontentloaded" });

    // Simulates a CORS rejection: the network layer drops the response, so the
    // client never sees a status at all.
    await page.route("**/api/projects/admin", (route) => route.abort("failed"));

    await page.getByLabel("Admin password").fill("some-password");
    await page.getByRole("button", { name: /unlock dashboard/i }).click();

    await expect(page.getByText(/could not verify the password/i)).toBeVisible();
    await expect(page.getByRole("tab", { name: /projects/i })).toHaveCount(0);
  });

  test("a correct password unlocks the dashboard", async ({ page }) => {
    await seedCookieConsent(page);
    await page.goto("/admin/projects", { waitUntil: "domcontentloaded" });

    await page.route("**/api/projects/admin", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: '{"data":[]}' }),
    );

    await page.getByLabel("Admin password").fill("ShenoDev-Projects");
    await page.getByRole("button", { name: /unlock dashboard/i }).click();

    await expect(page.getByText("Project dashboard")).toBeVisible();
    await expect(page.getByRole("tab", { name: /projects/i })).toBeVisible();
  });
});
