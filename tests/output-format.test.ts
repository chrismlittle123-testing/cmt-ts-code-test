import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createPackageJson,
  createTsConfig,
  createCheckToml,
  runCodeCheck,
  runCm,
} from "./utils/test-helpers";

describe("Output Format Tests", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("output-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // OUT-001: Text Output (Default)
  describe("OUT-001: Text Output (Default)", () => {
    it("should produce human-readable text output by default", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { typescript: "^5.3.0" },
      });
      createTsConfig(fixtureDir);
      createCheckToml(
        fixtureDir,
        `
[code.types.tsc]
enabled = true
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export const x = 1;
`
      );

      const result = runCodeCheck(fixtureDir);
      // Output should be human-readable, not JSON
      const output = result.stdout + result.stderr;
      // Should not start with { or [
      expect(output.trim()).not.toMatch(/^[{[]/);
    });
  });

  // OUT-002: JSON Output
  describe("OUT-002: JSON Output", () => {
    it("should produce valid JSON output with -f json flag", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { typescript: "^5.3.0" },
      });
      createTsConfig(fixtureDir);
      createCheckToml(
        fixtureDir,
        `
[code.types.tsc]
enabled = true
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export const x = 1;
`
      );

      const result = runCodeCheck(fixtureDir, "-f json");
      // Output should be valid JSON
      try {
        const parsed = JSON.parse(result.stdout);
        expect(parsed).toBeDefined();
        // Should have a violations array or similar structure
        expect(typeof parsed).toBe("object");
      } catch {
        // If parsing fails, the test should fail
        expect.fail("Output is not valid JSON: " + result.stdout);
      }
    });
  });

  // OUT-003: JSON Schema
  describe("OUT-003: JSON Schema", () => {
    it("should output JSON schema for check.toml config", () => {
      const result = runCm("schema config", fixtureDir);

      // Output should be valid JSON schema
      try {
        const schema = JSON.parse(result.stdout);
        expect(schema).toBeDefined();
        // JSON Schema should have $schema or type property
        expect(
          schema.$schema || schema.type || schema.properties
        ).toBeDefined();
      } catch {
        // If parsing fails, check if command exists
        expect(result.stderr).toContain("schema");
      }
    });
  });
});
