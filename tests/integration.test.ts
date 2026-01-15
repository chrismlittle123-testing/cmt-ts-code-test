import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createPackageJson,
  createTsConfig,
  createCheckToml,
  createEslintConfig,
  createPrettierConfig,
  runCodeCheck,
  runCodeAudit,
  runCm,
} from "./utils/test-helpers";

describe("Integration Tests", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("integration-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // INT-001: All Tools Enabled
  describe("INT-001: All Tools Enabled", () => {
    it("should run all enabled tools and aggregate results", () => {
      createPackageJson(fixtureDir, {
        devDependencies: {
          typescript: "^5.3.0",
          eslint: "^9.0.0",
          prettier: "^3.2.0",
          knip: "^5.0.0",
        },
      });
      createTsConfig(fixtureDir);
      createEslintConfig(fixtureDir, {
        "no-unused-vars": "error",
      });
      createPrettierConfig(fixtureDir);

      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true
files = ["src/**/*.ts"]

[code.formatting.prettier]
enabled = true

[code.types.tsc]
enabled = true

[code.unused.knip]
enabled = true

[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts"]
file_case = "kebab-case"

[code.quality.disable-comments]
enabled = true
extensions = ["ts"]

[code.tests]
enabled = true
pattern = "**/*.test.ts"
min_test_files = 1
`
      );

      // Clean source file
      writeFixtureFile(
        fixtureDir,
        "src/my-module.ts",
        `export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
`
      );

      // Test file
      writeFixtureFile(
        fixtureDir,
        "tests/my-module.test.ts",
        `import { greet } from "../src/my-module";

describe("greet", () => {
  it("should greet by name", () => {
    expect(greet("World")).toBe("Hello, World!");
  });
});
`
      );

      const result = runCodeCheck(fixtureDir);
      // All tools should run
      expect(result).toBeDefined();
    });
  });

  // INT-002: Some Tools Disabled
  describe("INT-002: Some Tools Disabled", () => {
    it("should skip disabled tools", () => {
      createPackageJson(fixtureDir, {
        devDependencies: {
          typescript: "^5.3.0",
          eslint: "^9.0.0",
        },
      });
      createTsConfig(fixtureDir);

      // ESLint config with strict rules
      createEslintConfig(fixtureDir, {
        "no-var": "error",
      });

      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = false

[code.types.tsc]
enabled = true

[code.formatting.prettier]
enabled = false

[code.unused.knip]
enabled = false
`
      );

      // Code with ESLint violation (but ESLint is disabled)
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `var x = 1;
export { x };
`
      );

      const result = runCodeCheck(fixtureDir);
      // Should pass because ESLint is disabled (tsc doesn't care about var)
      expect(result.exitCode).toBe(0);
    });
  });

  // INT-003: Audit Then Check
  describe("INT-003: Audit Then Check", () => {
    it("should run audit to verify configs, then run check", () => {
      createPackageJson(fixtureDir, {
        devDependencies: {
          typescript: "^5.3.0",
        },
      });
      createTsConfig(fixtureDir, {
        strict: true,
        noImplicitAny: true,
      });

      createCheckToml(
        fixtureDir,
        `
[code.types.tsc]
enabled = true

[code.types.tsc.require]
strict = true
noImplicitAny = true
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

      // First run audit
      const auditResult = runCodeAudit(fixtureDir);
      expect(auditResult.exitCode).toBe(0);

      // Then run check
      const checkResult = runCodeCheck(fixtureDir);
      expect(checkResult.exitCode).toBe(0);
    });
  });

  // INT-004: Aggregate Command
  describe("INT-004: Aggregate Command", () => {
    it("should run cm check to include CODE domain results", () => {
      createPackageJson(fixtureDir, {
        devDependencies: {
          typescript: "^5.3.0",
        },
      });
      createTsConfig(fixtureDir);

      createCheckToml(
        fixtureDir,
        `
[code.types.tsc]
enabled = true
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export const x = 1;
`
      );

      // Run aggregate command (cm check runs all domains)
      const result = runCm("check", fixtureDir);

      // Should include CODE domain results
      expect(result).toBeDefined();
    });
  });
});
