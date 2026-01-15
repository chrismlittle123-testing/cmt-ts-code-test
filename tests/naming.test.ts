import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createCheckToml,
  runCodeCheck,
  runCodeAudit,
} from "./utils/test-helpers";

describe("Naming Conventions Tests", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("naming-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // NAM-001: Kebab-case Files - Pass
  describe("NAM-001: Kebab-case Files - Pass", () => {
    it("should pass with kebab-case file names", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts", "tsx"]
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      writeFixtureFile(fixtureDir, "src/my-component.ts", `export const x = 1;\n`);
      writeFixtureFile(fixtureDir, "src/utils/helper-function.ts", `export const y = 2;\n`);

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-002: Kebab-case Files - Fail
  describe("NAM-002: Kebab-case Files - Fail", () => {
    it("should fail with PascalCase file names when kebab-case is required", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts", "tsx"]
file_case = "kebab-case"
`
      );

      writeFixtureFile(fixtureDir, "src/MyComponent.ts", `export const x = 1;\n`);

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/MyComponent|kebab/i);
    });
  });

  // NAM-003: Snake_case Files - Pass
  describe("NAM-003: Snake_case Files - Pass", () => {
    it("should pass with snake_case file names", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts"]
file_case = "snake_case"
`
      );

      writeFixtureFile(fixtureDir, "src/my_module.ts", `export const x = 1;\n`);

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-004: PascalCase Files - Pass
  describe("NAM-004: PascalCase Files - Pass", () => {
    it("should pass with PascalCase file names", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["tsx"]
file_case = "PascalCase"
`
      );

      writeFixtureFile(fixtureDir, "src/MyComponent.tsx", `export const x = 1;\n`);

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-005: camelCase Files - Pass
  describe("NAM-005: camelCase Files - Pass", () => {
    it("should pass with camelCase file names", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["js"]
file_case = "camelCase"
`
      );

      writeFixtureFile(fixtureDir, "src/myFile.js", `export const x = 1;\n`);

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-006: Folder Naming - Pass
  describe("NAM-006: Folder Naming - Pass", () => {
    it("should pass with correct folder naming", () => {
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

      writeFixtureFile(
        fixtureDir,
        "src/components/user-profile/index.ts",
        `export const x = 1;\n`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-007: Folder Naming - Fail
  describe("NAM-007: Folder Naming - Fail", () => {
    it("should fail with incorrect folder naming", () => {
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

      writeFixtureFile(
        fixtureDir,
        "src/Components/UserProfile/index.ts",
        `export const x = 1;\n`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/Components|UserProfile/i);
    });
  });

  // NAM-008: Exclude Pattern
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
exclude = ["tests/**"]
`
      );

      // Source files in kebab-case
      writeFixtureFile(fixtureDir, "src/my-file.ts", `export const x = 1;\n`);
      // Test files in PascalCase (should be excluded)
      writeFixtureFile(fixtureDir, "tests/MyTest.ts", `export const x = 1;\n`);

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-009: Multiple Rules
  describe("NAM-009: Multiple Rules", () => {
    it("should apply different rules to different extensions", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts", "tsx"]
file_case = "kebab-case"

[[code.naming.rules]]
extensions = ["js"]
file_case = "camelCase"
`
      );

      // TypeScript files in kebab-case
      writeFixtureFile(fixtureDir, "src/my-component.ts", `export const x = 1;\n`);
      // JavaScript files in camelCase
      writeFixtureFile(fixtureDir, "src/myScript.js", `export const y = 2;\n`);

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-010: Dynamic Routes - Next.js [id]
  describe("NAM-010: Dynamic Routes - Next.js [id]", () => {
    it("should allow dynamic route folders [id]", () => {
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

      writeFixtureFile(fixtureDir, "app/users/[id]/page.tsx", `export default function Page() {}\n`);

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-011: Dynamic Routes - Catch-all [...slug]
  describe("NAM-011: Dynamic Routes - Catch-all [...slug]", () => {
    it("should allow catch-all route folders [...slug]", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["tsx"]
folder_case = "kebab-case"
allow_dynamic_routes = true
`
      );

      writeFixtureFile(
        fixtureDir,
        "app/docs/[...slug]/page.tsx",
        `export default function Page() {}\n`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-012: Dynamic Routes - Optional [[...slug]]
  describe("NAM-012: Dynamic Routes - Optional [[...slug]]", () => {
    it("should allow optional catch-all route folders [[...slug]]", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["tsx"]
folder_case = "kebab-case"
allow_dynamic_routes = true
`
      );

      writeFixtureFile(
        fixtureDir,
        "app/shop/[[...slug]]/page.tsx",
        `export default function Page() {}\n`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-013: Dynamic Routes - Route Group (group)
  describe("NAM-013: Dynamic Routes - Route Group (group)", () => {
    it("should allow route group folders (marketing)", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["tsx"]
folder_case = "kebab-case"
allow_dynamic_routes = true
`
      );

      writeFixtureFile(
        fixtureDir,
        "app/(marketing)/about/page.tsx",
        `export default function Page() {}\n`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-014: Dynamic Routes - Parallel @slot
  describe("NAM-014: Dynamic Routes - Parallel @slot", () => {
    it("should allow parallel route folders @sidebar", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["tsx"]
folder_case = "kebab-case"
allow_dynamic_routes = true
`
      );

      writeFixtureFile(
        fixtureDir,
        "app/@sidebar/page.tsx",
        `export default function Sidebar() {}\n`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-015: Numeric File Names
  describe("NAM-015: Numeric File Names", () => {
    it("should allow numeric file names", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["tsx"]
file_case = "kebab-case"
`
      );

      writeFixtureFile(fixtureDir, "app/404.tsx", `export default function NotFound() {}\n`);
      writeFixtureFile(fixtureDir, "app/500.tsx", `export default function ServerError() {}\n`);

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-016: Special Files Skipped
  describe("NAM-016: Special Files Skipped", () => {
    it("should skip special files starting with underscore", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["py"]
file_case = "snake_case"
`
      );

      // Python special file
      writeFixtureFile(fixtureDir, "src/__init__.py", `# init file\n`);

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-017: Multi-extension Files
  describe("NAM-017: Multi-extension Files", () => {
    it("should validate base name of multi-extension files", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts"]
file_case = "kebab-case"
`
      );

      // Multi-extension files
      writeFixtureFile(fixtureDir, "src/my-component.test.ts", `export const x = 1;\n`);
      writeFixtureFile(fixtureDir, "src/helper.spec.ts", `export const y = 2;\n`);

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-018: Nested Folder Validation
  describe("NAM-018: Nested Folder Validation", () => {
    it("should validate all folder levels in deep nesting", () => {
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

      writeFixtureFile(
        fixtureDir,
        "src/features/user/profile/settings/index.ts",
        `export const x = 1;\n`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-019: Default Excludes
  describe("NAM-019: Default Excludes", () => {
    it("should automatically exclude node_modules, .git, dist", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts", "js"]
file_case = "kebab-case"
`
      );

      // Good source file
      writeFixtureFile(fixtureDir, "src/my-file.ts", `export const x = 1;\n`);
      // Files in default excluded directories (should be ignored)
      writeFixtureFile(
        fixtureDir,
        "node_modules/some-pkg/BadName.js",
        `module.exports = {};\n`
      );
      writeFixtureFile(fixtureDir, "dist/BadName.js", `export const x = 1;\n`);

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-020: Audit - Valid Config
  describe("NAM-020: Audit - Valid Config", () => {
    it("should pass audit with valid naming config", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts", "tsx"]
file_case = "kebab-case"
folder_case = "kebab-case"
`
      );

      const result = runCodeAudit(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // NAM-021: Audit - Empty Extensions
  describe("NAM-021: Audit - Empty Extensions", () => {
    it("should fail audit with empty extensions array", () => {
      createCheckToml(
        fixtureDir,
        `
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = []
file_case = "kebab-case"
`
      );

      const result = runCodeAudit(fixtureDir);
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout + result.stderr).toContain("extension");
    });
  });
});
