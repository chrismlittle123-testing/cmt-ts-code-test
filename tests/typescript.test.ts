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

  // TSC-002: Type Error - Fail
  describe("TSC-002: Type Error - Fail", () => {
    it("should fail with type error", () => {
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

      // Type mismatch: assigning string to number
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `const x: number = "string";
export { x };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/TS\d+/); // TypeScript error code
    });
  });

  // TSC-003: Multiple Type Errors
  describe("TSC-003: Multiple Type Errors", () => {
    it("should report all type errors with file/line/column", () => {
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

      // Multiple type errors
      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `const a: number = "string";
const b: boolean = 123;
const c: string = true;
export { a, b, c };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      // Should contain multiple error references
      const output = result.stdout + result.stderr;
      expect(output).toContain("index.ts");
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

  // TSC-006: Audit - Missing Option
  describe("TSC-006: Audit - Missing Option", () => {
    it("should fail audit when required option is missing", () => {
      createPackageJson(fixtureDir, {
        devDependencies: { typescript: "^5.3.0" },
      });
      // tsconfig without strict
      createTsConfig(fixtureDir, {
        noImplicitAny: true,
        esModuleInterop: true,
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
      expect(result.stdout + result.stderr).toContain("strict");
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

  // TSC-010: tsc Not Installed
  describe("TSC-010: tsc Not Installed", () => {
    it("should skip check when TypeScript is not installed", () => {
      createPackageJson(fixtureDir, {});
      createCheckToml(
        fixtureDir,
        `
[code.types.tsc]
enabled = true
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.stdout + result.stderr).toContain("not installed");
    });
  });
});
