import { expect, test } from "./support/quality-test.js";

test("[TS-SAMPLE-0000000001] uses accessible locators and deterministic cleanup", async ({
  cleanup,
  page,
  testDataId,
}) => {
  const username = testDataId("user");
  const createdUsers = new Set<string>();
  cleanup.add("sample user", () => {
    createdUsers.delete(username);
  });

  await page.route("**/*", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: `
        <main>
          <h1>Controlled account sample</h1>
          <label for="username">Username</label>
          <input id="username" />
          <button type="button">Create account</button>
          <p role="status"></p>
        </main>
        <script>
          document.querySelector("button").addEventListener("click", () => {
            document.querySelector('[role="status"]').textContent =
              "Account created";
          });
        </script>
      `,
    });
  });

  await page.goto("/");
  await page.getByLabel("Username").fill(username);
  await page.getByRole("button", { name: "Create account" }).click();
  createdUsers.add(username);

  await expect(page.getByRole("status")).toHaveText("Account created");
  expect(createdUsers.has(username)).toBe(true);
});
