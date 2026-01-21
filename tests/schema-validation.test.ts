import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createCheckToml,
  runCm,
} from "./utils/test-helpers";

describe("Schema Validation Tests (v1.5.5+)", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("schema-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // SCH-001: Valid configuration passes validation
  describe("SCH-001: Valid Configuration", () => {
    it("should pass validation for valid config", () => {
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true

[code.quality.disable-comments]
enabled = true
extensions = ["ts", "tsx"]
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(0);
      expect(result.stdout + result.stderr).toMatch(/valid/i);
    });
  });

  // SCH-002: Invalid glob pattern in forbidden_files
  describe("SCH-002: Invalid Glob Pattern", () => {
    it("should reject invalid glob patterns", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["[invalid-pattern"]
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(2);
      expect(result.stdout + result.stderr).toMatch(/invalid.*glob|pattern/i);
    });
  });

  // SCH-003: Duplicate extensions within single naming rule
  describe("SCH-003: Duplicate Extensions in Single Rule", () => {
    it("should reject duplicate extensions in same rule", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts", "ts"]
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(2);
      expect(result.stdout + result.stderr).toMatch(/duplicate/i);
    });
  });

  // SCH-004: Duplicate extensions across naming rules (v1.5.6)
  describe("SCH-004: Duplicate Extensions Across Rules", () => {
    it("should reject same extension in multiple rules", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts"]
file_case = "kebab-case"
folder_case = "kebab-case"

[[code.naming.rules]]
extensions = ["ts"]
file_case = "PascalCase"
folder_case = "PascalCase"
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(2);
      expect(result.stdout + result.stderr).toMatch(/ts.*multiple.*rules|extension.*appears/i);
    });
  });

  // SCH-005: Invalid case type
  describe("SCH-005: Invalid Case Type", () => {
    it("should reject invalid case type", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts"]
file_case = "SCREAMING_CASE"
folder_case = "kebab-case"
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(2);
    });
  });

  // SCH-006: Unknown config key (strict mode)
  describe("SCH-006: Unknown Config Key", () => {
    it("should reject unknown configuration keys", () => {
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true
unknown_key = "value"
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(2);
    });
  });

  // SCH-007: Invalid boolean value
  describe("SCH-007: Invalid Boolean Value", () => {
    it("should reject non-boolean for boolean field", () => {
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = "yes"
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(2);
    });
  });

  // SCH-008: Invalid number value
  describe("SCH-008: Invalid Number Value", () => {
    it("should reject non-number for number field", () => {
      createCheckToml(
        fixtureDir,
        `
[code.coverage_run]
enabled = true
min_threshold = "eighty"
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(2);
    });
  });

  // SCH-009: Number out of range
  describe("SCH-009: Number Out of Range", () => {
    it("should reject coverage threshold over 100", () => {
      createCheckToml(
        fixtureDir,
        `
[code.coverage_run]
enabled = true
min_threshold = 150
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(2);
    });
  });

  // SCH-010: Negative coverage threshold
  describe("SCH-010: Negative Coverage Threshold", () => {
    it("should reject negative coverage threshold", () => {
      createCheckToml(
        fixtureDir,
        `
[code.coverage_run]
enabled = true
min_threshold = -10
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(2);
    });
  });

  // SCH-011: Invalid enum value
  describe("SCH-011: Invalid Enum Value", () => {
    it("should reject invalid runner type", () => {
      createCheckToml(
        fixtureDir,
        `
[code.coverage_run]
enabled = true
runner = "mocha"
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(2);
    });
  });

  // SCH-012: Valid enum values
  describe("SCH-012: Valid Enum Values", () => {
    it("should accept valid runner types", () => {
      createCheckToml(
        fixtureDir,
        `
[code.coverage_run]
enabled = true
runner = "vitest"
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // SCH-013: ESLint rule severity
  describe("SCH-013: ESLint Rule Severity", () => {
    it("should accept valid severity levels", () => {
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true

[code.linting.eslint.rules]
"no-console" = "warn"
"no-unused-vars" = "error"
"semi" = "off"
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // SCH-014: ESLint rule with options
  describe("SCH-014: ESLint Rule With Options", () => {
    it("should accept ESLint rule with object options", () => {
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true

[code.linting.eslint.rules.max-lines]
severity = "error"
max = 300
skipBlankLines = true
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // SCH-015: Invalid ESLint severity
  describe("SCH-015: Invalid ESLint Severity", () => {
    it("should reject invalid severity value", () => {
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true

[code.linting.eslint.rules]
"no-console" = "warning"
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(2);
    });
  });

  // SCH-016: CI commands - workflow level
  describe("SCH-016: CI Commands Workflow Level", () => {
    it("should accept workflow-level commands array", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test", "npm run lint"]
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // SCH-017: CI commands - job level
  describe("SCH-017: CI Commands Job Level", () => {
    it("should accept job-level commands object", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands."ci.yml"]
test = ["npm test"]
lint = ["npm run lint"]
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // SCH-018: Forbidden files with custom ignore
  describe("SCH-018: Forbidden Files Custom Ignore", () => {
    it("should accept custom ignore patterns", () => {
      createCheckToml(
        fixtureDir,
        `
[process.forbidden_files]
enabled = true
files = ["**/.env"]
ignore = ["**/test-fixtures/**", "**/samples/**"]
message = "Environment files should not be committed"
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // SCH-019: Duplicate extensions in disable-comments
  describe("SCH-019: Duplicate Extensions in Disable Comments", () => {
    it("should reject duplicate extensions in disable-comments", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts", "tsx", "ts"]
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(2);
      expect(result.stdout + result.stderr).toMatch(/duplicate/i);
    });
  });

  // SCH-020: Valid complex configuration
  describe("SCH-020: Valid Complex Configuration", () => {
    it("should accept valid complex configuration", () => {
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true
files = ["src/**/*.ts"]
ignore = ["**/*.test.ts"]
max-warnings = 10

[code.linting.eslint.rules]
"no-console" = "warn"

[code.linting.eslint.rules.max-lines]
severity = "error"
max = 500

[code.quality.disable-comments]
enabled = true
extensions = ["ts", "tsx"]
exclude = ["tests/**"]

[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts", "tsx"]
file_case = "kebab-case"
folder_case = "kebab-case"
allow_dynamic_routes = true

[[code.naming.rules]]
extensions = ["py"]
file_case = "snake_case"
folder_case = "snake_case"

[process.ci]
enabled = true
require_workflows = ["ci.yml"]

[process.ci.commands]
"ci.yml" = ["npm test"]

[process.forbidden_files]
enabled = true
files = ["**/.env", "**/secrets.*"]
ignore = ["**/test-fixtures/**"]
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // SCH-021: Empty config file
  describe("SCH-021: Empty Config File", () => {
    it("should accept empty config file", () => {
      createCheckToml(fixtureDir, "");

      const result = runCm("validate config", fixtureDir);
      // Empty config should be valid (all defaults)
      expect(result.exitCode).toBe(0);
    });
  });

  // SCH-022: Config file not found
  describe("SCH-022: Config File Not Found", () => {
    it("should fail when config file not found", () => {
      // Don't create any config file
      writeFixtureFile(fixtureDir, "src/index.ts", "export const x = 1;");

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(2);
    });
  });

  // SCH-023: Invalid TOML syntax
  describe("SCH-023: Invalid TOML Syntax", () => {
    it("should fail for invalid TOML syntax", () => {
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint
enabled = true
`
      );

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(2);
    });
  });

  // SCH-024: JSON output format
  describe("SCH-024: JSON Output Format", () => {
    it("should output JSON when requested", () => {
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true
`
      );

      const result = runCm("validate config -f json", fixtureDir);
      expect(result.exitCode).toBe(0);
      const output = result.stdout;
      expect(() => JSON.parse(output)).not.toThrow();
      const parsed = JSON.parse(output);
      expect(parsed.valid).toBe(true);
    });
  });

  // SCH-025: Schema output command
  describe("SCH-025: Schema Output Command", () => {
    it("should output JSON schema", () => {
      createCheckToml(fixtureDir, "");

      const result = runCm("schema config", fixtureDir);
      expect(result.exitCode).toBe(0);
      const output = result.stdout;
      expect(() => JSON.parse(output)).not.toThrow();
      const schema = JSON.parse(output);
      expect(schema).toHaveProperty("$schema");
      expect(schema).toHaveProperty("properties");
    });
  });
});
