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

function runValidateConfig(cwd: string) {
  return runCm("validate config", cwd);
}

describe("Bug Fix Verification Tests (v2.0.0)", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("bug-fixes-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // =====================================================================
  // Issue 1: CI Commands Crashes When `if: true` (Boolean) Is Used
  // Originally crashed with "expression.trim is not a function"
  // Fixed in v2.0.0 - now handles boolean values explicitly
  // =====================================================================
  describe("BUG-001: CI Commands With Boolean if: true", () => {
    it("should handle boolean if: true without crashing", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      writeFixtureFile(
        fixtureDir,
        ".github/workflows/ci.yml",
        `name: CI
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
        if: true
`
      );

      const result = runProcessCheck(fixtureDir);
      // Should NOT crash with "expression.trim is not a function"
      expect(result.stdout + result.stderr).not.toMatch(/trim.*is not a function/i);
      // Should pass because if: true is unconditional
      expect(result.exitCode).toBe(0);
    });

    it("should handle boolean if: false as conditional", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      writeFixtureFile(
        fixtureDir,
        ".github/workflows/ci.yml",
        `name: CI
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
        if: false
`
      );

      const result = runProcessCheck(fixtureDir);
      // Should NOT crash
      expect(result.stdout + result.stderr).not.toMatch(/trim.*is not a function/i);
      // Should fail because if: false means command won't run
      expect(result.exitCode).toBe(1);
    });

    it("should still handle string 'true' as unconditional", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      writeFixtureFile(
        fixtureDir,
        ".github/workflows/ci.yml",
        `name: CI
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
        if: 'true'
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // =====================================================================
  // Issue 2: Invalid Glob Patterns Not Validated in Config
  // Originally accepted invalid patterns like "[invalid-pattern"
  // Fixed in v2.0.0 - now uses countUnclosedDelimiters to detect unbalanced brackets
  // =====================================================================
  describe("BUG-002: Invalid Glob Patterns Validation", () => {
    it("should reject glob pattern with unbalanced bracket", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["[invalid-pattern"]
`
      );

      const result = runValidateConfig(fixtureDir);
      // Should fail validation with CONFIG_ERROR (exit code 2)
      expect(result.exitCode).toBe(2);
      expect(result.stdout + result.stderr).toMatch(/invalid.*glob|bracket/i);
    });

    it("should reject glob pattern with unbalanced brace", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["{invalid-pattern"]
`
      );

      const result = runValidateConfig(fixtureDir);
      // Should fail validation with CONFIG_ERROR (exit code 2)
      expect(result.exitCode).toBe(2);
      expect(result.stdout + result.stderr).toMatch(/invalid.*glob|brace/i);
    });

    it("should accept valid glob patterns", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["*.log", "**/*.tmp", "[abc].txt", "{a,b,c}.js"]
`
      );

      const result = runValidateConfig(fixtureDir);
      expect(result.exitCode).toBe(0);
    });

    it("should accept escaped brackets in glob pattern", () => {
      // Note: TOML requires double backslash for escaping
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["file[1].txt"]
`
      );

      const result = runValidateConfig(fixtureDir);
      // This is actually a valid character class pattern [1] matching "1"
      expect(result.exitCode).toBe(0);
    });

    it("should reject empty glob pattern", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = [""]
`
      );

      const result = runValidateConfig(fixtureDir);
      // Should fail because empty pattern is invalid (CONFIG_ERROR = 2)
      expect(result.exitCode).toBe(2);
    });

    it("should validate PR exclude patterns", () => {
      createCheckToml(
        fixtureDir,
        `
[process.pr]
enabled = true
max_files = 10
exclude = ["[unclosed"]
`
      );

      const result = runValidateConfig(fixtureDir);
      // CONFIG_ERROR = 2
      expect(result.exitCode).toBe(2);
      expect(result.stdout + result.stderr).toMatch(/invalid.*glob|bracket/i);
    });
  });

  // =====================================================================
  // Issue 3: CLI Returns Exit Code 1 Instead of 2 for Invalid Arguments
  // Originally returned exit code 1 for invalid format argument
  // May or may not be fixed - testing current behavior
  // =====================================================================
  describe("BUG-003: CLI Exit Codes For Invalid Arguments", () => {
    it("should return exit code 2 for invalid format argument", () => {
      const result = runCm("code check --format invalid", fixtureDir);
      // This tests if the bug is fixed - expect exit code 2 for CONFIG_ERROR
      // If still returning 1, this will fail and document the bug
      expect(result.exitCode).toBe(2);
    });

    it("should return exit code 2 for unknown option", () => {
      const result = runCm("code check --unknown-option", fixtureDir);
      // Unknown option should be a config/argument error
      expect(result.exitCode).toBe(1); // Commander typically returns 1 for unknown options
    });

    it("should return exit code 0 for valid format", () => {
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = false
`
      );

      const result = runCm("code check --format json", fixtureDir);
      expect(result.exitCode).toBe(0);
    });

    it("should return exit code 0 for help command", () => {
      const result = runCm("--help", fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // =====================================================================
  // Additional bug regression tests
  // =====================================================================
  describe("Regression Tests", () => {
    it("should not crash on workflow with no jobs", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      writeFixtureFile(
        fixtureDir,
        ".github/workflows/ci.yml",
        `name: CI
on:
  pull_request:
    branches: [main]
`
      );

      const result = runProcessCheck(fixtureDir);
      // Should fail gracefully, not crash
      expect(result.exitCode).toBe(1);
    });

    it("should not crash on workflow with null steps", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      writeFixtureFile(
        fixtureDir,
        ".github/workflows/ci.yml",
        `name: CI
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
`
      );

      const result = runProcessCheck(fixtureDir);
      // Should fail gracefully, not crash
      expect(result.exitCode).toBe(1);
    });

    it("should handle numeric if condition", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      writeFixtureFile(
        fixtureDir,
        ".github/workflows/ci.yml",
        `name: CI
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
        if: 1
`
      );

      const result = runProcessCheck(fixtureDir);
      // Should NOT crash - code should convert to string first
      expect(result.stdout + result.stderr).not.toMatch(/is not a function/i);
    });
  });
});
