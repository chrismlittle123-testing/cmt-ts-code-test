import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createCheckToml,
  runCm,
} from "./utils/test-helpers";

function runCheckCommit(cwd: string, commitMsgFile: string, args = "") {
  return runCm(`process check-commit ${commitMsgFile} ${args}`, cwd);
}

describe("Check-Commit Command Tests (v1.11.0+)", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("check-commit-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // Helper to create commit message file
  function createCommitMsgFile(message: string) {
    writeFixtureFile(fixtureDir, "COMMIT_EDITMSG", message);
    return "COMMIT_EDITMSG";
  }

  // CCM-001: Valid conventional commit
  describe("CCM-001: Valid Conventional Commit", () => {
    it("should pass with valid conventional commit", () => {
      createCheckToml(
        fixtureDir,
        `
[process.commits]
enabled = true
types = ["feat", "fix", "chore"]
`
      );

      const msgFile = createCommitMsgFile("feat: add new feature");

      const result = runCheckCommit(fixtureDir, msgFile);
      expect(result.exitCode).toBe(0);
    });
  });

  // CCM-002: Invalid commit type
  describe("CCM-002: Invalid Commit Type", () => {
    it("should fail with invalid commit type", () => {
      createCheckToml(
        fixtureDir,
        `
[process.commits]
enabled = true
types = ["feat", "fix"]
`
      );

      const msgFile = createCommitMsgFile("wip: work in progress");

      const result = runCheckCommit(fixtureDir, msgFile);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/does not match|format/i);
    });
  });

  // CCM-003: Breaking change with !
  describe("CCM-003: Breaking Change Indicator", () => {
    it("should support breaking change indicator (!)", () => {
      createCheckToml(
        fixtureDir,
        `
[process.commits]
enabled = true
types = ["feat", "fix"]
`
      );

      const msgFile = createCommitMsgFile("feat!: breaking change");

      const result = runCheckCommit(fixtureDir, msgFile);
      expect(result.exitCode).toBe(0);
    });
  });

  // CCM-004: Breaking change with scope
  describe("CCM-004: Breaking Change With Scope", () => {
    it("should support breaking change with scope", () => {
      createCheckToml(
        fixtureDir,
        `
[process.commits]
enabled = true
types = ["feat", "fix"]
`
      );

      const msgFile = createCommitMsgFile("feat(api)!: breaking API change");

      const result = runCheckCommit(fixtureDir, msgFile);
      expect(result.exitCode).toBe(0);
    });
  });

  // CCM-005: Required scope missing
  describe("CCM-005: Required Scope Missing", () => {
    it("should fail when scope is required but missing", () => {
      createCheckToml(
        fixtureDir,
        `
[process.commits]
enabled = true
types = ["feat", "fix"]
require_scope = true
`
      );

      const msgFile = createCommitMsgFile("feat: feature without scope");

      const result = runCheckCommit(fixtureDir, msgFile);
      expect(result.exitCode).toBe(1);
    });
  });

  // CCM-006: Subject length exceeded
  describe("CCM-006: Subject Length Exceeded", () => {
    it("should fail when subject exceeds max length", () => {
      createCheckToml(
        fixtureDir,
        `
[process.commits]
enabled = true
types = ["feat"]
max_subject_length = 50
`
      );

      const longSubject = "feat: this is a very long commit message that exceeds the maximum length limit";
      const msgFile = createCommitMsgFile(longSubject);

      const result = runCheckCommit(fixtureDir, msgFile);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/exceeds|length/i);
    });
  });

  // CCM-007: Ticket reference required
  describe("CCM-007: Ticket Reference Required", () => {
    it("should fail when ticket reference is required but missing", () => {
      // Use literal TOML strings for regex patterns
      createCheckToml(
        fixtureDir,
        `
[process.commits]
enabled = true
types = ["feat"]

[process.tickets]
enabled = true
pattern = 'PROJ-\\d+'
require_in_commits = true
`
      );

      const msgFile = createCommitMsgFile("feat: feature without ticket");

      const result = runCheckCommit(fixtureDir, msgFile);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/ticket|PROJ/i);
    });
  });

  // CCM-008: Ticket reference present
  describe("CCM-008: Ticket Reference Present", () => {
    it("should pass when ticket reference is present", () => {
      createCheckToml(
        fixtureDir,
        `
[process.commits]
enabled = true
types = ["feat"]

[process.tickets]
enabled = true
pattern = 'PROJ-\\d+'
require_in_commits = true
`
      );

      const msgFile = createCommitMsgFile("feat: PROJ-123 add feature");

      const result = runCheckCommit(fixtureDir, msgFile);
      expect(result.exitCode).toBe(0);
    });
  });

  // CCM-009: Skip merge commits
  describe("CCM-009: Skip Merge Commits", () => {
    it("should skip validation for merge commits", () => {
      createCheckToml(
        fixtureDir,
        `
[process.commits]
enabled = true
types = ["feat", "fix"]
`
      );

      const msgFile = createCommitMsgFile("Merge branch 'feature/test' into main");

      const result = runCheckCommit(fixtureDir, msgFile);
      expect(result.exitCode).toBe(0);
    });
  });

  // CCM-010: Skip revert commits
  describe("CCM-010: Skip Revert Commits", () => {
    it("should skip validation for revert commits", () => {
      createCheckToml(
        fixtureDir,
        `
[process.commits]
enabled = true
types = ["feat", "fix"]
`
      );

      const msgFile = createCommitMsgFile("Revert \"feat: add feature\"");

      const result = runCheckCommit(fixtureDir, msgFile);
      expect(result.exitCode).toBe(0);
    });
  });

  // CCM-011: Skip fixup commits
  describe("CCM-011: Skip Fixup Commits", () => {
    it("should skip validation for fixup commits", () => {
      createCheckToml(
        fixtureDir,
        `
[process.commits]
enabled = true
types = ["feat", "fix"]
`
      );

      const msgFile = createCommitMsgFile("fixup! feat: original commit");

      const result = runCheckCommit(fixtureDir, msgFile);
      expect(result.exitCode).toBe(0);
    });
  });

  // CCM-012: Skip squash commits
  describe("CCM-012: Skip Squash Commits", () => {
    it("should skip validation for squash commits", () => {
      createCheckToml(
        fixtureDir,
        `
[process.commits]
enabled = true
types = ["feat", "fix"]
`
      );

      const msgFile = createCommitMsgFile("squash! feat: original commit");

      const result = runCheckCommit(fixtureDir, msgFile);
      expect(result.exitCode).toBe(0);
    });
  });

  // CCM-013: Skip amend commits
  describe("CCM-013: Skip Amend Commits", () => {
    it("should skip validation for amend commits", () => {
      createCheckToml(
        fixtureDir,
        `
[process.commits]
enabled = true
types = ["feat", "fix"]
`
      );

      const msgFile = createCommitMsgFile("amend! feat: original commit");

      const result = runCheckCommit(fixtureDir, msgFile);
      expect(result.exitCode).toBe(0);
    });
  });

  // CCM-014: Missing commit message file
  describe("CCM-014: Missing Commit Message File", () => {
    it("should fail when commit message file doesn't exist", () => {
      createCheckToml(
        fixtureDir,
        `
[process.commits]
enabled = true
`
      );

      const result = runCheckCommit(fixtureDir, "nonexistent.txt");
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/could not read/i);
    });
  });

  // CCM-015: Validation disabled
  describe("CCM-015: Validation Disabled", () => {
    it("should skip when commits validation is disabled", () => {
      createCheckToml(
        fixtureDir,
        `
[process.commits]
enabled = false
`
      );

      const msgFile = createCommitMsgFile("random commit message");

      const result = runCheckCommit(fixtureDir, msgFile);
      expect(result.exitCode).toBe(0);
    });
  });

  // CCM-016: Quiet mode
  describe("CCM-016: Quiet Mode", () => {
    it("should suppress success message in quiet mode", () => {
      createCheckToml(
        fixtureDir,
        `
[process.commits]
enabled = true
types = ["feat"]
`
      );

      const msgFile = createCommitMsgFile("feat: add feature");

      const result = runCheckCommit(fixtureDir, msgFile, "--quiet");
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe("");
    });
  });

  // CCM-017: Multi-line commit message
  describe("CCM-017: Multi-Line Commit Message", () => {
    it("should only validate the first line (subject)", () => {
      createCheckToml(
        fixtureDir,
        `
[process.commits]
enabled = true
types = ["feat"]
`
      );

      const msgFile = createCommitMsgFile("feat: add feature\n\nThis is the body.\nWith multiple lines.");

      const result = runCheckCommit(fixtureDir, msgFile);
      expect(result.exitCode).toBe(0);
    });
  });

  // CCM-018: Scope with special characters
  describe("CCM-018: Scope With Special Characters", () => {
    it("should handle scope with hyphens and slashes", () => {
      createCheckToml(
        fixtureDir,
        `
[process.commits]
enabled = true
types = ["feat"]
`
      );

      const msgFile = createCommitMsgFile("feat(api/v2): add endpoint");

      const result = runCheckCommit(fixtureDir, msgFile);
      expect(result.exitCode).toBe(0);
    });
  });
});
