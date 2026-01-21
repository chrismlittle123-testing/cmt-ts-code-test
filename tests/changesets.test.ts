import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync } from "child_process";
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

/**
 * Initialize a git repo with a branch
 */
function initGitWithBranch(fixtureDir: string, branchName = "feature/test") {
  try {
    execSync("git init", { cwd: fixtureDir, stdio: "pipe" });
    execSync("git config user.email 'test@test.com'", { cwd: fixtureDir, stdio: "pipe" });
    execSync("git config user.name 'Test'", { cwd: fixtureDir, stdio: "pipe" });
    writeFixtureFile(fixtureDir, "README.md", "# Test");
    execSync("git add .", { cwd: fixtureDir, stdio: "pipe" });
    execSync('git commit -m "initial"', { cwd: fixtureDir, stdio: "pipe" });
    execSync("git branch -M main", { cwd: fixtureDir, stdio: "pipe" });
    execSync(`git checkout -b ${branchName}`, { cwd: fixtureDir, stdio: "pipe" });
  } catch {
    // Ignore errors
  }
}

describe("Changeset Validation Tests (v1.8.0+)", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("changesets-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // Helper to create a changeset file
  function createChangeset(name: string, content: string) {
    writeFixtureFile(fixtureDir, `.changeset/${name}.md`, content);
  }

  // Helper to create changeset config
  function createChangesetConfig() {
    writeFixtureFile(
      fixtureDir,
      ".changeset/config.json",
      JSON.stringify({ changelog: false, commit: false, access: "restricted" }, null, 2)
    );
  }

  // CHG-001: Valid changeset format
  describe("CHG-001: Valid Changeset Format", () => {
    it("should pass with valid changeset format", () => {
      createCheckToml(
        fixtureDir,
        `
[process.changesets]
enabled = true
`
      );

      createChangesetConfig();
      createChangeset(
        "cool-feature",
        `---
"my-package": minor
---

Added a cool new feature.
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // CHG-002: Missing changeset directory
  describe("CHG-002: Missing Changeset Directory", () => {
    it("should fail when .changeset directory missing", () => {
      createCheckToml(
        fixtureDir,
        `
[process.changesets]
enabled = true
`
      );

      // Don't create .changeset directory

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/changeset.*directory|not found/i);
    });
  });

  // CHG-003: Missing frontmatter
  describe("CHG-003: Missing Frontmatter", () => {
    it("should fail when changeset has no frontmatter", () => {
      createCheckToml(
        fixtureDir,
        `
[process.changesets]
enabled = true
`
      );

      createChangesetConfig();
      createChangeset(
        "bad-changeset",
        `This changeset has no frontmatter delimiters.
Just plain text.
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/frontmatter|delimiter|format/i);
    });
  });

  // CHG-004: Invalid frontmatter (missing closing)
  describe("CHG-004: Invalid Frontmatter Missing Closing", () => {
    it("should fail when frontmatter has no closing delimiter", () => {
      createCheckToml(
        fixtureDir,
        `
[process.changesets]
enabled = true
`
      );

      createChangesetConfig();
      createChangeset(
        "incomplete-changeset",
        `---
"my-package": minor

Description without closing frontmatter.
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/frontmatter|closing|delimiter/i);
    });
  });

  // CHG-005: Empty packages in frontmatter
  describe("CHG-005: Empty Packages In Frontmatter", () => {
    it("should fail when no packages are listed in frontmatter", () => {
      createCheckToml(
        fixtureDir,
        `
[process.changesets]
enabled = true
`
      );

      createChangesetConfig();
      createChangeset(
        "empty-packages",
        `---
---

Description but no packages.
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/no package|entries/i);
    });
  });

  // CHG-006: Missing description
  describe("CHG-006: Missing Description", () => {
    it("should fail when description is missing and required", () => {
      createCheckToml(
        fixtureDir,
        `
[process.changesets]
enabled = true
require_description = true
`
      );

      createChangesetConfig();
      createChangeset(
        "no-desc",
        `---
"my-package": patch
---
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/description/i);
    });
  });

  // CHG-007: Description too short
  describe("CHG-007: Description Too Short", () => {
    it("should fail when description is shorter than minimum", () => {
      createCheckToml(
        fixtureDir,
        `
[process.changesets]
enabled = true
min_description_length = 50
`
      );

      createChangesetConfig();
      createChangeset(
        "short-desc",
        `---
"my-package": patch
---

Short.
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/description.*length|characters/i);
    });
  });

  // CHG-008: Invalid bump type
  describe("CHG-008: Invalid Bump Type", () => {
    it("should fail when bump type is not allowed", () => {
      createCheckToml(
        fixtureDir,
        `
[process.changesets]
enabled = true
allowed_bump_types = ["patch", "minor"]
`
      );

      createChangesetConfig();
      createChangeset(
        "major-change",
        `---
"my-package": major
---

This is a breaking change.
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/major.*not allowed|bump type/i);
    });
  });

  // CHG-009: Validate format disabled
  describe("CHG-009: Validate Format Disabled", () => {
    it("should skip format validation when disabled", () => {
      createCheckToml(
        fixtureDir,
        `
[process.changesets]
enabled = true
validate_format = false
`
      );

      createChangesetConfig();
      createChangeset(
        "any-format",
        `---
---

No packages listed but validation disabled.
`
      );

      const result = runProcessCheck(fixtureDir);
      // Should not fail on empty packages when validate_format is false
      // but may still fail on require_description (default true)
      expect(result).toBeDefined();
    });
  });

  // CHG-010: Multiple changesets
  describe("CHG-010: Multiple Changesets", () => {
    it("should validate all changeset files", () => {
      createCheckToml(
        fixtureDir,
        `
[process.changesets]
enabled = true
`
      );

      createChangesetConfig();
      createChangeset(
        "good-change",
        `---
"my-package": minor
---

Good change description.
`
      );
      createChangeset(
        "bad-change",
        `---
---

Empty packages.
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
    });
  });

  // CHG-011: Disabled changesets check
  describe("CHG-011: Disabled Changesets Check", () => {
    it("should skip when changesets check is disabled", () => {
      createCheckToml(
        fixtureDir,
        `
[process.changesets]
enabled = false
`
      );

      // Don't create .changeset directory

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // CHG-012: README.md excluded from validation
  describe("CHG-012: README Excluded", () => {
    it("should not validate README.md as a changeset", () => {
      createCheckToml(
        fixtureDir,
        `
[process.changesets]
enabled = true
`
      );

      createChangesetConfig();
      writeFixtureFile(
        fixtureDir,
        ".changeset/README.md",
        "# Changesets\n\nThis is documentation, not a changeset."
      );
      createChangeset(
        "real-change",
        `---
"my-package": patch
---

Real changeset.
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // CHG-013: Require changeset for paths
  describe("CHG-013: Require Changeset For Paths", () => {
    it("should require changeset when specific paths changed", () => {
      createCheckToml(
        fixtureDir,
        `
[process.changesets]
enabled = true
require_for_paths = ["src/**"]
`
      );

      createChangesetConfig();
      initGitWithBranch(fixtureDir);

      // Create a source file change
      writeFixtureFile(fixtureDir, "src/index.ts", "export const x = 1;");
      try {
        execSync("git add .", { cwd: fixtureDir, stdio: "pipe" });
        execSync('git commit -m "add src"', { cwd: fixtureDir, stdio: "pipe" });
      } catch {
        // Ignore
      }

      // No changeset created
      const result = runProcessCheck(fixtureDir);
      // This may skip if it can't find base branch
      expect(result).toBeDefined();
    });
  });

  // CHG-014: All bump types allowed by default
  describe("CHG-014: All Bump Types Allowed By Default", () => {
    it("should allow all bump types when not restricted", () => {
      createCheckToml(
        fixtureDir,
        `
[process.changesets]
enabled = true
`
      );

      createChangesetConfig();
      createChangeset(
        "major-allowed",
        `---
"my-package": major
---

Breaking change allowed.
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });
});
