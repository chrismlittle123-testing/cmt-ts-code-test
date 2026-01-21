import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createCheckToml,
  runCodeCheck,
  runCm,
} from "./utils/test-helpers";

describe("Naming Conventions Tests (v1.5.0+)", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("naming-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // NAM-001: kebab-case file naming - pass
  describe("NAM-001: kebab-case File Naming Pass", () => {
    it("should pass for kebab-case file names", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts"]
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      writeFixtureFile(fixtureDir, "src/my-component.ts", "export const x = 1;");
      writeFixtureFile(fixtureDir, "src/utils/string-helpers.ts", "export const y = 2;");

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-002: kebab-case file naming - fail
  describe("NAM-002: kebab-case File Naming Fail", () => {
    it("should fail for non-kebab-case file names", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts"]
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      writeFixtureFile(fixtureDir, "src/MyComponent.ts", "export const x = 1;");

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/MyComponent.*kebab-case/i);
    });
  });

  // NAM-003: snake_case file naming
  describe("NAM-003: snake_case File Naming", () => {
    it("should validate snake_case file names", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["py"]
file_case = "snake_case"
folder_case = "snake_case"
`
      );

      writeFixtureFile(fixtureDir, "src/my_module.py", "x = 1");
      writeFixtureFile(fixtureDir, "src/utils/string_helpers.py", "y = 2");

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-004: camelCase file naming
  describe("NAM-004: camelCase File Naming", () => {
    it("should validate camelCase file names", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts"]
file_case = "camelCase"
folder_case = "camelCase"
`
      );

      writeFixtureFile(fixtureDir, "src/myComponent.ts", "export const x = 1;");

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-005: PascalCase file naming
  describe("NAM-005: PascalCase File Naming", () => {
    it("should validate PascalCase file names", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts", "tsx"]
file_case = "PascalCase"
folder_case = "PascalCase"
`
      );

      writeFixtureFile(fixtureDir, "src/MyComponent.tsx", "export const x = 1;");
      writeFixtureFile(fixtureDir, "src/Utils/StringHelpers.ts", "export const y = 2;");

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-006: Folder naming validation
  describe("NAM-006: Folder Naming Validation", () => {
    it("should validate folder names", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts"]
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      writeFixtureFile(fixtureDir, "src/MyFolder/component.ts", "export const x = 1;");

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/MyFolder.*kebab-case/i);
    });
  });

  // NAM-007: Multiple naming rules for different extensions
  describe("NAM-007: Multiple Naming Rules", () => {
    it("should apply different rules to different extensions", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts", "tsx"]
file_case = "kebab-case"
folder_case = "kebab-case"

[[code.naming.rules]]
extensions = ["py"]
file_case = "snake_case"
folder_case = "snake_case"
`
      );

      writeFixtureFile(fixtureDir, "src/my-component.ts", "export const x = 1;");
      writeFixtureFile(fixtureDir, "scripts/my_script.py", "x = 1");

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-008: Exclude pattern
  describe("NAM-008: Exclude Pattern", () => {
    it("should exclude files matching exclude pattern", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts"]
file_case = "kebab-case"
folder_case = "kebab-case"
exclude = ["**/generated/**"]
`
      );

      writeFixtureFile(fixtureDir, "src/my-component.ts", "export const x = 1;");
      writeFixtureFile(fixtureDir, "generated/MyGenerated.ts", "export const y = 2;");

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-009: Dynamic route folders (Next.js style)
  describe("NAM-009: Dynamic Route Folders", () => {
    it("should allow dynamic route folders when enabled", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["tsx"]
file_case = "kebab-case"
folder_case = "kebab-case"
allow_dynamic_routes = true
`
      );

      writeFixtureFile(fixtureDir, "app/[id]/page.tsx", "export default function Page() {}");
      writeFixtureFile(fixtureDir, "app/[...slug]/page.tsx", "export default function Page() {}");
      writeFixtureFile(fixtureDir, "app/[[...optional]]/page.tsx", "export default function Page() {}");
      writeFixtureFile(fixtureDir, "app/(group)/page.tsx", "export default function Page() {}");
      writeFixtureFile(fixtureDir, "app/@parallel/page.tsx", "export default function Page() {}");

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-010: Dynamic route content validation
  describe("NAM-010: Dynamic Route Content Validation", () => {
    it("should validate content inside dynamic route brackets", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["tsx"]
file_case = "kebab-case"
folder_case = "kebab-case"
allow_dynamic_routes = true
`
      );

      // The content inside brackets should match the case convention
      writeFixtureFile(fixtureDir, "app/[user-id]/page.tsx", "export default function Page() {}");

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-011: Numeric file names (like 404.tsx)
  describe("NAM-011: Numeric File Names", () => {
    it("should allow pure numeric file names", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["tsx"]
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      writeFixtureFile(fixtureDir, "pages/404.tsx", "export default function Page() {}");
      writeFixtureFile(fixtureDir, "pages/500.tsx", "export default function Page() {}");

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-012: Special files (underscore prefix)
  describe("NAM-012: Special Files Underscore Prefix", () => {
    it("should skip files starting with underscore", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["py"]
file_case = "snake_case"
folder_case = "snake_case"
`
      );

      writeFixtureFile(fixtureDir, "src/__init__.py", "");
      writeFixtureFile(fixtureDir, "src/__main__.py", "print('main')");
      writeFixtureFile(fixtureDir, "src/my_module.py", "x = 1");

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-013: Test file extensions like .test.ts
  describe("NAM-013: Test File Extensions", () => {
    it("should handle multi-part extensions correctly", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts"]
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      writeFixtureFile(fixtureDir, "src/my-utils.test.ts", "test('it works', () => {});");
      writeFixtureFile(fixtureDir, "src/my-utils.spec.ts", "test('it works', () => {});");

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-014: Disabled naming check
  describe("NAM-014: Disabled Naming Check", () => {
    it("should skip check when disabled", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = false

[[code.naming.rules]]
extensions = ["ts"]
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      writeFixtureFile(fixtureDir, "src/MyBadlyNamedFile.ts", "export const x = 1;");

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-015: Empty rules array
  describe("NAM-015: Empty Rules Array", () => {
    it("should pass when no rules defined", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true
`
      );

      writeFixtureFile(fixtureDir, "src/AnyNaming.ts", "export const x = 1;");

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-016: Default exclude directories
  describe("NAM-016: Default Exclude Directories", () => {
    it("should exclude node_modules, dist, etc. by default", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts"]
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      writeFixtureFile(fixtureDir, "src/my-file.ts", "export const x = 1;");
      writeFixtureFile(fixtureDir, "node_modules/BadName.ts", "export const y = 2;");
      writeFixtureFile(fixtureDir, "dist/BadName.ts", "export const z = 3;");

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-017: Duplicate extensions in same rule should be deduplicated
  describe("NAM-017: Duplicate Extensions in Same Rule", () => {
    it("should reject duplicate extensions within single rule", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts", "ts", "tsx"]
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      writeFixtureFile(fixtureDir, "src/my-file.ts", "export const x = 1;");

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(2);
      expect(result.stdout + result.stderr).toMatch(/duplicate/i);
    });
  });

  // NAM-018: Duplicate extensions across rules (v1.5.6)
  describe("NAM-018: Duplicate Extensions Across Rules", () => {
    it("should reject duplicate extensions across different rules", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts", "tsx"]
file_case = "kebab-case"
folder_case = "kebab-case"

[[code.naming.rules]]
extensions = ["ts", "js"]
file_case = "snake_case"
folder_case = "snake_case"
`
      );

      writeFixtureFile(fixtureDir, "src/my-file.ts", "export const x = 1;");

      const result = runCm("validate config", fixtureDir);
      expect(result.exitCode).toBe(2);
      expect(result.stdout + result.stderr).toMatch(/ts.*multiple.*rules|extension.*appears/i);
    });
  });

  // NAM-019: Audit with empty extensions array
  describe("NAM-019: Audit Empty Extensions", () => {
    it("should fail audit with empty extensions array", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = []
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      const result = runCm("code audit", fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/at least one extension/i);
    });
  });

  // NAM-020: Nested folder path validation
  describe("NAM-020: Nested Folder Path Validation", () => {
    it("should validate all folders in path", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts"]
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      writeFixtureFile(fixtureDir, "src/good-folder/BadFolder/my-file.ts", "export const x = 1;");

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/BadFolder.*kebab-case/i);
    });
  });
});
