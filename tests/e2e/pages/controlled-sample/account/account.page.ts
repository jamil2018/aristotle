import { expect, type Page } from "@playwright/test";

import { openControlledHtml } from "../../../support/assertions/controlled-route.js";

export class ControlledAccountPage {
  public constructor(private readonly page: Page) {}

  public async open(): Promise<void> {
    await openControlledHtml(
      this.page,
      `<main><h1>Controlled account sample</h1><label for="username">Username</label><input id="username" /><button type="button">Create account</button><p role="status"></p></main><script>document.querySelector("button").addEventListener("click",()=>{document.querySelector('[role="status"]').textContent="Account created"})</script>`,
    );
  }

  public async createAccount(username: string): Promise<void> {
    await this.page.getByLabel("Username").fill(username);
    await this.page.getByRole("button", { name: "Create account" }).click();
  }

  public async expectCreated(): Promise<void> {
    await expect(this.page.getByRole("status")).toHaveText("Account created");
  }
}
