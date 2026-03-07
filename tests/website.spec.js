// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Was It For This — website tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // ── Page structure ──────────────────────────────────────────────────────────

  test("page has correct title", async ({ page }) => {
    await expect(page).toHaveTitle("Was It For This?");
  });

  test("masthead heading is visible", async ({ page }) => {
    await expect(page.locator("header h1")).toHaveText("Was It For This?");
  });

  test("tagline is visible", async ({ page }) => {
    const tagline = page.locator("header .tagline");
    await expect(tagline).toBeVisible();
    await expect(tagline).toContainText("W.B. Yeats");
  });

  test("input field is present and focusable", async ({ page }) => {
    const input = page.locator("#subject");
    await expect(input).toBeVisible();
    await expect(input).toBeEditable();
  });

  test("ask button is visible and labelled", async ({ page }) => {
    const btn = page.locator("#ask-btn");
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText("Was it for this?");
  });

  test("verdict panel is hidden on page load", async ({ page }) => {
    const verdict = page.locator("#verdict");
    await expect(verdict).toBeHidden();
  });

  // ── Interaction ─────────────────────────────────────────────────────────────

  test("clicking the button shows a verdict", async ({ page }) => {
    await page.locator("#subject").fill("avocado toast");
    await page.locator("#ask-btn").click();
    const verdict = page.locator("#verdict");
    await expect(verdict).toBeVisible();
    await expect(page.locator("#verdict-headline")).not.toBeEmpty();
  });

  test("pressing Enter in the input shows a verdict", async ({ page }) => {
    await page.locator("#subject").fill("a ghost estate");
    await page.locator("#subject").press("Enter");
    const verdict = page.locator("#verdict");
    await expect(verdict).toBeVisible();
  });

  test("verdict headline contains yes or no text", async ({ page }) => {
    await page.locator("#subject").fill("bankers bonuses");
    await page.locator("#ask-btn").click();
    const headline = page.locator("#verdict-headline");
    await expect(headline).toBeVisible();
    const text = await headline.textContent();
    expect(text).toMatch(/^(Yes — it was for this\.|No — it was not for this\.)$/);
  });

  test("editorial body contains paragraphs after asking", async ({ page }) => {
    await page.locator("#subject").fill("the Taoiseach's golf trip");
    await page.locator("#ask-btn").click();
    const body = page.locator("#editorial-body p");
    await expect(body.first()).toBeVisible();
    await expect(body).toHaveCount(4);
  });

  test("verdict date is populated", async ({ page }) => {
    await page.locator("#subject").fill("NAMA");
    await page.locator("#ask-btn").click();
    const dateEl = page.locator("#verdict-date");
    await expect(dateEl).not.toBeEmpty();
  });

  test("Yeats poetry block is displayed in the verdict", async ({ page }) => {
    await page.locator("#subject").fill("the leaving cert");
    await page.locator("#ask-btn").click();
    const yeats = page.locator(".yeats-block");
    await expect(yeats).toBeVisible();
    const cite = page.locator(".yeats-block cite");
    await expect(cite).toContainText("W.B. Yeats");
  });

  // ── ALWAYS_YES logic ────────────────────────────────────────────────────────

  test("'pint' always gets a YES verdict", async ({ page }) => {
    await page.locator("#subject").fill("pint");
    await page.locator("#ask-btn").click();
    await expect(page.locator("#verdict-headline")).toHaveText(
      "Yes — it was for this."
    );
  });

  test("'Guinness' always gets a YES verdict (case-insensitive)", async ({
    page,
  }) => {
    await page.locator("#subject").fill("Guinness");
    await page.locator("#ask-btn").click();
    await expect(page.locator("#verdict-headline")).toHaveText(
      "Yes — it was for this."
    );
  });

  test("'hurling' always gets a YES verdict", async ({ page }) => {
    await page.locator("#subject").fill("hurling");
    await page.locator("#ask-btn").click();
    await expect(page.locator("#verdict-headline")).toHaveText(
      "Yes — it was for this."
    );
  });

  test("'the craic' always gets a YES verdict", async ({ page }) => {
    await page.locator("#subject").fill("the craic");
    await page.locator("#ask-btn").click();
    await expect(page.locator("#verdict-headline")).toHaveText(
      "Yes — it was for this."
    );
  });

  // ── Empty input ─────────────────────────────────────────────────────────────

  test("empty input falls back to 'nothing in particular'", async ({
    page,
  }) => {
    await page.locator("#ask-btn").click();
    const body = page.locator("#editorial-body");
    await expect(body).toContainText("nothing in particular");
  });

  // ── Security: HTML escaping ─────────────────────────────────────────────────

  test("user input is HTML-escaped in the verdict", async ({ page }) => {
    const xssPayload = "<script>window.__xss=1</script>";
    await page.locator("#subject").fill(xssPayload);
    await page.locator("#ask-btn").click();

    // The script tag must not have been executed
    const xssRan = await page.evaluate(() => window.__xss);
    expect(xssRan).toBeUndefined();

    // The raw tag should appear as visible escaped text, not executed markup
    const bodyText = await page.locator("#editorial-body").textContent();
    expect(bodyText).toContain("<script>");
  });

  // ── Re-asking updates the verdict ───────────────────────────────────────────

  test("asking again updates the editorial body", async ({ page }) => {
    await page.locator("#subject").fill("soda bread");
    await page.locator("#ask-btn").click();
    const first = await page.locator("#editorial-body").innerHTML();

    await page.locator("#subject").fill("tayto");
    await page.locator("#ask-btn").click();
    const second = await page.locator("#editorial-body").innerHTML();

    // Content should reference the new subject
    expect(second).toContain("tayto");
  });
});
