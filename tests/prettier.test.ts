import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createPackageJson,
  createCheckToml,
  createPrettierConfig,
  runCodeCheck,
} from "./utils/test-helpers";

describe("Prettier Tests", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("prettier-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // PRT-001: Formatted Code - Pass
  describe("PRT-001: Formatted Code - Pass", () => {
    it("should pass with properly formatted code", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { prettier: "^3.2.0" },
      });
      createPrettierConfig(fixtureDir, {
        semi: true,
        singleQuote: false,
        tabWidth: 2,
      });
      createCheckToml(
        fixtureDir,
        `
[code.formatting.prettier]
enabled = true
`
      );

      // Properly formatted code
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

  // PRT-002: Unformatted Code - Fail
  describe("PRT-002: Unformatted Code - Fail", () => {
    it("should fail with unformatted code", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { prettier: "^3.2.0" },
      });
      createPrettierConfig(fixtureDir, {
        semi: true,
        singleQuote: false,
        tabWidth: 2,
      });
      createCheckToml(
        fixtureDir,
        `
[code.formatting.prettier]
enabled = true
`
      );

      // Unformatted code (inconsistent formatting)
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export function add(a:number,b:number):number{
return a+b}
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
    });
  });

  // PRT-003: Config Files Detection
  describe("PRT-003: Config Files Detection", () => {
    const configFiles = [
      { name: ".prettierrc", content: '{ "semi": true }' },
      { name: ".prettierrc.json", content: '{ "semi": true }' },
      { name: ".prettierrc.yml", content: "semi: true" },
      { name: ".prettierrc.yaml", content: "semi: true" },
      { name: ".prettierrc.js", content: "module.exports = { semi: true };" },
      { name: "prettier.config.js", content: "module.exports = { semi: true };" },
      { name: "prettier.config.mjs", content: "export default { semi: true };" },
    ];

    configFiles.forEach(({ name, content }) => {
      it(`should detect ${name} config file`, () => {
        createPackageJson(fixtureDir, {
          devDependencies: { prettier: "^3.2.0" },
        });
        writeFixtureFile(fixtureDir, name, content);
        createCheckToml(
          fixtureDir,
          `
[code.formatting.prettier]
enabled = true
`
        );

        writeFixtureFile(
          fixtureDir,
          "src/index.ts",
          `export const x = 1;
`
        );

        // Should run without config errors
        const result = runCodeCheck(fixtureDir);
        expect(result.stdout + result.stderr).not.toContain("config not found");
      });
    });
  });

  // PRT-004: Prettier Ignore
  describe("PRT-004: Prettier Ignore", () => {
    it("should skip files in .prettierignore", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { prettier: "^3.2.0" },
      });
      createPrettierConfig(fixtureDir);
      createCheckToml(
        fixtureDir,
        `
[code.formatting.prettier]
enabled = true
`
      );

      // Create .prettierignore
      writeFixtureFile(fixtureDir, ".prettierignore", "src/ignored.ts\n");

      // Properly formatted file
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export const x = 1;
`
      );

      // Unformatted file (should be ignored)
      writeFixtureFile(
        fixtureDir,
        "src/ignored.ts",
        `export function ugly(a:number,b:number){return a+b}`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // PRT-005: Prettier Not Installed
  describe("PRT-005: Prettier Not Installed", () => {
    it("should skip check when Prettier is not installed", () => {
      createPackageJson(fixtureDir, {});
      createCheckToml(
        fixtureDir,
        `
[code.formatting.prettier]
enabled = true
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.stdout + result.stderr).toContain("not installed");
    });
  });

  // PRT-006: Disabled
  describe("PRT-006: Disabled", () => {
    it("should skip check when disabled", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { prettier: "^3.2.0" },
      });
      createPrettierConfig(fixtureDir);
      createCheckToml(
        fixtureDir,
        `
[code.formatting.prettier]
enabled = false
`
      );

      // Unformatted code (should be skipped)
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export function ugly(a:number,b:number){return a+b}`
      );

      const result = runCodeCheck(fixtureDir);
      // Should pass because prettier check is disabled
      expect(result.exitCode).toBe(0);
    });
  });
});
