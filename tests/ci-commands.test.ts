import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFixtureDir,
  cleanupFixture,
  writeFixtureFile,
  createCheckToml,
  runCm,
} from "./utils/test-helpers";

function runProcessCheck(cwd: string, args = "") {
  return runCm(`process check ${args}`, cwd);
}

describe("CI Commands Enforcement Tests (v1.6.0)", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = createFixtureDir("ci-commands-");
  });

  afterEach(() => {
    cleanupFixture(fixtureDir);
  });

  // Helper to create a GitHub workflow
  function createWorkflow(name: string, content: string) {
    writeFixtureFile(fixtureDir, `.github/workflows/${name}`, content);
  }

  // CI-001: Workflow-level command - found unconditionally
  describe("CI-001: Workflow-Level Command Found Unconditionally", () => {
    it("should pass when required command exists unconditionally", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // CI-002: Workflow-level command - not found
  describe("CI-002: Workflow-Level Command Not Found", () => {
    it("should fail when required command is missing", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run build
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/npm test.*not found/i);
    });
  });

  // CI-003: Workflow-level command - conditional job
  describe("CI-003: Workflow-Level Command With Conditional Job", () => {
    it("should fail when command is in conditional job", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - run: npm test
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/condition|conditional/i);
    });
  });

  // CI-004: Workflow-level command - conditional step
  describe("CI-004: Workflow-Level Command With Conditional Step", () => {
    it("should fail when command is in conditional step", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
        if: github.event.pull_request.draft == false
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/condition|conditional/i);
    });
  });

  // CI-005: Workflow-level command - commented out
  describe("CI-005: Workflow-Level Command Commented Out", () => {
    it("should fail when command is commented out", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          npm run build
          # npm test
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/commented.*out/i);
    });
  });

  // CI-006: Job-level command - found unconditionally
  describe("CI-006: Job-Level Command Found Unconditionally", () => {
    it("should pass when command exists in specified job unconditionally", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands."ci.yml"]
test = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // CI-007: Job-level command - job not found
  describe("CI-007: Job-Level Command Job Not Found", () => {
    it("should fail when specified job does not exist", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands."ci.yml"]
test = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run build
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/job.*'test'.*not found/i);
    });
  });

  // CI-008: Job-level command - command not in specified job
  describe("CI-008: Job-Level Command Not In Specified Job", () => {
    it("should fail when command is in different job", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands."ci.yml"]
lint = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run lint
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/npm test.*not found.*lint/i);
    });
  });

  // CI-009: Substring matching
  describe("CI-009: Substring Matching", () => {
    it("should find command using substring matching", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["cm code check"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx cm code check --format json
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // CI-010: Workflow doesn't trigger on PR to main
  describe("CI-010: Workflow Not Triggering on PR to Main", () => {
    it("should fail when workflow doesn't trigger on pull_request to main", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  push:
    branches: [develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/pull_request.*main|master/i);
    });
  });

  // CI-011: Multiple commands required
  describe("CI-011: Multiple Commands Required", () => {
    it("should check all required commands", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test", "npm run lint", "npm run build"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
      - run: npm run lint
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/npm run build.*not found/i);
    });
  });

  // CI-012: Multi-line run command
  describe("CI-012: Multi-Line Run Command", () => {
    it("should find command in multi-line run script", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: |
          echo "Starting tests"
          npm test
          echo "Tests complete"
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // CI-013: Always() condition should be considered unconditional
  describe("CI-013: always() Condition", () => {
    it("should treat always() as unconditional", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
        if: always()
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // CI-014: success() condition should be considered unconditional
  describe("CI-014: success() Condition", () => {
    it("should treat success() as unconditional", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
        if: success()
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // CI-015: true condition should be considered unconditional
  describe("CI-015: 'true' Condition", () => {
    it("should treat 'true' as unconditional", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
        if: true
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // CI-016: Reusable workflow job
  describe("CI-016: Reusable Workflow Job", () => {
    it("should report error for reusable workflow jobs", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands."ci.yml"]
test = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  test:
    uses: ./.github/workflows/reusable-test.yml
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/reusable workflow/i);
    });
  });

  // CI-017: Invalid YAML in workflow
  describe("CI-017: Invalid YAML in Workflow", () => {
    it("should report error for invalid YAML", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on: [
  invalid yaml content
  missing close bracket
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/invalid.*yaml/i);
    });
  });

  // CI-018: Workflow triggers on push to main (should be valid)
  describe("CI-018: Workflow Triggers on Push to Main", () => {
    it("should accept push to main as valid trigger", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // CI-019: Missing .github/workflows directory
  describe("CI-019: Missing Workflows Directory", () => {
    it("should fail when .github/workflows directory missing", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toMatch(/workflows.*directory.*not found/i);
    });
  });

  // CI-020: Disabled CI check
  describe("CI-020: Disabled CI Check", () => {
    it("should skip check when disabled", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = false

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      // Don't create workflows directory

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // CI-021: pull_request_target trigger
  describe("CI-021: pull_request_target Trigger", () => {
    it("should accept pull_request_target as valid trigger", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  pull_request_target:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // CI-022: Wildcard branch matching
  describe("CI-022: Wildcard Branch Matching", () => {
    it("should accept wildcard branches pattern", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on:
  pull_request:
    branches: ["*"]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // CI-023: No branches filter (triggers on all branches)
  describe("CI-023: No Branches Filter", () => {
    it("should accept when no branches filter is specified", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on: pull_request

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // CI-024: String trigger format
  describe("CI-024: String Trigger Format", () => {
    it("should accept string trigger format", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on: push

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });

  // CI-025: Array trigger format
  describe("CI-025: Array Trigger Format", () => {
    it("should accept array trigger format", () => {
      createCheckToml(
        fixtureDir,
        `
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
`
      );

      createWorkflow(
        "ci.yml",
        `
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
`
      );

      const result = runProcessCheck(fixtureDir);
      expect(result.exitCode).toBe(0);
    });
  });
});
