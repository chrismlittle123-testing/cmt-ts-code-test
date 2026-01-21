import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createCheckToml,
  runCodeCheck,
} from "./utils/test-helpers";

describe("Block Comment Detection Tests (v1.5.6)", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("block-comments-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // BC-001: Single-line block comment with eslint-disable
  describe("BC-001: Single-line Block Comment", () => {
    it("should detect eslint-disable in /* */ comment", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `/* eslint-disable no-unused-vars */
const x = 1;
export { x };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/eslint-disable/i);
    });
  });

  // BC-002: Multi-line block comment
  describe("BC-002: Multi-line Block Comment", () => {
    it("should detect eslint-disable in multi-line block comment", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `/*
 * eslint-disable no-console
 */
console.log("test");
export {};
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/eslint-disable/i);
    });
  });

  // BC-003: @ts-ignore in block comment
  describe("BC-003: @ts-ignore in Block Comment", () => {
    it("should detect @ts-ignore in /* */ comment", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `/* @ts-ignore */
const x: number = "string";
export { x };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/@ts-ignore/i);
    });
  });

  // BC-004: prettier-ignore in block comment
  describe("BC-004: prettier-ignore in Block Comment", () => {
    it("should detect prettier-ignore in /* */ comment", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `/* prettier-ignore */
const x = {a:1,b:2,c:3};
export { x };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/prettier-ignore/i);
    });
  });

  // BC-005: Block comment spanning multiple lines with pattern on later line
  describe("BC-005: Pattern on Later Line of Block Comment", () => {
    it("should detect pattern on any line of multi-line block comment", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `/*
 * This is a comment
 * with explanation
 * eslint-disable-next-line
 */
const x = 1;
export { x };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/eslint-disable/i);
    });
  });

  // BC-006: Multiple block comments in same file
  describe("BC-006: Multiple Block Comments", () => {
    it("should detect patterns in multiple block comments", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `/* eslint-disable no-unused-vars */
const a = 1;

/* @ts-ignore */
const b: number = "string";

/* prettier-ignore */
const c = {x:1};

export { a, b, c };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/eslint-disable/i);
      expect(output).toMatch(/@ts-ignore/i);
      expect(output).toMatch(/prettier-ignore/i);
    });
  });

  // BC-007: JSDoc comment (should not be flagged unless contains pattern)
  describe("BC-007: JSDoc Comment Without Pattern", () => {
    it("should pass for JSDoc comments without disable patterns", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `/**
 * Adds two numbers together.
 * @param a - First number
 * @param b - Second number
 * @returns The sum of a and b
 */
export function add(a: number, b: number): number {
  return a + b;
}
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // BC-008: Inline block comment
  describe("BC-008: Inline Block Comment", () => {
    it("should detect inline /* eslint-disable-line */", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `const x = 1; /* eslint-disable-line no-unused-vars */
export { x };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/eslint-disable/i);
    });
  });

  // BC-009: Block comment inside string literal (should NOT be flagged)
  describe("BC-009: Pattern in String Literal", () => {
    it("should NOT flag patterns inside string literals", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `const message = "Use /* eslint-disable */ to disable rules";
export { message };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // BC-010: Pattern in template literal (should NOT be flagged)
  describe("BC-010: Pattern in Template Literal", () => {
    it("should NOT flag patterns inside template literals", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        "const message = `Use /* eslint-disable */ to disable`;\nexport { message };\n"
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // BC-011: Mix of line and block comments
  describe("BC-011: Mix of Line and Block Comments", () => {
    it("should detect patterns in both line and block comments", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `// eslint-disable-next-line
const a = 1;

/* @ts-ignore */
const b: number = "string";

export { a, b };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/eslint-disable/i);
      expect(output).toMatch(/@ts-ignore/i);
    });
  });

  // BC-012: Block comment that starts and ends on same line with text before/after
  describe("BC-012: Surrounded Block Comment", () => {
    it("should detect pattern in block comment surrounded by code", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `const x = 1 /* eslint-disable-line */ + 2;
export { x };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/eslint-disable/i);
    });
  });

  // BC-013: Block comment ending with pattern continuation
  describe("BC-013: Block Comment State Tracking", () => {
    it("should properly track block comment state across lines", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `/*
eslint-disable
*/
const x = 1;
export { x };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/eslint-disable/i);
    });
  });

  // BC-014: JavaScript file block comments
  describe("BC-014: JavaScript File Block Comments", () => {
    it("should detect block comments in .js files", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["js"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.js",
        `/* eslint-disable no-console */
console.log("test");
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/eslint-disable/i);
    });
  });

  // BC-015: JSX file block comments
  describe("BC-015: JSX File Block Comments", () => {
    it("should detect block comments in .jsx files", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["jsx"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/App.jsx",
        `/* eslint-disable react/prop-types */
function App(props) {
  return <div>{props.name}</div>;
}
export default App;
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/eslint-disable/i);
    });
  });

  // BC-016: TSX file block comments
  describe("BC-016: TSX File Block Comments", () => {
    it("should detect block comments in .tsx files", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["tsx"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/App.tsx",
        `/* eslint-disable @typescript-eslint/no-explicit-any */
interface Props {
  data: any;
}
export function App(props: Props) {
  return <div>{props.data}</div>;
}
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/eslint-disable/i);
    });
  });

  // BC-017: Nested block comments (edge case - not valid JS but testing parser resilience)
  describe("BC-017: Complex String Escaping", () => {
    it("should handle strings with escaped quotes correctly", () => {
      createCheckToml(
        fixtureDir,
        `
[code.quality.disable-comments]
enabled = true
extensions = ["ts"]
`
      );

      writeFixtureFile(
        fixtureDir,
        "src/index.ts",
        `const msg = "He said \\"/* eslint-disable */\\"";
/* eslint-disable-next-line */
const x = 1;
export { msg, x };
`
      );

      const result = runCodeCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      // Should only find the real comment, not the one in string
    });
  });
});
