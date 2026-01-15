import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createCheckToml,
  runCodeCheck,
  runCodeAudit,
} from "./utils/test-helpers";

describe("Naming Conventions Tests", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("naming-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // NAM-001: Kebab-case Files - Pass
  describe("NAM-001: Kebab-case Files - Pass", () => {
    it("should pass with kebab-case file names", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts", "tsx"]
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      writeFixtureFile(fixtureDir, "src/my-component.ts", `export const x = 1;\n`);
      writeFixtureFile(fixtureDir, "src/utils/helper-function.ts", `export const y = 2;\n`);

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-006: Folder Naming - Pass
  describe("NAM-006: Folder Naming - Pass", () => {
    it("should pass with correct folder naming", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts"]
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/components/user-profile/index.ts",
        `export const x = 1;\n`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-007: Folder Naming - Fail
  describe("NAM-007: Folder Naming - Fail", () => {
    it("should fail with incorrect folder naming", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts"]
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/Components/UserProfile/index.ts",
        `export const x = 1;\n`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/Components|UserProfile/i);
    });
  });

  // NAM-018: Nested Folder Validation
  describe("NAM-018: Nested Folder Validation", () => {
    it("should validate all folder levels in deep nesting", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts"]
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/features/user/profile/settings/index.ts",
        `export const x = 1;\n`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-020: Audit - Valid Config
  describe("NAM-020: Audit - Valid Config", () => {
    it("should pass audit with valid naming config", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts", "tsx"]
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      const result = runCodeAudit(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });
});
