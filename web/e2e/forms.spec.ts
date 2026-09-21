import { expect, test } from "@playwright/test";

// Read-only: asserts client-side validation fires WITHOUT any network POST
// to the production API (no real records, no real emails).
test("contact form blocks submit until valid + consented, sends zero API requests", async ({ page }) => {
  let apiPosts = 0;
  await page.route("**/api/**", (route) => {
    if (route.request().method() === "POST") apiPosts += 1;
    void route.abort();
  });

  await page.goto("/", { waitUntil: "networkidle" });
  const section = page.locator("#contact");
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByLabel("Full Name")).toBeVisible();

  // Empty submit → field errors, no POST
  await section.getByRole("button", { name: /send message/i }).click();
  await expect(section.getByRole("alert").first()).toBeVisible();
  expect(apiPosts).toBe(0);

  // Filled but consent boxes unchecked → still blocked, still no POST
  await section.getByLabel("Full Name").fill("Alex Vance");
  await section.getByLabel("Work Email").fill("alex@enterprise.com");
  await section.getByLabel("Project Details").fill("Need a scalable platform for our startup.");
  await section.getByRole("button", { name: /send message/i }).click();
  await expect(section.locator("#contact-consent-error")).toBeVisible();
  expect(apiPosts).toBe(0);
});

test("discovery questionnaire renders steps and consent section", async ({ page }) => {
  await page.goto("/discovery", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Full Name")).toBeVisible();
  await expect(page.getByText("Consent & Age Confirmation")).toBeVisible();

  // Unchecked consent → validation error on continue, no POST
  let apiPosts = 0;
  await page.route("**/api/**", (route) => {
    if (route.request().method() === "POST") apiPosts += 1;
    void route.abort();
  });
  await page.getByRole("button", { name: /continue to scheduling/i }).click();
  await expect(page.getByText("Please accept the privacy notice")).toBeVisible();
  expect(apiPosts).toBe(0);
});
