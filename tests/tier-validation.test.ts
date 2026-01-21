import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createCheckToml,
  runCm,
} from "./utils/test-helpers";

// Import from check-my-toolkit to test exports (v1.5.5)
import { VALID_TIERS } from "check-my-toolkit";

describe("Tier Validation Tests (v1.5.5+)", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("tier-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // TIER-001: VALID_TIERS export (v1.5.5)
  describe("TIER-001: VALID_TIERS Export", () => {
    it("should export VALID_TIERS constant", () => {
      expect(VALID_TIERS).toBeDefined();
      expect(Array.isArray(VALID_TIERS)).toBe(true);
    });

    it("should include expected tier values", () => {
      expect(VALID_TIERS).toContain("production");
      expect(VALID_TIERS).toContain("internal");
      expect(VALID_TIERS).toContain("prototype");
    });

    it("should have exactly 3 tier values", () => {
      expect(VALID_TIERS).toHaveLength(3);
    });
  });

  // TIER-002: Validate tier command success
  describe("TIER-002: Validate Tier Success", () => {
    it("should pass when tier matches ruleset", () => {
      createCheckToml(
        fixtureDir,
        `
[extends]
registry = "github:example/registry"
rulesets = ["base", "typescript-internal"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "repo-metadata.yaml",
        `tier: internal
`
      );

      const result = runCm("validate tier", fixtureDir);
      expect(result.exitCode).toBe(0);
      expect(result.stdout + result.stderr).toMatch(/valid|pass/i);
    });
  });

  // TIER-003: Validate tier command failure
  describe("TIER-003: Validate Tier Failure", () => {
    it("should fail when tier does not match any ruleset", () => {
      createCheckToml(
        fixtureDir,
        `
[extends]
registry = "github:example/registry"
rulesets = ["base", "typescript-production"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "repo-metadata.yaml",
        `tier: internal
`
      );

      const result = runCm("validate tier", fixtureDir);
      expect(result.exitCode).toBe(2);
      expect(result.stdout + result.stderr).toMatch(/no ruleset|not found/i);
    });
  });

  // TIER-004: Invalid tier value
  describe("TIER-004: Invalid Tier Value", () => {
    it("should warn about invalid tier and use default", () => {
      createCheckToml(
        fixtureDir,
        `
[extends]
registry = "github:example/registry"
rulesets = ["base", "typescript-internal"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "repo-metadata.yaml",
        `tier: invalid-tier-value
`
      );

      const result = runCm("validate tier", fixtureDir);
      const output = result.stdout + result.stderr;
      // Should mention invalid tier
      expect(output).toMatch(/invalid.*tier|warning/i);
    });
  });

  // TIER-005: Missing repo-metadata.yaml (v1.5.5 improved messaging)
  describe("TIER-005: Missing Repo Metadata", () => {
    it("should use default tier when repo-metadata.yaml missing", () => {
      createCheckToml(
        fixtureDir,
        `
[extends]
registry = "github:example/registry"
rulesets = ["base", "typescript-internal"]
`
      );

      // Don't create repo-metadata.yaml

      const result = runCm("validate tier", fixtureDir);
      const output = result.stdout + result.stderr;
      // Should indicate default tier is used
      expect(output).toMatch(/default|internal|not found/i);
    });
  });

  // TIER-006: Empty repo-metadata.yaml (v1.5.5)
  describe("TIER-006: Empty Repo Metadata", () => {
    it("should handle empty repo-metadata.yaml", () => {
      createCheckToml(
        fixtureDir,
        `
[extends]
registry = "github:example/registry"
rulesets = ["base", "typescript-internal"]
`
      );

      writeFixtureFile(fixtureDir, "repo-metadata.yaml", "");

      const result = runCm("validate tier", fixtureDir);
      const output = result.stdout + result.stderr;
      // Should use default tier
      expect(output).toMatch(/default|empty/i);
    });
  });

  // TIER-007: repo-metadata.yaml without tier key
  describe("TIER-007: Metadata Without Tier", () => {
    it("should use default tier when tier key missing", () => {
      createCheckToml(
        fixtureDir,
        `
[extends]
registry = "github:example/registry"
rulesets = ["base", "typescript-internal"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "repo-metadata.yaml",
        `name: my-project
description: A project
`
      );

      const result = runCm("validate tier", fixtureDir);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/default|not specified/i);
    });
  });

  // TIER-008: No extends configured
  describe("TIER-008: No Extends Configured", () => {
    it("should pass when no extends section exists", () => {
      createCheckToml(
        fixtureDir,
        `
[code.linting.eslint]
enabled = true
`
      );

      writeFixtureFile(
        fixtureDir,
        "repo-metadata.yaml",
        `tier: production
`
      );

      const result = runCm("validate tier", fixtureDir);
      expect(result.exitCode).toBe(0);
      // No tier constraint when no extends
    });
  });

  // TIER-009: Empty rulesets array (v1.5.5)
  describe("TIER-009: Empty Rulesets Array", () => {
    it("should warn when extends has empty rulesets", () => {
      createCheckToml(
        fixtureDir,
        `
[extends]
registry = "github:example/registry"
rulesets = []
`
      );

      writeFixtureFile(
        fixtureDir,
        "repo-metadata.yaml",
        `tier: internal
`
      );

      const result = runCm("validate tier", fixtureDir);
      const output = result.stdout + result.stderr;
      // Should warn about empty rulesets
      expect(output).toMatch(/empty|no rulesets|warning/i);
    });
  });

  // TIER-010: JSON output format
  describe("TIER-010: JSON Output Format", () => {
    it("should output JSON when requested", () => {
      createCheckToml(
        fixtureDir,
        `
[extends]
registry = "github:example/registry"
rulesets = ["base", "typescript-internal"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "repo-metadata.yaml",
        `tier: internal
`
      );

      const result = runCm("validate tier -f json", fixtureDir);
      expect(() => JSON.parse(result.stdout)).not.toThrow();
      const parsed = JSON.parse(result.stdout);
      expect(parsed).toHaveProperty("valid");
      expect(parsed).toHaveProperty("tier");
    });
  });

  // TIER-011: Invalid YAML in repo-metadata.yaml (v1.5.5)
  describe("TIER-011: Invalid YAML in Metadata", () => {
    it("should handle invalid YAML gracefully", () => {
      createCheckToml(
        fixtureDir,
        `
[extends]
registry = "github:example/registry"
rulesets = ["base", "typescript-internal"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "repo-metadata.yaml",
        `tier: [invalid yaml
no close bracket
`
      );

      const result = runCm("validate tier", fixtureDir);
      const output = result.stdout + result.stderr;
      // Should mention parse error
      expect(output).toMatch(/parse.*error|default|warning/i);
    });
  });

  // TIER-012: repo-metadata.yaml at git root (v1.5.5 fix)
  describe("TIER-012: Metadata at Git Root", () => {
    it("should find repo-metadata.yaml from git root", () => {
      // This test validates the v1.5.5 fix for finding repo-metadata.yaml
      // from git root instead of config directory
      createCheckToml(
        fixtureDir,
        `
[extends]
registry = "github:example/registry"
rulesets = ["base", "typescript-internal"]
`
      );

      // Create repo-metadata.yaml in fixture root
      writeFixtureFile(
        fixtureDir,
        "repo-metadata.yaml",
        `tier: internal
`
      );

      const result = runCm("validate tier", fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // TIER-013: Production tier validation
  describe("TIER-013: Production Tier", () => {
    it("should validate production tier correctly", () => {
      createCheckToml(
        fixtureDir,
        `
[extends]
registry = "github:example/registry"
rulesets = ["base", "strict-production"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "repo-metadata.yaml",
        `tier: production
`
      );

      const result = runCm("validate tier", fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // TIER-014: Prototype tier validation
  describe("TIER-014: Prototype Tier", () => {
    it("should validate prototype tier correctly", () => {
      createCheckToml(
        fixtureDir,
        `
[extends]
registry = "github:example/registry"
rulesets = ["base", "minimal-prototype"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "repo-metadata.yaml",
        `tier: prototype
`
      );

      const result = runCm("validate tier", fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // TIER-015: Multiple matching rulesets
  describe("TIER-015: Multiple Matching Rulesets", () => {
    it("should pass when multiple rulesets match tier", () => {
      createCheckToml(
        fixtureDir,
        `
[extends]
registry = "github:example/registry"
rulesets = ["base-internal", "typescript-internal", "security-internal"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "repo-metadata.yaml",
        `tier: internal
`
      );

      const result = runCm("validate tier", fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });
});
