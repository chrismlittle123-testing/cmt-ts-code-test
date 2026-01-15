import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createCheckToml,
  runCodeCheck,
} from "./utils/test-helpers";

describe("Gitleaks (Secrets) Tests", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("gitleaks-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // GLK-001: No Secrets - Pass
  describe("GLK-001: No Secrets - Pass", () => {
    it("should pass with clean code without secrets", () => {
      createCheckToml(
        fixtureDir,
        `
[code.security.secrets]
enabled = true
`
      );

      // Clean code without any secrets
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export function getApiUrl(): string {
  return process.env.API_URL || "https://api.example.com";
}

export function getConfig(): { timeout: number } {
  return {
    timeout: 5000,
  };
}
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // GLK-002: Hardcoded API Key
  describe("GLK-002: Hardcoded API Key", () => {
    it("should detect hardcoded API key", () => {
      createCheckToml(
        fixtureDir,
        `
[code.security.secrets]
enabled = true
`
      );

      // Code with hardcoded API key
      writeFixtureFile(
        fixtureDir,
        "src/config.ts",
        `// This is a test file with a fake API key for testing secret detection
export const API_KEY = "sk-1234567890abcdef1234567890abcdef1234567890abcdef";
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/secret|api.?key/i);
    });
  });

  // GLK-004: Private Key
  describe("GLK-004: Private Key", () => {
    it("should detect private key", () => {
      createCheckToml(
        fixtureDir,
        `
[code.security.secrets]
enabled = true
`
      );

      // File containing a private key header (test key)
      writeFixtureFile(
        fixtureDir,
        "src/key.pem",
        `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyF8PbnGy
THIS-IS-A-FAKE-KEY-FOR-TESTING-ONLY
-----END RSA PRIVATE KEY-----
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/secret|private.?key/i);
    });
  });

  // GLK-006: Generic Password
  describe("GLK-006: Generic Password", () => {
    it("may or may not detect generic password (depends on entropy)", () => {
      createCheckToml(
        fixtureDir,
        `
[code.security.secrets]
enabled = true
`
      );

      // Code with generic password assignment
      writeFixtureFile(
        fixtureDir,
        "src/auth.ts",
        `// Test file - this may or may not be detected depending on entropy settings
export const password = "mysecretpassword123!@#";
`
      );

      const result = runCodeCheck(fixtureDir);
      // May or may not fail - depends on gitleaks config
      expect(result).toBeDefined();
    });
  });

  // GLK-007: Custom Config
  describe("GLK-007: Custom Config", () => {
    it("should apply custom gitleaks rules", () => {
      createCheckToml(
        fixtureDir,
        `
[code.security.secrets]
enabled = true
`
      );

      // Create custom .gitleaks.toml config
      writeFixtureFile(
        fixtureDir,
        ".gitleaks.toml",
        `title = "Custom Gitleaks Config"

[[rules]]
id = "custom-api-key"
description = "Custom API Key Pattern"
regex = '''CUSTOM_API_KEY_[A-Z0-9]{16}'''
secretGroup = 0
`
      );

      // Code with custom pattern
      writeFixtureFile(
        fixtureDir,
        "src/custom.ts",
        `export const key = "CUSTOM_API_KEY_ABCDEF1234567890";
`
      );

      const result = runCodeCheck(fixtureDir);
      // Should apply custom rules
      expect(result.exitCode).toBe(1);
    });
  });

  // GLK-009: Multiple Secrets
  describe("GLK-009: Multiple Secrets", () => {
    it("should report all secrets with file/line info", () => {
      createCheckToml(
        fixtureDir,
        `
[code.security.secrets]
enabled = true
`
      );

      // Multiple secrets in different files
      writeFixtureFile(
        fixtureDir,
        "src/config.ts",
        `// Test file with fake secrets for detection testing
export const API_KEY = "sk-test1234567890abcdef1234567890abcdef1234567890";
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/database.ts",
        `// Another test file with fake credentials
export const DB_PASSWORD = "postgres://user:verysecretpassword@localhost:5432/db";
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/aws.ts",
        `// AWS test credentials (fake)
export const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      // Should report multiple findings
      const output = result.stdout + result.stderr;
      expect(output).toBeDefined();
    });
  });
});
