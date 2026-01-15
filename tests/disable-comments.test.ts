import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createCheckToml,
  runCodeCheck,
} from "./utils/test-helpers";

describe("Disable Comments Tests", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("disable-comments-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // DIS-001: No Disable Comments - Pass
  describe("DIS-001: No Disable Comments - Pass", () => {
    it("should pass with clean code without disable comments", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts", "tsx", "js", "jsx"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export function add(a: number, b: number): number {
  return a + b;
}
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // DIS-002: eslint-disable
  describe("DIS-002: eslint-disable", () => {
    it("should detect eslint-disable-next-line comment", () => {
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
const x = 1;
export { x };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/eslint-disable/i);
    });
  });

  // DIS-003: eslint-disable-line
  describe("DIS-003: eslint-disable-line", () => {
    it("should detect eslint-disable-line comment", () => {
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
        `const x = 1; // eslint-disable-line
export { x };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/eslint-disable/i);
    });
  });

  // DIS-004: eslint-disable Block
  describe("DIS-004: eslint-disable Block", () => {
    it("should detect eslint-disable block comment", () => {
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
        `/* eslint-disable */
const x = 1;
const y = 2;
/* eslint-enable */
export { x, y };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/eslint-disable/i);
    });
  });

  // DIS-005: @ts-ignore
  describe("DIS-005: @ts-ignore", () => {
    it("should detect @ts-ignore comment", () => {
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
const x: number = "string";
export { x };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/@ts-ignore/i);
    });
  });

  // DIS-006: @ts-expect-error
  describe("DIS-006: @ts-expect-error", () => {
    it("should detect @ts-expect-error comment", () => {
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
        `// @ts-expect-error - intentional type error
const x: number = "string";
export { x };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/@ts-expect-error/i);
    });
  });

  // DIS-007: @ts-nocheck
  describe("DIS-007: @ts-nocheck", () => {
    it("should detect @ts-nocheck comment", () => {
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
        `// @ts-nocheck
const x: number = "string";
export { x };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/@ts-nocheck/i);
    });
  });

  // DIS-008: prettier-ignore
  describe("DIS-008: prettier-ignore", () => {
    it("should detect prettier-ignore comment", () => {
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
        `// prettier-ignore
const x = {a:1,b:2,c:3};
export { x };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/prettier-ignore/i);
    });
  });

  // DIS-009: Exclude Pattern
  describe("DIS-009: Exclude Pattern", () => {
    it("should exclude files matching exclude pattern", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts"]
exclude = ["tests/**", "**/*.test.ts"]
`
      );

      // Clean source file
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export const x = 1;
`
      );

      // Test file with disable comments (should be excluded)
      writeFixtureFile(
        fixtureDir,
        "tests/index.test.ts",
        `// @ts-ignore
const x = 1;
`
      );

      // Another test file pattern
      writeFixtureFile(
        fixtureDir,
        "src/utils.test.ts",
        `// eslint-disable-next-line
const y = 2;
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // DIS-010: Multiple Comments Same File
  describe("DIS-010: Multiple Comments Same File", () => {
    it("should report each disable comment with line number", () => {
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
const a = 1;

// eslint-disable-next-line
const b = 2;

// prettier-ignore
const c = 3;

export { a, b, c };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      // Should report multiple violations
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/@ts-ignore/i);
      expect(output).toMatch(/eslint-disable/i);
      expect(output).toMatch(/prettier-ignore/i);
    });
  });

  // DIS-011: Extensions Filter
  describe("DIS-011: Extensions Filter", () => {
    it("should only check files matching extensions", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts", "tsx"]
`
      );

      // TypeScript file (should be checked)
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export const x = 1;
`
      );

      // Markdown file with disable comments (should NOT be checked)
      writeFixtureFile(
        fixtureDir,
        "docs/readme.md",
        `# Docs

\`\`\`ts
// @ts-ignore - this is in markdown, should be ignored
const x = 1;
\`\`\`
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // DIS-012: Disabled
  describe("DIS-012: Disabled", () => {
    it("should skip check when disabled", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = false
extensions = ["ts"]
`
      );

      // File with disable comments
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `// @ts-ignore
// eslint-disable-next-line
const x = 1;
export { x };
`
      );

      const result = runCodeCheck(fixtureDir);
      // Should pass because check is disabled
      expect(result.exitCode).toBe(0);
    });
  });
});
