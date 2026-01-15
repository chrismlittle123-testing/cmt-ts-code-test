import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createPackageJson,
  createTsConfig,
  createCheckToml,
  createEslintConfig,
  runCodeCheck,
  runCodeAudit,
} from "./utils/test-helpers";

describe("ESLint Tests", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("eslint-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // ESL-002: Basic Linting - Fail
  describe("ESL-002: Basic Linting - Fail", () => {
    it("should fail with ESLint violations", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { eslint: "^9.0.0" },
      });
      createTsConfig(fixtureDir);
      createEslintConfig(fixtureDir, {
        "no-var": "error",
      });
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true
files = ["src/**/*.ts"]
`
      );

      // Code with ESLint violation (using var)
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `var x = 1;
export { x };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toContain("no-var");
    });
  });

  // ESL-003: Files Pattern
  describe("ESL-003: Files Pattern", () => {
    it("should only check files matching the pattern", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { eslint: "^9.0.0" },
      });
      createTsConfig(fixtureDir);
      createEslintConfig(fixtureDir, {
        "no-var": "error",
      });
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true
files = ["lib/**/*.ts"]
`
      );

      // Violation in src/ (not matched by pattern)
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `var x = 1;
export { x };
`
      );

      // Clean file in lib/
      writeFixtureFile(
        fixtureDir,
        "lib/index.ts",
        `export const x = 1;
`
      );

      const result = runCodeCheck(fixtureDir);
      // Should pass because src/ violations are not in the files pattern
      expect(result.exitCode).toBe(0);
    });
  });

  // ESL-004: Ignore Pattern
  describe("ESL-004: Ignore Pattern", () => {
    it("should ignore files matching the ignore pattern", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { eslint: "^9.0.0" },
      });
      createTsConfig(fixtureDir);
      createEslintConfig(fixtureDir, {
        "no-var": "error",
      });
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true
files = ["src/**/*.ts"]
ignore = ["**/*.test.ts"]
`
      );

      // Clean source file
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export const x = 1;
`
      );

      // Violation in test file (should be ignored)
      writeFixtureFile(
        fixtureDir,
        "src/index.test.ts",
        `var x = 1;
console.log(x);
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // ESL-005: Max Warnings = 0
  describe("ESL-005: Max Warnings = 0", () => {
    it("should fail when warnings exist and max-warnings is 0", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { eslint: "^9.0.0" },
      });
      createTsConfig(fixtureDir);
      createEslintConfig(fixtureDir, {
        "no-console": "warn",
      });
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true
files = ["src/**/*.ts"]
max-warnings = 0
`
      );

      // Code with warning (console.log)
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export function log(msg: string): void {
  console.log(msg);
}
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
    });
  });

  // ESL-007: Config Files Detection
  describe("ESL-007: Config Files Detection", () => {
    const configFiles = [
      { name: "eslint.config.js", content: "export default [];" },
      { name: "eslint.config.mjs", content: "export default [];" },
      { name: "eslint.config.cjs", content: "module.exports = [];" },
      { name: ".eslintrc.js", content: "module.exports = {};" },
      { name: ".eslintrc.json", content: "{}" },
      { name: ".eslintrc.yml", content: "root: true" },
      { name: ".eslintrc.yaml", content: "root: true" },
    ];

    configFiles.forEach(({ name, content }) => {
      it(`should detect ${name} config file`, () => {
        createPackageJson(fixtureDir, {
          devDependencies: { eslint: "^9.0.0" },
        });
        writeFixtureFile(fixtureDir, name, content);
        createCheckToml(
          fixtureDir,
          `
[code.linting.eslint]
enabled = true
`
        );

        writeFixtureFile(
          fixtureDir,
          "src/index.ts",
          `export const x = 1;
`
        );

        // Should not fail with "config not found"
        const result = runCodeAudit(fixtureDir);
        expect(result.stdout + result.stderr).not.toContain("config not found");
      });
    });
  });

  // ESL-008: No Config - Audit Fails
  describe("ESL-008: No Config - Audit Fails", () => {
    it("should fail audit when no ESLint config exists", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { eslint: "^9.0.0" },
      });
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true
`
      );

      const result = runCodeAudit(fixtureDir);
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout + result.stderr).toContain("config");
    });
  });

  // ESL-009: Rule Auditing - Severity Match
  describe("ESL-009: Rule Auditing - Severity Match", () => {
    it("should fail audit when rule severity does not match", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { eslint: "^9.0.0" },
      });
      // ESLint config has "warn" severity
      createEslintConfig(fixtureDir, {
        "no-unused-vars": "warn",
      });
      // check.toml expects "error" severity
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true

[code.linting.eslint.rules]
"no-unused-vars" = "error"
`
      );

      const result = runCodeAudit(fixtureDir);
      expect(result.exitCode).not.toBe(0);
    });
  });

  // ESL-010: Rule Auditing - Rule Missing
  describe("ESL-010: Rule Auditing - Rule Missing", () => {
    it("should fail audit when required rule is not configured", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { eslint: "^9.0.0" },
      });
      // ESLint config without no-console rule
      createEslintConfig(fixtureDir, {
        "no-unused-vars": "error",
      });
      // check.toml requires no-console
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true

[code.linting.eslint.rules]
"no-console" = "error"
`
      );

      const result = runCodeAudit(fixtureDir);
      expect(result.exitCode).not.toBe(0);
    });
  });

  // ESL-011: Rule Auditing - With Options
  describe("ESL-011: Rule Auditing - With Options", () => {
    it("should fail audit when rule options do not match", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { eslint: "^9.0.0" },
      });
      // ESLint config with complexity max = 15
      createEslintConfig(fixtureDir, {
        complexity: ["error", 15],
      });
      // check.toml expects max = 10
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true

[code.linting.eslint.rules]
complexity = { severity = "error", max = 10 }
`
      );

      const result = runCodeAudit(fixtureDir);
      expect(result.exitCode).not.toBe(0);
    });
  });

  // ESL-014: ESLint Parse Error
  describe("ESL-014: ESLint Parse Error", () => {
    it("should report error on invalid syntax", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { eslint: "^9.0.0" },
      });
      createTsConfig(fixtureDir);
      createEslintConfig(fixtureDir, {});
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true
files = ["src/**/*.ts"]
`
      );

      // Invalid TypeScript syntax
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export function broken( {
  // missing closing paren and brace
  return
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBeGreaterThan(0);
    });
  });
});
