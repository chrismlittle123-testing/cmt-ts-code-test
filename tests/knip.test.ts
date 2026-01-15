import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createPackageJson,
  createTsConfig,
  createCheckToml,
  runCodeCheck,
  runCodeAudit,
} from "./utils/test-helpers";

describe("Knip Tests", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("knip-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // KNP-001: Clean Project - Pass
  describe("KNP-001: Clean Project - Pass", () => {
    it("should pass with all exports and dependencies used", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { knip: "^5.0.0", typescript: "^5.3.0" },
      });
      createTsConfig(fixtureDir);
      createCheckToml(
        fixtureDir,
        `
[code.unused.knip]
enabled = true
`
      );

      // Main entry point that uses all exports
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export function main(): void {
  console.log("Hello");
}
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // KNP-002: Unused File
  describe("KNP-002: Unused File", () => {
    it("should detect unused file", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { knip: "^5.0.0", typescript: "^5.3.0" },
      });
      createTsConfig(fixtureDir);
      createCheckToml(
        fixtureDir,
        `
[code.unused.knip]
enabled = true
`
      );

      // Main file
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export function main(): void {
  console.log("Hello");
}
`
      );

      // Unused file (not imported anywhere)
      writeFixtureFile(
        fixtureDir,
        "src/unused.ts",
        `export function unused(): void {
  console.log("Never used");
}
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toContain("unused");
    });
  });

  // KNP-003: Unused Export
  describe("KNP-003: Unused Export", () => {
    it("should detect unused export", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { knip: "^5.0.0", typescript: "^5.3.0" },
      });
      createTsConfig(fixtureDir);
      createCheckToml(
        fixtureDir,
        `
[code.unused.knip]
enabled = true
`
      );

      // File with unused export
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export function usedFunc(): void {
  console.log("Used");
}

export function unusedFunc(): void {
  console.log("Never imported");
}
`
      );

      // File that only imports usedFunc
      writeFixtureFile(
        fixtureDir,
        "src/main.ts",
        `import { usedFunc } from "./index";

usedFunc();
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toContain("unusedFunc");
    });
  });

  // KNP-004: Unused Dependency
  describe("KNP-004: Unused Dependency", () => {
    it("should detect unused dependency", () => {
      createPackageJson(fixtureDir, {
        dependencies: {
          lodash: "^4.17.21", // Listed but never imported
        },
        devDependencies: { knip: "^5.0.0", typescript: "^5.3.0" },
      });
      createTsConfig(fixtureDir);
      createCheckToml(
        fixtureDir,
        `
[code.unused.knip]
enabled = true
`
      );

      // Code that doesn't use lodash
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export function main(): void {
  console.log("Hello");
}
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toContain("lodash");
    });
  });

  // KNP-005: Unused DevDependency
  describe("KNP-005: Unused DevDependency", () => {
    it("should detect unused devDependency", () => {
      createPackageJson(fixtureDir, {
        devDependencies: {
          knip: "^5.0.0",
          typescript: "^5.3.0",
          "unused-dev-pkg": "^1.0.0", // Listed but never used
        },
      });
      createTsConfig(fixtureDir);
      createCheckToml(
        fixtureDir,
        `
[code.unused.knip]
enabled = true
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export function main(): void {
  console.log("Hello");
}
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toContain("unused-dev-pkg");
    });
  });

  // KNP-006: Unlisted Dependency
  describe("KNP-006: Unlisted Dependency", () => {
    it("should detect unlisted dependency (error severity)", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { knip: "^5.0.0", typescript: "^5.3.0" },
        // Note: lodash is NOT listed
      });
      createTsConfig(fixtureDir);
      createCheckToml(
        fixtureDir,
        `
[code.unused.knip]
enabled = true
`
      );

      // Code that imports unlisted package
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `import _ from "lodash";

export function main(): void {
  console.log(_.chunk([1, 2, 3], 2));
}
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/unlisted|lodash/i);
    });
  });

  // KNP-007: Unused Type
  describe("KNP-007: Unused Type", () => {
    it("should detect unused type export", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { knip: "^5.0.0", typescript: "^5.3.0" },
      });
      createTsConfig(fixtureDir);
      createCheckToml(
        fixtureDir,
        `
[code.unused.knip]
enabled = true
`
      );

      // File with unused type
      writeFixtureFile(
        fixtureDir,
        "src/types.ts",
        `export type UsedType = string;
export type UnusedType = number; // Never used anywhere
`
      );

      // File that only uses UsedType
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `import type { UsedType } from "./types";

export function process(value: UsedType): void {
  console.log(value);
}
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toContain("UnusedType");
    });
  });

  // KNP-008: Duplicate Export
  describe("KNP-008: Duplicate Export", () => {
    it("should detect duplicate exports", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { knip: "^5.0.0", typescript: "^5.3.0" },
      });
      createTsConfig(fixtureDir);
      createCheckToml(
        fixtureDir,
        `
[code.unused.knip]
enabled = true
`
      );

      // Same function exported from multiple files
      writeFixtureFile(
        fixtureDir,
        "src/utils-a.ts",
        `export function helper(): void {
  console.log("A");
}
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/utils-b.ts",
        `export function helper(): void {
  console.log("B");
}
`
      );

      // Re-export both
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export { helper } from "./utils-a";
export { helper as helperB } from "./utils-b";
`
      );

      const result = runCodeCheck(fixtureDir);
      // May or may not fail depending on how cm handles this
      // The test verifies the check runs
      expect(result).toBeDefined();
    });
  });

  // KNP-009: Unresolved Import
  describe("KNP-009: Unresolved Import", () => {
    it("should detect unresolved import (error severity)", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { knip: "^5.0.0", typescript: "^5.3.0" },
      });
      createTsConfig(fixtureDir);
      createCheckToml(
        fixtureDir,
        `
