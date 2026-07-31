import { expect, type Page } from "@playwright/test";

import { openControlledHtml } from "../../../support/assertions/controlled-route.js";

export class ControlledPreferencesPage {
  public constructor(private readonly page: Page) {}

  public async open(): Promise<void> {
    await openControlledHtml(
      this.page,
      `<main><h1>Controlled preferences sample</h1><label><input type="checkbox" name="updates" /> Email updates</label><label for="timezone">Timezone</label><select id="timezone"><option value="UTC">UTC</option><option value="Asia/Dhaka">Asia/Dhaka</option></select><label for="search">Search</label><input id="search" /><button type="button">Save</button><ul aria-label="Results"><li>First result</li><li>Second result</li><li>Third result</li></ul></main>`,
    );
  }

  public async selectPreferences(): Promise<void> {
    await this.page.getByLabel("Email updates").check();
    await this.page.getByLabel("Timezone").selectOption("Asia/Dhaka");
    await this.page.getByLabel("Search").press("Enter");
  }

  public async preferencesAreSelected(): Promise<boolean> {
    await expect(this.page.getByLabel("Email updates")).toBeChecked();
    await expect(this.page.getByLabel("Timezone")).toHaveValue("Asia/Dhaka");
    await expect(this.page.getByRole("button", { name: "Save" })).toBeEnabled();
    await expect(this.page.getByRole("listitem")).toHaveCount(3);
    await this.page.getByLabel("Email updates").uncheck();
    await expect(this.page.getByLabel("Email updates")).not.toBeChecked();
    return true;
  }
}
