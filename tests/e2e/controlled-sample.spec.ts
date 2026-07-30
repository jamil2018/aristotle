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

test("[TS-SAMPLE-0000000002] exercises scalable low-risk Playwright primitives", async ({
  page,
}) => {
  await page.route("**/*", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: `
        <main>
          <h1>Controlled preferences sample</h1>
          <label><input type="checkbox" name="updates" /> Email updates</label>
          <label for="timezone">Timezone</label>
          <select id="timezone">
            <option value="UTC">UTC</option>
            <option value="Asia/Dhaka">Asia/Dhaka</option>
          </select>
          <label for="search">Search</label>
          <input id="search" />
          <button type="button">Save</button>
          <ul aria-label="Results">
            <li>First result</li>
            <li>Second result</li>
            <li>Third result</li>
          </ul>
        </main>
      `,
    });
  });

  await page.goto("/");
  await page.getByLabel("Email updates").check();
  await page.getByLabel("Timezone").selectOption("Asia/Dhaka");
  await page.getByLabel("Search").press("Enter");

  await expect(page.getByLabel("Email updates")).toBeChecked();
  await expect(page.getByLabel("Timezone")).toHaveValue("Asia/Dhaka");
  await expect(page.getByRole("button", { name: "Save" })).toBeEnabled();
  await expect(page.getByRole("listitem")).toHaveCount(3);

  await page.getByLabel("Email updates").uncheck();
  await expect(page.getByLabel("Email updates")).not.toBeChecked();
});
