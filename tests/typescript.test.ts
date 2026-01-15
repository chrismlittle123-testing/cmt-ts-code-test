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

describe("TypeScript (tsc) Tests", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("tsc-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // TSC-001: No Type Errors - Pass
  describe("TSC-001: No Type Errors - Pass", () => {
    it("should pass with valid TypeScript code", () => {
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

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `export function add(a: number, b: number): number {
  return a + b;
}

const result: number = add(1, 2);
console.log(result);
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // TSC-004: No tsconfig.json
  describe("TSC-004: No tsconfig.json", () => {
    it("should fail when no tsconfig.json exists", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { typescript: "^5.3.0" },
      });
      // No tsconfig.json created
      createCheckToml(
        fixtureDir,
        `
[code.types.tsc]
enabled = true
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout + result.stderr).toContain("config");
    });
  });

  // TSC-005: Audit - All Options Present
  describe("TSC-005: Audit - All Options Present", () => {
    it("should pass audit when all required options are present", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { typescript: "^5.3.0" },
      });
      createTsConfig(fixtureDir, {
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      });
      createCheckToml(
        fixtureDir,
        `
[code.types.tsc]
enabled = true

[code.types.tsc.require]
strict = true
noImplicitAny = true
strictNullChecks = true
esModuleInterop = true
skipLibCheck = true
forceConsistentCasingInFileNames = true
`
      );

      const result = runCodeAudit(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // TSC-007: Audit - Wrong Value
  describe("TSC-007: Audit - Wrong Value", () => {
    it("should fail audit when option has wrong value", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { typescript: "^5.3.0" },
      });
      // tsconfig with strict: false
      createTsConfig(fixtureDir, {
        strict: false,
      });
      createCheckToml(
        fixtureDir,
        `
[code.types.tsc]
enabled = true

[code.types.tsc.require]
strict = true
`
      );

      const result = runCodeAudit(fixtureDir);
      expect(result.exitCode).not.toBe(0);
    });
  });

  // TSC-008: Audit - Each Auditable Option
  describe("TSC-008: Audit - Each Auditable Option", () => {
    const auditableOptions = [
      "strict",
      "noImplicitAny",
      "strictNullChecks",
      "noUnusedLocals",
      "noUnusedParameters",
      "noImplicitReturns",
      "noFallthroughCasesInSwitch",
      "esModuleInterop",
      "skipLibCheck",
      "forceConsistentCasingInFileNames",
    ];

    auditableOptions.forEach((option) => {
      it(`should audit ${option} option`, () => {
        createPackageJson(fixtureDir, {
          devDependencies: { typescript: "^5.3.0" },
        });
        createTsConfig(fixtureDir, {
          [option]: true,
        });
        createCheckToml(
          fixtureDir,
          `
[code.types.tsc]
enabled = true

[code.types.tsc.require]
${option} = true
`
        );

        const result = runCodeAudit(fixtureDir);
        expect(result.exitCode).toBe(0);
      });
    });
  });

  // TSC-009: tsconfig with Comments (JSONC)
  describe("TSC-009: tsconfig with Comments (JSONC)", () => {
    it("should parse tsconfig with comments", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { typescript: "^5.3.0" },
      });

      // tsconfig.json with comments (JSONC format)
      const tsconfigWithComments = `{
  // This is a comment
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true, // Strict mode enabled
    /* Block comment */
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}`;
      writeFixtureFile(fixtureDir, "tsconfig.json", tsconfigWithComments);

      createCheckToml(
        fixtureDir,
        `
[code.types.tsc]
enabled = true

[code.types.tsc.require]
strict = true
`
      );

      const result = runCodeAudit(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });
});
