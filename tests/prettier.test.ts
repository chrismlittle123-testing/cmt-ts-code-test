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
