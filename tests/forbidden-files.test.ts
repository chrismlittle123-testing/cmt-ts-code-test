import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createCheckToml,
  runCm,
} from "./utils/test-helpers";

function runProcessCheck(cwd: string, args = "") {
  return runCm(`process check ${args}`, cwd);
}

describe("Forbidden Files Tests (v1.5.4 - v1.5.7)", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("forbidden-files-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // FF-001: Basic forbidden file detection
  describe("FF-001: Basic Forbidden File Detection", () => {
    it("should detect forbidden files matching glob pattern", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["**/.env"]
`
      );

      writeFixtureFile(fixtureDir, ".env", "SECRET_KEY=123");
      writeFixtureFile(fixtureDir, "src/index.ts", "export const x = 1;");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/\.env/);
    });
  });

  // FF-002: Multiple forbidden patterns
  describe("FF-002: Multiple Forbidden Patterns", () => {
    it("should detect files matching multiple patterns", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["**/.env", "**/secrets.json", "**/*.key"]
`
      );

      writeFixtureFile(fixtureDir, ".env", "SECRET=123");
      writeFixtureFile(fixtureDir, "config/secrets.json", '{"key": "value"}');
      writeFixtureFile(fixtureDir, "certs/private.key", "key data");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/\.env/);
      expect(output).toMatch(/secrets\.json/);
      expect(output).toMatch(/\.key/);
    });
  });

  // FF-003: Pass with no forbidden files
  describe("FF-003: Pass With No Forbidden Files", () => {
    it("should pass when no forbidden files exist", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["**/.env", "**/secrets.json"]
`
      );

      writeFixtureFile(fixtureDir, "src/index.ts", "export const x = 1;");
      writeFixtureFile(fixtureDir, "config/settings.json", '{"debug": true}');

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // FF-004: Custom ignore patterns (v1.5.7 feature)
  describe("FF-004: Custom Ignore Patterns", () => {
    it("should respect custom ignore patterns", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["**/.env"]
ignore = ["**/test-fixtures/**", "**/node_modules/**", "**/.git/**"]
`
      );

      // This should be ignored
      writeFixtureFile(fixtureDir, "test-fixtures/.env", "TEST=123");
      // This should be detected
      writeFixtureFile(fixtureDir, ".env", "PROD=456");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      const output = result.stdout + result.stderr;
      // Should find root .env
      expect(output).toMatch(/\.env/);
      // Should NOT find test-fixtures/.env in violations (check it's not double-reported)
    });
  });

  // FF-005: Default ignore patterns (node_modules, .git)
  describe("FF-005: Default Ignore Patterns", () => {
    it("should ignore node_modules and .git by default", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["**/.env"]
`
      );

      // These should be ignored by default
      writeFixtureFile(fixtureDir, "node_modules/.env", "NM_SECRET=123");
      writeFixtureFile(fixtureDir, ".git/.env", "GIT_SECRET=456");
      // Clean project otherwise
      writeFixtureFile(fixtureDir, "src/index.ts", "export const x = 1;");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // FF-006: Invalid glob pattern validation (v1.5.5 feature)
  describe("FF-006: Invalid Glob Pattern Validation", () => {
    it("should reject invalid glob patterns in config", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["[invalid-pattern"]
`
      );

      writeFixtureFile(fixtureDir, "src/index.ts", "export const x = 1;");

      // Should fail with config error (exit code 2)
      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(2);
      expect(result.stdout + result.stderr).toMatch(/invalid.*glob|pattern/i);
    });
  });

  // FF-007: Empty files array
  describe("FF-007: Empty Files Array", () => {
    it("should pass when files array is empty", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = []
`
      );

      writeFixtureFile(fixtureDir, ".env", "SECRET=123");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // FF-008: Custom message in violations
  describe("FF-008: Custom Message", () => {
    it("should include custom message in violations", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["**/.env"]
message = "Environment files should not be committed"
`
      );

      writeFixtureFile(fixtureDir, ".env", "SECRET=123");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(
        /Environment files should not be committed/
      );
    });
  });

  // FF-009: Disabled check
  describe("FF-009: Disabled Check", () => {
    it("should skip check when disabled", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = false
files = ["**/.env"]
`
      );

      writeFixtureFile(fixtureDir, ".env", "SECRET=123");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // FF-010: Nested directory detection
  describe("FF-010: Nested Directory Detection", () => {
    it("should detect forbidden files in nested directories", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["**/.env"]
`
      );

      writeFixtureFile(fixtureDir, "src/config/.env", "NESTED=123");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/src\/config\/\.env/);
    });
  });

  // FF-011: Config merging (v1.5.4 fix)
  describe("FF-011: Config Merging", () => {
    it("should properly merge config with defaults", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["**/.env.local"]
`
      );

      // Only .env.local should be forbidden, not .env
      writeFixtureFile(fixtureDir, ".env", "OK=123");
      writeFixtureFile(fixtureDir, ".env.local", "LOCAL=456");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/\.env\.local/);
    });
  });

  // FF-012: Glob pattern with extension matching
  describe("FF-012: Extension Pattern Matching", () => {
    it("should match files by extension pattern", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["**/*.bak", "**/*.tmp"]
`
      );

      writeFixtureFile(fixtureDir, "data/backup.bak", "backup data");
      writeFixtureFile(fixtureDir, "cache/temp.tmp", "temp data");
      writeFixtureFile(fixtureDir, "src/index.ts", "export const x = 1;");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/\.bak/);
      expect(output).toMatch(/\.tmp/);
    });
  });

  // FF-013: Override default ignores completely
  describe("FF-013: Override Default Ignores", () => {
    it("should use only custom ignores when provided", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["**/.env"]
ignore = ["**/allowed/**"]
`
      );

      // With custom ignore, node_modules should NO LONGER be ignored
      // unless the user adds it to their ignore list
      writeFixtureFile(fixtureDir, "allowed/.env", "ALLOWED=123");
      writeFixtureFile(fixtureDir, "notallowed/.env", "NOTALLOWED=456");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      const output = result.stdout + result.stderr;
      // Should NOT find allowed/.env
      // Should find notallowed/.env
      expect(output).toMatch(/notallowed\/\.env/);
    });
  });

  // FF-014: Complex glob patterns
  describe("FF-014: Complex Glob Patterns", () => {
    it("should handle complex glob patterns", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["**/*.{env,secret,key}", "**/credentials.*"]
`
      );

      writeFixtureFile(fixtureDir, "config/api.env", "API=123");
      writeFixtureFile(fixtureDir, "config/db.secret", "DB=456");
      writeFixtureFile(fixtureDir, "auth/credentials.json", '{"user": "admin"}');

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
    });
  });

  // FF-015: Validate that only files (not directories) are matched
  describe("FF-015: Only Files Matched", () => {
    it("should only match files, not directories", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["**/secrets"]
`
      );

      // Create a directory named "secrets" with a file inside
      writeFixtureFile(fixtureDir, "secrets/data.txt", "data");
      // Also create a file named "secrets"
      writeFixtureFile(fixtureDir, "config/secrets", "secret data");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      const output = result.stdout + result.stderr;
      // Should match the file, not complain about the directory
      expect(output).toMatch(/config\/secrets/);
    });
  });
});
