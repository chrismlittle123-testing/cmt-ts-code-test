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

describe("Hooks Protected Branches Tests (v1.7.0+)", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("hooks-protected-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // Helper to create husky hook
  function createHuskyHook(hookName: string, content: string) {
    writeFixtureFile(fixtureDir, `.husky/${hookName}`, content);
  }

  // HPB-001: Protected branch check exists
  describe("HPB-001: Protected Branch Check Exists", () => {
    it("should pass when pre-push checks protected branches", () => {
      createCheckToml(
        fixtureDir,
        `
[process.hooks]
enabled = true
require_husky = true
protected_branches = ["main", "master"]
`
      );

      createHuskyHook(
        "pre-push",
        `#!/bin/sh
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "Cannot push directly to main or master"
  exit 1
fi
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // HPB-002: Missing pre-push hook
  describe("HPB-002: Missing Pre-Push Hook", () => {
    it("should fail when pre-push hook is missing but protected_branches configured", () => {
      createCheckToml(
        fixtureDir,
        `
[process.hooks]
enabled = true
require_husky = true
protected_branches = ["main"]
`
      );

      // Create .husky dir but no pre-push hook
      writeFixtureFile(fixtureDir, ".husky/.gitignore", "_");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/pre-push.*not found|required/i);
    });
  });

  // HPB-003: No branch detection in pre-push
  describe("HPB-003: No Branch Detection", () => {
    it("should fail when pre-push has no branch detection", () => {
      createCheckToml(
        fixtureDir,
        `
[process.hooks]
enabled = true
require_husky = true
protected_branches = ["main"]
`
      );

      createHuskyHook(
        "pre-push",
        `#!/bin/sh
npm test
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/branch.*detection|detect.*branch/i);
    });
  });

  // HPB-004: Protected branch not mentioned
  describe("HPB-004: Protected Branch Not Mentioned", () => {
    it("should fail when protected branch is not checked", () => {
      createCheckToml(
        fixtureDir,
        `
[process.hooks]
enabled = true
require_husky = true
protected_branches = ["main", "production"]
`
      );

      createHuskyHook(
        "pre-push",
        `#!/bin/sh
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ]; then
  echo "Cannot push to main"
  exit 1
fi
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/production/i);
    });
  });

  // HPB-005: Alternative branch detection method
  describe("HPB-005: Alternative Branch Detection", () => {
    it("should accept git branch --show-current", () => {
      createCheckToml(
        fixtureDir,
        `
[process.hooks]
enabled = true
require_husky = true
protected_branches = ["main"]
`
      );

      createHuskyHook(
        "pre-push",
        `#!/bin/sh
BRANCH=$(git branch --show-current)
if [ "$BRANCH" = "main" ]; then
  exit 1
fi
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // HPB-006: Symbolic-ref branch detection
  describe("HPB-006: Symbolic-Ref Branch Detection", () => {
    it("should accept git symbolic-ref", () => {
      createCheckToml(
        fixtureDir,
        `
[process.hooks]
enabled = true
require_husky = true
protected_branches = ["main"]
`
      );

      createHuskyHook(
        "pre-push",
        `#!/bin/sh
BRANCH=$(git symbolic-ref --short HEAD)
if [ "$BRANCH" = "main" ]; then
  exit 1
fi
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // HPB-007: Empty protected_branches
  describe("HPB-007: Empty Protected Branches", () => {
    it("should not check when protected_branches is empty", () => {
      createCheckToml(
        fixtureDir,
        `
[process.hooks]
enabled = true
require_husky = true
protected_branches = []
`
      );

      createHuskyHook(
        "pre-push",
        `#!/bin/sh
npm test
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // HPB-008: No protected_branches configured
  describe("HPB-008: No Protected Branches Configured", () => {
    it("should not check when protected_branches is not set", () => {
      createCheckToml(
        fixtureDir,
        `
[process.hooks]
enabled = true
require_husky = true
`
      );

      createHuskyHook(
        "pre-push",
        `#!/bin/sh
npm test
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // HPB-009: Multiple protected branches all checked
  describe("HPB-009: Multiple Protected Branches", () => {
    it("should pass when all protected branches are checked", () => {
      createCheckToml(
        fixtureDir,
        `
[process.hooks]
enabled = true
require_husky = true
protected_branches = ["main", "develop", "release"]
`
      );

      createHuskyHook(
        "pre-push",
        `#!/bin/sh
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "develop" ] || [ "$BRANCH" = "release" ]; then
  echo "Direct push to protected branch is not allowed"
  exit 1
fi
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // HPB-010: Protected branches with hook commands
  describe("HPB-010: Combined With Hook Commands", () => {
    it("should check both protected branches and commands", () => {
      createCheckToml(
        fixtureDir,
        `
[process.hooks]
enabled = true
require_husky = true
protected_branches = ["main"]

[process.hooks.commands]
pre-push = ["npm test"]
`
      );

      createHuskyHook(
        "pre-push",
        `#!/bin/sh
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ]; then
  exit 1
fi
npm test
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // HPB-011: Hook commands without protected branches
  describe("HPB-011: Hook Commands Only", () => {
    it("should check hook commands when no protected branches", () => {
      createCheckToml(
        fixtureDir,
        `
[process.hooks]
enabled = true
require_husky = true

[process.hooks.commands]
pre-commit = ["lint-staged"]
`
      );

      createHuskyHook(
        "pre-commit",
        `#!/bin/sh
npx lint-staged
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // HPB-012: Missing hook command
  describe("HPB-012: Missing Hook Command", () => {
    it("should fail when required command is missing from hook", () => {
      createCheckToml(
        fixtureDir,
        `
[process.hooks]
enabled = true
require_husky = true

[process.hooks.commands]
pre-commit = ["lint-staged"]
`
      );

      createHuskyHook(
        "pre-commit",
        `#!/bin/sh
echo "Running pre-commit"
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/lint-staged.*not.*contain|command/i);
    });
  });
});
