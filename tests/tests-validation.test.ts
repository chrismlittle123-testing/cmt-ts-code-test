import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createCheckToml,
  runCodeCheck,
} from "./utils/test-helpers";

describe("Tests Validation Tests", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("tests-validation-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // TST-001: Test Files Exist - Pass
  describe("TST-001: Test Files Exist - Pass", () => {
    it("should pass when test files exist", () => {
      createCheckToml(
        fixtureDir,
        `
[code.tests]
enabled = true
pattern = "**/*.{test,spec}.{ts,tsx,js,jsx}"
min_test_files = 1
`
      );

      // Source files
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export function add(a: number, b: number): number {
  return a + b;
}
`
      );

      // Test file
      writeFixtureFile(
        fixtureDir,
        "tests/index.test.ts",
        `import { add } from "../src/index";

describe("add", () => {
  it("should add two numbers", () => {
    expect(add(1, 2)).toBe(3);
  });
});
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // TST-002: No Test Files - Fail
  describe("TST-002: No Test Files - Fail", () => {
    it("should fail when no test files exist", () => {
      createCheckToml(
        fixtureDir,
        `
[code.tests]
enabled = true
pattern = "**/*.{test,spec}.{ts,tsx,js,jsx}"
min_test_files = 1
`
      );

      // Only source files, no test files
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export function add(a: number, b: number): number {
  return a + b;
}
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/test|no.*files/i);
    });
  });

  // TST-003: Custom Pattern
  describe("TST-003: Custom Pattern", () => {
    it("should respect custom test pattern", () => {
      createCheckToml(
        fixtureDir,
        `
[code.tests]
enabled = true
pattern = "**/__tests__/**/*.ts"
min_test_files = 1
`
      );

      // Source files
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export const x = 1;
`
      );

      // Test files in __tests__ directory
      writeFixtureFile(
        fixtureDir,
        "src/__tests__/index.ts",
        `describe("index", () => {
  it("should work", () => {});
});
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // TST-004: Min Test Files
  describe("TST-004: Min Test Files", () => {
    it("should fail when not enough test files exist", () => {
      createCheckToml(
        fixtureDir,
        `
[code.tests]
enabled = true
pattern = "**/*.test.ts"
min_test_files = 5
`
      );

      // Source files
      writeFixtureFile(fixtureDir, "src/index.ts", `export const x = 1;\n`);

      // Only 1 test file (need 5)
      writeFixtureFile(
        fixtureDir,
        "tests/index.test.ts",
        `describe("test", () => {
  it("works", () => {});
});
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/test.*file|min/i);
    });
  });

  // TST-005: Multiple Test Patterns
  describe("TST-005: Multiple Test Patterns", () => {
    it("should match multiple test patterns", () => {
      createCheckToml(
        fixtureDir,
        `
[code.tests]
enabled = true
pattern = "**/*.{test,spec}.{ts,tsx}"
min_test_files = 2
`
      );

      // Source file
      writeFixtureFile(fixtureDir, "src/index.ts", `export const x = 1;\n`);

      // .test.ts file
      writeFixtureFile(
        fixtureDir,
        "tests/unit.test.ts",
        `describe("unit", () => {
  it("works", () => {});
});
`
      );

      // .spec.ts file
      writeFixtureFile(
        fixtureDir,
        "tests/integration.spec.ts",
        `describe("integration", () => {
  it("works", () => {});
});
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // TST-006: Disabled
  describe("TST-006: Disabled", () => {
    it("should skip check when disabled", () => {
      createCheckToml(
        fixtureDir,
        `
[code.tests]
enabled = false
pattern = "**/*.test.ts"
min_test_files = 10
`
      );

      // No test files at all
      writeFixtureFile(fixtureDir, "src/index.ts", `export const x = 1;\n`);

      const result = runCodeCheck(fixtureDir);
      // Should pass because check is disabled
      expect(result.exitCode).toBe(0);
    });
  });
});
