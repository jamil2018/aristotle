import type { Page } from "@playwright/test";

export async function openControlledHtml(
  page: Page,
  body: string,
): Promise<void> {
  await page.route("**/*", async (route) => {
    await route.fulfill({ contentType: "text/html", body });
  });
  await page.goto("/");
}
