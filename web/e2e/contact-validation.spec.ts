import { expect, test } from "@playwright/test";

/**
 * The homepage contact form validates in the browser before it posts.
 *
 * These tests pin the exact user-facing messages. The validator is being
 * changed from a zod schema to a dependency-free equivalent so that zod (a
 * 384 KB chunk) stops shipping to every homepage visitor; the server remains
 * the authoritative check via backend/src/schemas/contact.ts. Any change in
 * these strings is a deliberate copy change, not a refactor accident.
 *
 * Read-only: every case blocks before the network, so nothing is submitted.
 */

const openContact = async (page: import("@playwright/test").Page): Promise<import("@playwright/test").Locator> => {
  await page.goto("/", { waitUntil: "networkidle" });
  const section = page.locator("#contact");
  await section.scrollIntoViewIfNeeded();
  return section;
};

const fillContact = async (
  section: import("@playwright/test").Locator,
  values: { name?: string; email?: string; details?: string }
): Promise<void> => {
  if (values.name !== undefined) await section.getByLabel("Full Name").fill(values.name);
  if (values.email !== undefined) await section.getByLabel("Work Email").fill(values.email);
  if (values.details !== undefined) await section.getByLabel("Project Details").fill(values.details);
};

const consent = async (section: import("@playwright/test").Locator): Promise<void> => {
  await section.getByRole("checkbox").nth(0).check();
  await section.getByRole("checkbox").nth(1).check();
};

test.beforeEach(async ({ page }) => {
  // Any POST that escapes the client would hit the real API. Abort and count.
  await page.route("**/api/**", (route) => void route.abort());
});

test("a one character name is rejected with the minimum length message", async ({ page }) => {
  const section = await openContact(page);
  await fillContact(section, { name: "A", email: "alex@enterprise.com", details: "Need a scalable platform." });
  await consent(section);

  await section.getByRole("button", { name: /send message/i }).click();

  await expect(section.getByText("Name must be at least 2 characters").first()).toBeVisible();
});

test("a malformed email is rejected with the invalid email message", async ({ page }) => {
  const section = await openContact(page);
  await fillContact(section, { name: "Alex Vance", email: "not-an-email", details: "Need a scalable platform." });
  await consent(section);

  await section.getByRole("button", { name: /send message/i }).click();

  await expect(section.getByText("Invalid email address").first()).toBeVisible();
});

test("short project details are rejected with the minimum length message", async ({ page }) => {
  const section = await openContact(page);
  await fillContact(section, { name: "Alex Vance", email: "alex@enterprise.com", details: "too short" });
  await consent(section);

  await section.getByRole("button", { name: /send message/i }).click();

  await expect(section.getByText("Details must be at least 10 characters").first()).toBeVisible();
});

test("a name with digits is rejected with the invalid characters message", async ({ page }) => {
  const section = await openContact(page);
  await fillContact(section, { name: "Alex 123", email: "alex@enterprise.com", details: "Need a scalable platform." });
  await consent(section);

  await section.getByRole("button", { name: /send message/i }).click();

  await expect(section.getByText("Name contains invalid characters").first()).toBeVisible();
});

test("length is measured after trimming, so padded values are accepted", async ({ page }) => {
  // zod trims before measuring. A validator that measured the raw string would
  // wrongly reject a name the user typed with a trailing space.
  const section = await openContact(page);
  await fillContact(section, {
    name: "  Alex Vance  ",
    email: "alex@enterprise.com",
    details: "Need a scalable platform for our startup.",
  });
  await consent(section);

  let posted: string | null = null;
  await page.route("**/api/contact", async (route) => {
    posted = route.request().postData();
    await route.abort();
  });

  await section.getByRole("button", { name: /send message/i }).click();

  // Passing validation means a POST is attempted, and the trimmed name is sent.
  await expect.poll(() => posted, { timeout: 5000 }).not.toBeNull();
  expect(posted).toContain('"name":"Alex Vance"');
});

test("over long input is capped by the field, so an over length value cannot be sent", async ({ page }) => {
  // The schema's max-length rules are unreachable through the UI: the inputs
  // carry maxLength, so the browser refuses the extra characters first. That is
  // the real protection, so assert it rather than the unreachable error.
  const section = await openContact(page);

  const name = section.getByLabel("Full Name");
  await expect(name).toHaveAttribute("maxlength", "100");
  await expect(section.getByLabel("Work Email")).toHaveAttribute("maxlength", "200");
  await expect(section.getByLabel("Project Details")).toHaveAttribute("maxlength", "1000");

  await name.fill("A".repeat(150));
  expect((await name.inputValue()).length).toBe(100);
});

test("an empty required field is reported before the form is sent", async ({ page }) => {
  const section = await openContact(page);
  await consent(section);

  await section.getByRole("button", { name: /send message/i }).click();

  await expect(section.getByRole("alert").first()).toBeVisible();
  await expect(section.getByText("Name must be at least 2 characters").first()).toBeVisible();
});
