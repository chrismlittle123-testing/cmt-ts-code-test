import { execSync, ExecSyncOptions } from "child_process";
import { mkdirSync, writeFileSync, rmSync, existsSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

/**
 * Result of running a cm command
 */
export interface CmResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Run a check-my-toolkit command
 */
export function runCm(
  args: string,
  cwd: string,
  options?: ExecSyncOptions
): CmResult {
  try {
    const stdout = execSync(`cm ${args}`, {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      ...options,
    });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as {
      stdout?: string;
      stderr?: string;
      status?: number;
    };
    return {
      stdout: execError.stdout || "",
      stderr: execError.stderr || "",
      exitCode: execError.status || 1,
    };
  }
}

/**
 * Run cm code check
 */
export function runCodeCheck(cwd: string, args = ""): CmResult {
  return runCm(`code check ${args}`, cwd);
}

/**
 * Run cm code audit
 */
export function runCodeAudit(cwd: string, args = ""): CmResult {
  return runCm(`code audit ${args}`, cwd);
}

/**
 * Create a temporary test fixture directory
 */
export function createFixtureDir(prefix = "cmt-test-"): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

/**
 * Clean up a fixture directory
 */
export function cleanupFixture(dir: string): void {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Write a file to a fixture directory
 */
export function writeFixtureFile(
  fixtureDir: string,
  relativePath: string,
  content: string
): void {
  const fullPath = join(fixtureDir, relativePath);
  const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
  if (dir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(fullPath, content);
}

/**
 * Create a basic package.json
 */
export function createPackageJson(
  fixtureDir: string,
  options: {
    name?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  } = {}
): void {
  const packageJson = {
    name: options.name || "test-fixture",
    version: "1.0.0",
    dependencies: options.dependencies || {},
    devDependencies: options.devDependencies || {},
  };
  writeFixtureFile(fixtureDir, "package.json", JSON.stringify(packageJson, null, 2));
}

/**
 * Create a basic tsconfig.json
 */
export function createTsConfig(
  fixtureDir: string,
  compilerOptions: Record<string, unknown> = {}
): void {
  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      ...compilerOptions,
    },
    include: ["src/**/*"],
  };
  writeFixtureFile(fixtureDir, "tsconfig.json", JSON.stringify(tsconfig, null, 2));
}

/**
 * Create a check.toml configuration file
 */
export function createCheckToml(fixtureDir: string, content: string): void {
  writeFixtureFile(fixtureDir, "check.toml", content);
}

/**
 * Create an ESLint flat config
 */
export function createEslintConfig(
  fixtureDir: string,
  rules: Record<string, unknown> = {}
): void {
  const config = `export default [
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: ${JSON.stringify(rules, null, 6).replace(/\n/g, "\n    ")}
  }
];`;
  writeFixtureFile(fixtureDir, "eslint.config.js", config);
}

/**
 * Create a Prettier config
 */
export function createPrettierConfig(
  fixtureDir: string,
  options: Record<string, unknown> = {}
): void {
  const config = {
    semi: true,
    singleQuote: false,
    tabWidth: 2,
    ...options,
  };
  writeFixtureFile(fixtureDir, ".prettierrc", JSON.stringify(config, null, 2));
}

/**
 * Assert that a result contains an expected string
 */
export function assertContains(result: CmResult, expected: string): void {
  const combined = result.stdout + result.stderr;
  if (!combined.includes(expected)) {
    throw new Error(
      `Expected output to contain "${expected}"\nActual output:\n${combined}`
    );
  }
}

/**
 * Assert that a result has a specific exit code
 */
export function assertExitCode(result: CmResult, expected: number): void {
  if (result.exitCode !== expected) {
    throw new Error(
      `Expected exit code ${expected}, got ${result.exitCode}\nOutput:\n${result.stdout}\n${result.stderr}`
    );
  }
}
