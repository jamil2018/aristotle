import { describe, expect, it } from "vitest";

import { loadFactoryConfig } from "../../../src/config/factory-config.js";

describe("loadFactoryConfig", () => {
  it("uses safe local defaults", () => {
    const config = loadFactoryConfig({});

    expect(config.environment).toBe("LOCAL");
    expect(config.baseUrl.toString()).toBe("http://127.0.0.1:3000/");
    expect(config.allowProductionWrites).toBe(false);
    expect(config.allowedOrigins).toEqual(["http://127.0.0.1:3000"]);
    expect(config.evidence).toEqual({
      screenshot: "off",
      trace: "off",
      video: "off",
    });
  });

  it("rejects a target outside the configured origin allowlist", () => {
    expect(() =>
      loadFactoryConfig({
        FACTORY_BASE_URL: "https://test.example.com",
        FACTORY_ALLOWED_ORIGINS: "https://staging.example.com",
      }),
    ).toThrow(/not present in FACTORY_ALLOWED_ORIGINS/);
  });

  it("rejects globally enabled production writes", () => {
    expect(() =>
      loadFactoryConfig({
        FACTORY_BASE_URL: "https://example.com",
        FACTORY_ALLOWED_ORIGINS: "https://example.com",
        FACTORY_ENVIRONMENT: "PRODUCTION",
        FACTORY_ALLOW_PRODUCTION_WRITES: "true",
      }),
    ).toThrow(/cannot be enabled globally/);
  });
});
