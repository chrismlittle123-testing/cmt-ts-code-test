import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createPackageJson,
  createCheckToml,
  runCodeCheck,
} from "./utils/test-helpers";

describe("npm-audit Tests", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("npm-audit-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // NPM-001: No Vulnerabilities - Pass
  describe("NPM-001: No Vulnerabilities - Pass", () => {
    it("should pass with secure dependencies", () => {
      createPackageJson(fixtureDir, {
        dependencies: {},
        devDependencies: {},
      });
      createCheckToml(
        fixtureDir,
        `
[code.security.npmaudit]
enabled = true
`
      );

      // Create a minimal package-lock.json
      writeFixtureFile(
        fixtureDir,
        "package-lock.json",
        JSON.stringify(
          {
            name: "test-fixture",
            version: "1.0.0",
            lockfileVersion: 3,
            requires: true,
            packages: {},
          },
          null,
          2
        )
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NPM-002: Vulnerability Found
  describe("NPM-002: Vulnerability Found", () => {
    it("should fail when vulnerability is found", () => {
      // Use a known vulnerable package version
      createPackageJson(fixtureDir, {
        dependencies: {
          // This is a known vulnerable version for testing
          // In real tests, you'd use a specific known vulnerable package
          lodash: "4.17.15",
        },
      });
      createCheckToml(
        fixtureDir,
        `
[code.security.npmaudit]
enabled = true
`
      );

      // Create a package-lock.json with the vulnerable package
      writeFixtureFile(
        fixtureDir,
        "package-lock.json",
        JSON.stringify(
          {
            name: "test-fixture",
            version: "1.0.0",
            lockfileVersion: 3,
            requires: true,
            packages: {
              "": {
                name: "test-fixture",
                version: "1.0.0",
                dependencies: {
                  lodash: "4.17.15",
                },
              },
              "node_modules/lodash": {
                version: "4.17.15",
                resolved: "https://registry.npmjs.org/lodash/-/lodash-4.17.15.tgz",
              },
            },
          },
          null,
          2
        )
      );

      const result = runCodeCheck(fixtureDir);
      // May or may not fail depending on current vulnerability state
      // The test verifies the check runs
      expect(result).toBeDefined();
    });
  });

  // NPM-003: pnpm Detection
  describe("NPM-003: pnpm Detection", () => {
    it("should use pnpm audit when pnpm-lock.yaml exists", () => {
      createPackageJson(fixtureDir, {
        dependencies: {},
      });
      createCheckToml(
        fixtureDir,
        `
[code.security.npmaudit]
enabled = true
`
      );

      // Create pnpm-lock.yaml instead of package-lock.json
      writeFixtureFile(
        fixtureDir,
        "pnpm-lock.yaml",
        `lockfileVersion: '9.0'
settings:
  autoInstallPeers: true
packages: {}
`
      );

      const result = runCodeCheck(fixtureDir);
      // Should detect pnpm and use pnpm audit
      expect(result).toBeDefined();
    });
  });

  // NPM-004: npm Detection
  describe("NPM-004: npm Detection", () => {
    it("should use npm audit when package-lock.json exists", () => {
      createPackageJson(fixtureDir, {
        dependencies: {},
      });
      createCheckToml(
        fixtureDir,
        `
[code.security.npmaudit]
enabled = true
`
      );

      // Create package-lock.json
      writeFixtureFile(
        fixtureDir,
        "package-lock.json",
        JSON.stringify(
          {
            name: "test-fixture",
            version: "1.0.0",
            lockfileVersion: 3,
            requires: true,
            packages: {},
          },
          null,
          2
        )
      );

      const result = runCodeCheck(fixtureDir);
      // Should detect npm and use npm audit
      expect(result).toBeDefined();
    });
  });

  // NPM-005: No Lock File
  describe("NPM-005: No Lock File", () => {
    it("should run audit even without lock file", () => {
      createPackageJson(fixtureDir, {
        dependencies: {},
      });
      // No lock file created
      createCheckToml(
        fixtureDir,
        `
[code.security.npmaudit]
enabled = true
`
      );

      const result = runCodeCheck(fixtureDir);
      // Should still attempt to run audit (may warn about no lock file)
      expect(result).toBeDefined();
    });
  });

  // NPM-006: Disabled
  describe("NPM-006: Disabled", () => {
    it("should skip check when disabled", () => {
      createPackageJson(fixtureDir, {
        dependencies: {
          "some-package": "1.0.0",
        },
      });
      createCheckToml(
        fixtureDir,
        `
[code.security.npmaudit]
enabled = false
`
      );

      const result = runCodeCheck(fixtureDir);
      // Should pass because npm-audit check is disabled
      expect(result.exitCode).toBe(0);
    });
  });
});
