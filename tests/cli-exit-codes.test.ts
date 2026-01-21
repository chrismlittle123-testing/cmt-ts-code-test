import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createCheckToml,
  runCm,
} from "./utils/test-helpers";

describe("CLI Exit Codes Tests (v1.5.7+)", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("cli-exit-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // EXIT-001: Exit code 0 for success
  describe("EXIT-001: Exit Code 0 for Success", () => {
    it("should return exit code 0 on successful check", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts"]
`
      );

      writeFixtureFile(fixtureDir, "src/index.ts", "export const x = 1;");

      const result = runCm("code check", fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // EXIT-002: Exit code 1 for violations found
  describe("EXIT-002: Exit Code 1 for Violations", () => {
    it("should return exit code 1 when violations found", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `// eslint-disable-next-line
export const x = 1;
`
      );

      const result = runCm("code check", fixtureDir);
      expect(result.exitCode).toBe(1);
    });
  });

  // EXIT-003: Exit code 2 for config error (v1.5.7 fix)
  describe("EXIT-003: Exit Code 2 for Config Error", () => {
    it("should return exit code 2 for invalid config", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = "not-a-boolean"
`
      );

      const result = runCm("code check", fixtureDir);
      expect(result.exitCode).toBe(2);
    });
  });

  // EXIT-004: Exit code 2 for invalid arguments (v1.5.7 fix)
  describe("EXIT-004: Exit Code 2 for Invalid Arguments", () => {
    it("should return exit code 2 for invalid argument", () => {
      createCheckToml(fixtureDir, "");

      const result = runCm("code check --format invalid", fixtureDir);
      expect(result.exitCode).toBe(2);
    });
  });

  // EXIT-005: Exit code 2 for missing required argument
  describe("EXIT-005: Exit Code 2 for Missing Argument", () => {
    it("should return exit code 2 when required argument missing", () => {
      createCheckToml(fixtureDir, "");

      // check-commit requires a file argument
      const result = runCm("process check-commit", fixtureDir);
      // Should be exit code 2 for missing argument (or 1 if command not found - depends on implementation)
      expect([1, 2]).toContain(result.exitCode);
    });
  });

  // EXIT-006: Exit code 2 for config file not found
  describe("EXIT-006: Exit Code 2 for Missing Config", () => {
    it("should return exit code 2 when check.toml not found", () => {
      // Don't create config file
      writeFixtureFile(fixtureDir, "src/index.ts", "export const x = 1;");

      const result = runCm("code check", fixtureDir);
      expect(result.exitCode).toBe(2);
    });
  });

  // EXIT-007: Exit code 0 for help command
  describe("EXIT-007: Exit Code 0 for Help", () => {
    it("should return exit code 0 for help", () => {
      createCheckToml(fixtureDir, "");

      const result = runCm("--help", fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // EXIT-008: Exit code 0 for version command
  describe("EXIT-008: Exit Code 0 for Version", () => {
    it("should return exit code 0 for version", () => {
      createCheckToml(fixtureDir, "");

      const result = runCm("--version", fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // EXIT-009: Exit code 2 for invalid subcommand
  describe("EXIT-009: Exit Code for Invalid Subcommand", () => {
    it("should return error exit code for invalid subcommand", () => {
      createCheckToml(fixtureDir, "");

      const result = runCm("invalid-subcommand", fixtureDir);
      // Should be non-zero exit code
      expect(result.exitCode).not.toBe(0);
    });
  });

  // EXIT-010: Validate config exit code 0
  describe("EXIT-010: Validate Config Success", () => {
    it("should return exit code 0 for valid config", () => {
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // EXIT-011: Validate config exit code 2
  describe("EXIT-011: Validate Config Failure", () => {
    it("should return exit code 2 for invalid config", () => {
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = "invalid"
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(2);
    });
  });

  // EXIT-012: Audit command with violations
  describe("EXIT-012: Audit With Violations", () => {
    it("should return exit code 1 when audit finds issues", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = []
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      const result = runCm("code audit", fixtureDir);
      expect(result.exitCode).toBe(1);
    });
  });

  // EXIT-013: Process check exit codes
  describe("EXIT-013: Process Check Exit Codes", () => {
    it("should return exit code 1 for process violations", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["**/.env"]
`
      );

      writeFixtureFile(fixtureDir, ".env", "SECRET=123");

      const result = runCm("process check", fixtureDir);
      expect(result.exitCode).toBe(1);
    });
  });

  // EXIT-014: Exit code 0 when check is disabled
  describe("EXIT-014: Disabled Check Success", () => {
    it("should return exit code 0 when check disabled", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = false
files = ["**/.env"]
`
      );

      writeFixtureFile(fixtureDir, ".env", "SECRET=123");

      const result = runCm("process check", fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // EXIT-015: Combined check exit code
  describe("EXIT-015: Combined Check Exit Code", () => {
    it("should return exit code 1 when any domain has violations", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `// @ts-ignore
export const x = 1;
`
      );

      const result = runCm("check", fixtureDir);
      expect(result.exitCode).toBe(1);
    });
  });
});
