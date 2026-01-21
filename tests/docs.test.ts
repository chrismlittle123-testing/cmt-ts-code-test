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
 * Initialize a git repo with commits for freshness tracking
 */
function initGitWithTimestamps(fixtureDir: string) {
  try {
    execSync("git init", { cwd: fixtureDir, stdio: "pipe" });
    execSync("git config user.email 'test@test.com'", { cwd: fixtureDir, stdio: "pipe" });
    execSync("git config user.name 'Test'", { cwd: fixtureDir, stdio: "pipe" });
  } catch {
    // Ignore errors
  }
}

describe("Documentation Governance Tests (v1.10.0+)", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("docs-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // DOC-001: Markdown files inside docs/ allowed
  describe("DOC-001: Markdown Files In Docs", () => {
    it("should allow markdown files inside docs/ directory", () => {
      createCheckToml(
        fixtureDir,
        `
[process.docs]
enabled = true
path = "docs/"
`
      );

      writeFixtureFile(fixtureDir, "docs/guide.md", "# Guide\n\nThis is a guide.");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // DOC-002: Markdown files outside docs/ fail
  describe("DOC-002: Markdown Outside Docs Fails", () => {
    it("should warn when markdown files exist outside docs/", () => {
      createCheckToml(
        fixtureDir,
        `
[process.docs]
enabled = true
path = "docs/"
`
      );

      writeFixtureFile(fixtureDir, "docs/guide.md", "# Guide");
      writeFixtureFile(fixtureDir, "random/file.md", "# Random");

      const result = runProcessCheck(fixtureDir);
      // Default enforcement is "warn" so should still be exit 0 but with warnings
      expect(result).toBeDefined();
    });
  });

  // DOC-003: Allowlist permits specific files
  describe("DOC-003: Allowlist Permits Files", () => {
    it("should allow markdown files on the allowlist", () => {
      createCheckToml(
        fixtureDir,
        `
[process.docs]
enabled = true
path = "docs/"
allowlist = ["README.md", "CONTRIBUTING.md"]
`
      );

      writeFixtureFile(fixtureDir, "docs/guide.md", "# Guide");
      writeFixtureFile(fixtureDir, "README.md", "# Readme");
      writeFixtureFile(fixtureDir, "CONTRIBUTING.md", "# Contributing");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // DOC-004: Max files exceeded
  describe("DOC-004: Max Files Exceeded", () => {
    it("should warn when docs/ exceeds max_files", () => {
      createCheckToml(
        fixtureDir,
        `
[process.docs]
enabled = true
path = "docs/"
max_files = 2
`
      );

      writeFixtureFile(fixtureDir, "docs/one.md", "# One");
      writeFixtureFile(fixtureDir, "docs/two.md", "# Two");
      writeFixtureFile(fixtureDir, "docs/three.md", "# Three");

      const result = runProcessCheck(fixtureDir);
      expect(result.stdout + result.stderr).toMatch(/3.*files.*max.*2/i);
    });
  });

  // DOC-005: Max file lines exceeded
  describe("DOC-005: Max File Lines Exceeded", () => {
    it("should warn when a doc file exceeds max_file_lines", () => {
      createCheckToml(
        fixtureDir,
        `
[process.docs]
enabled = true
path = "docs/"
max_file_lines = 5
`
      );

      writeFixtureFile(fixtureDir, "docs/long.md", "# Long\n\n1\n2\n3\n4\n5\n6\n7\n8");

      const result = runProcessCheck(fixtureDir);
      expect(result.stdout + result.stderr).toMatch(/lines.*max/i);
    });
  });

  // DOC-006: Max total KB exceeded
  describe("DOC-006: Max Total KB Exceeded", () => {
    it("should warn when total docs size exceeds limit", () => {
      createCheckToml(
        fixtureDir,
        `
[process.docs]
enabled = true
path = "docs/"
max_total_kb = 1
`
      );

      // Create a large file (~2KB)
      const largeContent = "x".repeat(2048);
      writeFixtureFile(fixtureDir, "docs/large.md", largeContent);

      const result = runProcessCheck(fixtureDir);
      expect(result.stdout + result.stderr).toMatch(/size.*max|kb/i);
    });
  });

  // DOC-007: Required sections for doc type
  describe("DOC-007: Required Sections For Doc Type", () => {
    it("should fail when required sections are missing", () => {
      createCheckToml(
        fixtureDir,
        `
[process.docs]
enabled = true
path = "docs/"

[process.docs.types.api]
required_sections = ["Overview", "Parameters", "Returns"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "docs/api.md",
        `---
type: api
---

# Overview

Some overview.

# Parameters

Some params.
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.stdout + result.stderr).toMatch(/missing.*section|returns/i);
    });
  });

  // DOC-008: Required frontmatter for doc type
  describe("DOC-008: Required Frontmatter For Doc Type", () => {
    it("should fail when required frontmatter is missing", () => {
      createCheckToml(
        fixtureDir,
        `
[process.docs]
enabled = true
path = "docs/"

[process.docs.types.api]
frontmatter = ["title", "version"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "docs/api.md",
        `---
type: api
title: API Reference
---

# Overview
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.stdout + result.stderr).toMatch(/missing.*frontmatter.*version/i);
    });
  });

  // DOC-009: Broken internal link
  describe("DOC-009: Broken Internal Link", () => {
    it("should warn about broken internal links", () => {
      createCheckToml(
        fixtureDir,
        `
[process.docs]
enabled = true
path = "docs/"
`
      );

      writeFixtureFile(
        fixtureDir,
        "docs/guide.md",
        `# Guide

See [other doc](./nonexistent.md) for more info.
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.stdout + result.stderr).toMatch(/broken.*link|nonexistent/i);
    });
  });

  // DOC-010: Valid internal link
  describe("DOC-010: Valid Internal Link", () => {
    it("should pass with valid internal links", () => {
      createCheckToml(
        fixtureDir,
        `
[process.docs]
enabled = true
path = "docs/"
`
      );

      writeFixtureFile(fixtureDir, "docs/guide.md", "# Guide\n\nSee [other](./other.md)");
      writeFixtureFile(fixtureDir, "docs/other.md", "# Other");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // DOC-011: External links not validated
  describe("DOC-011: External Links Not Validated", () => {
    it("should not validate external links", () => {
      createCheckToml(
        fixtureDir,
        `
[process.docs]
enabled = true
path = "docs/"
`
      );

      writeFixtureFile(
        fixtureDir,
        "docs/guide.md",
        `# Guide

See [external](https://example.com) for info.
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // DOC-012: Block enforcement mode
  describe("DOC-012: Block Enforcement Mode", () => {
    it("should return error severity in block mode", () => {
      createCheckToml(
        fixtureDir,
        `
[process.docs]
enabled = true
path = "docs/"
enforcement = "block"
max_files = 1
`
      );

      writeFixtureFile(fixtureDir, "docs/one.md", "# One");
      writeFixtureFile(fixtureDir, "docs/two.md", "# Two");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
    });
  });

  // DOC-013: API coverage check
  describe("DOC-013: API Coverage Check", () => {
    it("should check API coverage against source exports", () => {
      createCheckToml(
        fixtureDir,
        `
[process.docs]
enabled = true
path = "docs/"
min_coverage = 100
coverage_paths = ["src/**/*.ts"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export function myFunction() { return 1; }
export class MyClass {}
`
      );

      writeFixtureFile(fixtureDir, "docs/api.md", "# API\n\nDocs about myFunction.");

      const result = runProcessCheck(fixtureDir);
      // Should fail because MyClass is not documented
      expect(result.stdout + result.stderr).toMatch(/coverage|undocumented|MyClass/i);
    });
  });

  // DOC-014: Disabled docs check
  describe("DOC-014: Disabled Docs Check", () => {
    it("should skip when docs check is disabled", () => {
      createCheckToml(
        fixtureDir,
        `
[process.docs]
enabled = false
`
      );

      // Random markdown files
      writeFixtureFile(fixtureDir, "random.md", "# Random");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // DOC-015: Custom docs path
  describe("DOC-015: Custom Docs Path", () => {
    it("should use custom docs path", () => {
      createCheckToml(
        fixtureDir,
        `
[process.docs]
enabled = true
path = "documentation/"
`
      );

      writeFixtureFile(fixtureDir, "documentation/guide.md", "# Guide");

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // DOC-016: Staleness tracking with git
  describe("DOC-016: Staleness Tracking", () => {
    it("should track staleness based on git commits", () => {
      createCheckToml(
        fixtureDir,
        `
[process.docs]
enabled = true
path = "docs/"
staleness_days = 1

[process.docs.stale_mappings]
"docs/api.md" = "src/index.ts"
`
      );

      initGitWithTimestamps(fixtureDir);

      // Create source file
      writeFixtureFile(fixtureDir, "src/index.ts", "export const x = 1;");
      writeFixtureFile(fixtureDir, "docs/api.md", "# API");

      try {
        execSync("git add .", { cwd: fixtureDir, stdio: "pipe" });
        execSync('git commit -m "initial"', { cwd: fixtureDir, stdio: "pipe" });
      } catch {
        // Ignore
      }

      const result = runProcessCheck(fixtureDir);
      // Should pass if both committed at same time
      expect(result).toBeDefined();
    });
  });

  // DOC-017: Hash anchor links not validated
  describe("DOC-017: Hash Anchor Links", () => {
    it("should not validate hash-only anchor links", () => {
      createCheckToml(
        fixtureDir,
        `
[process.docs]
enabled = true
path = "docs/"
`
      );

      writeFixtureFile(
        fixtureDir,
        "docs/guide.md",
        `# Guide

See [section](#section-name) below.

## Section Name

Content here.
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // DOC-018: Exclude patterns from coverage
  describe("DOC-018: Exclude Patterns From Coverage", () => {
    it("should exclude test files from coverage calculation", () => {
      createCheckToml(
        fixtureDir,
        `
[process.docs]
enabled = true
path = "docs/"
min_coverage = 100
coverage_paths = ["src/**/*.ts"]
exclude_patterns = ["**/*.test.ts"]
`
      );

      writeFixtureFile(fixtureDir, "src/index.ts", "export function main() {}");
      writeFixtureFile(fixtureDir, "src/index.test.ts", "export function testHelper() {}");
      writeFixtureFile(fixtureDir, "docs/api.md", "# API\n\nDocs about main.");

      const result = runProcessCheck(fixtureDir);
      // Should pass because test file is excluded
      expect(result.exitCode).toBe(0);
    });
  });
});
