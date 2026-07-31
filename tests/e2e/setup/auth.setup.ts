import { expect, test as setup } from "@playwright/test";

const authStatePath = "playwright/.auth/authorized-user.json";

setup(
  "create isolated sample authentication state",
  async ({ context, page }) => {
    await page.route("**/*", async (route) => {
      await route.fulfill({
        contentType: "text/html",
        body: `<main><h1>Controlled sign in</h1><button type="button" onclick="localStorage.setItem('sample-session', 'authorized')">Sign in</button></main>`,
      });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("sample-session")))
      .toBe("authorized");
    await context.storageState({ path: authStatePath });
  },
);