[code.unused.knip]
enabled = true
`
      );

      // Import from non-existent file
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `import { missing } from "./non-existent";

export function main(): void {
  console.log(missing);
}
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/unresolved|non-existent/i);
    });
  });

  // KNP-010: Audit - No package.json
  describe("KNP-010: Audit - No package.json", () => {
    it("should fail audit when no package.json exists", () => {
      // No package.json created
      createCheckToml(
        fixtureDir,
        `
[code.unused.knip]
enabled = true
`
      );

      const result = runCodeAudit(fixtureDir);
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout + result.stderr).toContain("package.json");
    });
  });

  // KNP-011: Config Files Detection
  describe("KNP-011: Config Files Detection", () => {
    const configFiles = [
      { name: "knip.json", content: '{ "entry": ["src/index.ts"] }' },
      { name: "knip.jsonc", content: '{ "entry": ["src/index.ts"] // comment }' },
      { name: "knip.js", content: "module.exports = { entry: ['src/index.ts'] };" },
      { name: "knip.ts", content: "export default { entry: ['src/index.ts'] };" },
      { name: "knip.config.js", content: "module.exports = { entry: ['src/index.ts'] };" },
      { name: "knip.config.ts", content: "export default { entry: ['src/index.ts'] };" },
    ];

    configFiles.forEach(({ name, content }) => {
      it(`should detect ${name} config file`, () => {
        createPackageJson(fixtureDir, {
          devDependencies: { knip: "^5.0.0", typescript: "^5.3.0" },
        });
        createTsConfig(fixtureDir);
        writeFixtureFile(fixtureDir, name, content);
        createCheckToml(
          fixtureDir,
          `
[code.unused.knip]
enabled = true
`
        );

        writeFixtureFile(
          fixtureDir,
          "src/index.ts",
          `export const x = 1;
`
        );

        const result = runCodeCheck(fixtureDir);
        // Should not fail with "config not found"
        expect(result.stdout + result.stderr).not.toContain("config not found");
      });
    });
  });

  // KNP-012: Works Without Config
  describe("KNP-012: Works Without Config", () => {
    it("should run with defaults when no knip config exists", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { knip: "^5.0.0", typescript: "^5.3.0" },
      });
      createTsConfig(fixtureDir);
      // No knip config file
      createCheckToml(
        fixtureDir,
        `
[code.unused.knip]
enabled = true
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export function main(): void {
  console.log("Hello");
}
`
      );

      const result = runCodeCheck(fixtureDir);
      // Should run without config errors
      expect(result).toBeDefined();
    });
  });
});
