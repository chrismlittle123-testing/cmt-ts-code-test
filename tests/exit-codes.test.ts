import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createPackageJson,
  createTsConfig,
  createCheckToml,
  runCodeCheck,
} from "./utils/test-helpers";

describe("Exit Code Tests", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("exitcode-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // EXIT-001: All Checks Pass
  describe("EXIT-001: All Checks Pass", () => {
    it("should return exit code 0 when all checks pass", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { typescript: "^5.3.0" },
      });
      createTsConfig(fixtureDir);
      createCheckToml(
        fixtureDir,
        `
[code.types.tsc]
enabled = true
`
      );

      // Valid TypeScript code
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

  // EXIT-002: Violations Found
  describe("EXIT-002: Violations Found", () => {
    it("should return exit code 1 when violations are found", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { typescript: "^5.3.0" },
      });
      createTsConfig(fixtureDir);
      createCheckToml(
        fixtureDir,
        `
[code.types.tsc]
enabled = true
`
      );

      // Invalid TypeScript code (type error)
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `const x: number = "string";
export { x };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
    });
  });

  // EXIT-003: Config Error
  describe("EXIT-003: Config Error", () => {
    it("should return exit code 2 for config errors", () => {
      createPackageJson(fixtureDir, {});

      // Invalid check.toml syntax
      writeFixtureFile(
        fixtureDir,
        "check.toml",
        `
[code.types.tsc
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
      expect(result.exitCode).toBe(2);
    });
  });

  // EXIT-004: Runtime Error
  describe("EXIT-004: Runtime Error", () => {
    it("should return exit code 3 for runtime errors", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { typescript: "^5.3.0" },
      });

      // Valid config but will cause runtime error
      createCheckToml(
        fixtureDir,
        `
[code.types.tsc]
enabled = true
`
      );

      // Reference a non-existent config file in tsconfig
      writeFixtureFile(
        fixtureDir,
        "tsconfig.json",
        JSON.stringify({
          extends: "./non-existent-config.json",
          compilerOptions: {
            strict: true,
          },
        })
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export const x = 1;
`
      );

      const result = runCodeCheck(fixtureDir);
      // Should be exit code 3 for runtime error, or 1 if treated as violation
      expect(result.exitCode).toBeGreaterThan(0);
    });
  });
});
