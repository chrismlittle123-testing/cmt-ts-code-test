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

});
