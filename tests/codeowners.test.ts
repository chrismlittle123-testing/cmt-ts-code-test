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

function runProcessAudit(cwd: string, args = "") {
  return runCm(`process audit ${args}`, cwd);
}

describe("CODEOWNERS Validation Tests (v1.9.0+)", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("codeowners-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // Helper to create CODEOWNERS file
  function createCodeowners(location: string, content: string) {
    writeFixtureFile(fixtureDir, location, content);
  }

  // COW-001: CODEOWNERS file exists
  describe("COW-001: CODEOWNERS File Exists", () => {
    it("should pass when CODEOWNERS exists at .github/CODEOWNERS", () => {
      createCheckToml(
        fixtureDir,
        `
[process.codeowners]
enabled = true
`
      );

      createCodeowners(
        ".github/CODEOWNERS",
        `* @default-owner
`
      );

      const result = runProcessAudit(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // COW-002: CODEOWNERS in root
  describe("COW-002: CODEOWNERS In Root", () => {
    it("should find CODEOWNERS in repository root", () => {
      createCheckToml(
        fixtureDir,
        `
[process.codeowners]
enabled = true
`
      );

      createCodeowners(
        "CODEOWNERS",
        `* @default-owner
`
      );

      const result = runProcessAudit(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // COW-003: CODEOWNERS in docs/
  describe("COW-003: CODEOWNERS In Docs", () => {
    it("should find CODEOWNERS in docs/ directory", () => {
      createCheckToml(
        fixtureDir,
        `
[process.codeowners]
enabled = true
`
      );

      createCodeowners(
        "docs/CODEOWNERS",
        `* @default-owner
`
      );

      const result = runProcessAudit(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // COW-004: Missing CODEOWNERS file
  describe("COW-004: Missing CODEOWNERS", () => {
    it("should fail when CODEOWNERS file is missing", () => {
      createCheckToml(
        fixtureDir,
        `
[process.codeowners]
enabled = true
`
      );

      // Don't create CODEOWNERS

      const result = runProcessAudit(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/codeowners.*not found/i);
    });
  });

  // COW-005: Required rules present
  describe("COW-005: Required Rules Present", () => {
    it("should pass when all required rules exist with correct owners", () => {
      createCheckToml(
        fixtureDir,
        `
[process.codeowners]
enabled = true

[[process.codeowners.rules]]
pattern = "/check.toml"
owners = ["@platform-team"]

[[process.codeowners.rules]]
pattern = "*.ts"
owners = ["@dev-team"]
`
      );

      createCodeowners(
        ".github/CODEOWNERS",
        `/check.toml @platform-team
*.ts @dev-team
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // COW-006: Missing required rule
  describe("COW-006: Missing Required Rule", () => {
    it("should fail when required rule is missing", () => {
      createCheckToml(
        fixtureDir,
        `
[process.codeowners]
enabled = true

[[process.codeowners.rules]]
pattern = "/check.toml"
owners = ["@platform-team"]
`
      );

      createCodeowners(
        ".github/CODEOWNERS",
        `* @default-owner
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/missing.*required.*rule|check\.toml/i);
    });
  });

  // COW-007: Owner mismatch
  describe("COW-007: Owner Mismatch", () => {
    it("should fail when rule exists but owners don't match", () => {
      createCheckToml(
        fixtureDir,
        `
[process.codeowners]
enabled = true

[[process.codeowners.rules]]
pattern = "/check.toml"
owners = ["@platform-team"]
`
      );

      createCodeowners(
        ".github/CODEOWNERS",
        `/check.toml @wrong-team
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/owner.*mismatch/i);
    });
  });

  // COW-008: Multiple owners
  describe("COW-008: Multiple Owners", () => {
    it("should validate multiple owners correctly", () => {
      createCheckToml(
        fixtureDir,
        `
[process.codeowners]
enabled = true

[[process.codeowners.rules]]
pattern = "/src/**"
owners = ["@team-a", "@team-b"]
`
      );

      createCodeowners(
        ".github/CODEOWNERS",
        `/src/** @team-a @team-b
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // COW-009: Extra rules in CODEOWNERS (not in config)
  describe("COW-009: Extra Rules In CODEOWNERS", () => {
    it("should fail when CODEOWNERS has rules not in config", () => {
      createCheckToml(
        fixtureDir,
        `
[process.codeowners]
enabled = true

[[process.codeowners.rules]]
pattern = "*.ts"
owners = ["@dev-team"]
`
      );

      createCodeowners(
        ".github/CODEOWNERS",
        `*.ts @dev-team
*.js @extra-team
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/unexpected.*rule|not.*config/i);
    });
  });

  // COW-010: Malformed CODEOWNERS line
  describe("COW-010: Malformed CODEOWNERS Line", () => {
    it("should fail when CODEOWNERS has malformed lines", () => {
      createCheckToml(
        fixtureDir,
        `
[process.codeowners]
enabled = true

[[process.codeowners.rules]]
pattern = "*.ts"
owners = ["@dev-team"]
`
      );

      createCodeowners(
        ".github/CODEOWNERS",
        `*.ts @dev-team
/bad/pattern/no/owner
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/malformed|no owner/i);
    });
  });

  // COW-011: Comments and blank lines
  describe("COW-011: Comments And Blank Lines", () => {
    it("should ignore comments and blank lines", () => {
      createCheckToml(
        fixtureDir,
        `
[process.codeowners]
enabled = true

[[process.codeowners.rules]]
pattern = "*.ts"
owners = ["@dev-team"]
`
      );

      createCodeowners(
        ".github/CODEOWNERS",
        `# This is a comment

# Another comment
*.ts @dev-team

`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // COW-012: Disabled CODEOWNERS check
  describe("COW-012: Disabled CODEOWNERS Check", () => {
    it("should skip when codeowners check is disabled", () => {
      createCheckToml(
        fixtureDir,
        `
[process.codeowners]
enabled = false
`
      );

      // No CODEOWNERS file

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // COW-013: Owner order matters
  describe("COW-013: Owner Order Matters", () => {
    it("should fail when owners are in different order", () => {
      createCheckToml(
        fixtureDir,
        `
[process.codeowners]
enabled = true

[[process.codeowners.rules]]
pattern = "/src/**"
owners = ["@team-a", "@team-b"]
`
      );

      createCodeowners(
        ".github/CODEOWNERS",
        `/src/** @team-b @team-a
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/owner.*mismatch/i);
    });
  });

  // COW-014: No rules configured (just check existence)
  describe("COW-014: No Rules Configured", () => {
    it("should just check file exists when no rules configured", () => {
      createCheckToml(
        fixtureDir,
        `
[process.codeowners]
enabled = true
`
      );

      createCodeowners(
        ".github/CODEOWNERS",
        `* @anyone
/random @team
`
      );

      const result = runProcessCheck(fixtureDir);
      // Should fail because extra rules not in config
      expect(result.exitCode).toBe(1);
    });
  });

  // COW-015: Team and user handles
  describe("COW-015: Team And User Handles", () => {
    it("should handle both user and team handles", () => {
      createCheckToml(
        fixtureDir,
        `
[process.codeowners]
enabled = true

[[process.codeowners.rules]]
pattern = "*.ts"
owners = ["@user", "@org/team"]
`
      );

      createCodeowners(
        ".github/CODEOWNERS",
        `*.ts @user @org/team
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });
});
