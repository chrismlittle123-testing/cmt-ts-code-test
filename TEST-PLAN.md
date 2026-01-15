# TypeScript CODE Domain Test Plan

Complete test coverage for check-my-toolkit CODE domain features in TypeScript/JavaScript projects.

## Tools Covered

| Tool | Config Section | Command |
|------|----------------|---------|
| ESLint | `[code.linting.eslint]` | `cm code check` / `cm code audit` |
| Prettier | `[code.formatting.prettier]` | `cm code check` |
| tsc | `[code.types.tsc]` | `cm code check` / `cm code audit` |
| Knip | `[code.unused.knip]` | `cm code check` / `cm code audit` |
| npm-audit | `[code.security.npmaudit]` | `cm code check` |
| Gitleaks | `[code.security.secrets]` | `cm code check` |
| Naming | `[code.naming]` | `cm code check` / `cm code audit` |
| Disable Comments | `[code.quality.disable-comments]` | `cm code check` |
| Tests | `[code.tests]` | `cm code check` |

---

# ESLint Tests

## Configuration Options

```toml
[code.linting.eslint]
enabled = true
files = ["src/**/*.ts"]
ignore = ["**/*.test.ts"]
max-warnings = 0

[code.linting.eslint.rules]
"no-unused-vars" = "error"
"complexity" = { severity = "error", max = 10 }
```

## Test Cases

### ESL-001: Basic Linting - Pass
**Setup:** Clean TypeScript code with no violations
**Expected:** `cm code check` passes, exit code 0

### ESL-002: Basic Linting - Fail
**Setup:** Code with ESLint violation (e.g., `var x = 1;`)
**Expected:** `cm code check` fails with violation reported, exit code 1

### ESL-003: Files Pattern
**Setup:** Violations in `src/` but not matched by `files` pattern
**Config:** `files = ["lib/**/*.ts"]`
**Expected:** Violations in `src/` are ignored

### ESL-004: Ignore Pattern
**Setup:** Violations in test files
**Config:** `ignore = ["**/*.test.ts"]`
**Expected:** Test file violations are ignored

### ESL-005: Max Warnings = 0
**Setup:** Code with ESLint warnings (not errors)
**Config:** `max-warnings = 0`
**Expected:** Warnings treated as errors, check fails

### ESL-006: Max Warnings > 0
**Setup:** Code with 2 ESLint warnings
**Config:** `max-warnings = 5`
**Expected:** Check passes (warnings under limit)

### ESL-007: Config Files Detection
**Test each config file type:**
- [ ] `eslint.config.js` (flat config)
- [ ] `eslint.config.mjs`
- [ ] `eslint.config.cjs`
- [ ] `.eslintrc.js`
- [ ] `.eslintrc.json`
- [ ] `.eslintrc.yml`
- [ ] `.eslintrc.yaml`

### ESL-008: No Config - Audit Fails
**Setup:** No ESLint config file
**Expected:** `cm code audit` fails with "config not found"

### ESL-009: Rule Auditing - Severity Match
**Setup:** ESLint config with `"no-unused-vars": "warn"`
**Config:** `rules = { "no-unused-vars" = "error" }`
**Expected:** `cm code audit` fails - severity mismatch

### ESL-010: Rule Auditing - Rule Missing
**Setup:** ESLint config without `no-console` rule
**Config:** `rules = { "no-console" = "error" }`
**Expected:** `cm code audit` fails - rule not configured

### ESL-011: Rule Auditing - With Options
**Setup:** ESLint config with `"complexity": ["error", 15]`
**Config:** `rules = { "complexity" = { severity = "error", max = 10 } }`
**Expected:** `cm code audit` fails - max value mismatch

### ESL-012: Rule Auditing - Options Match
**Setup:** ESLint config with `"complexity": ["error", { max: 10 }]`
**Config:** `rules = { "complexity" = { severity = "error", max = 10 } }`
**Expected:** `cm code audit` passes

### ESL-013: ESLint Not Installed
**Setup:** Remove node_modules or use empty project
**Expected:** Check skipped with "not installed" message

### ESL-014: ESLint Parse Error
**Setup:** Invalid JavaScript/TypeScript syntax
**Expected:** Error reported, exit code 1 or 3

---

# Prettier Tests

## Configuration Options

```toml
[code.formatting.prettier]
enabled = true
```

## Test Cases

### PRT-001: Formatted Code - Pass
**Setup:** Properly formatted code
**Expected:** `cm code check` passes

### PRT-002: Unformatted Code - Fail
**Setup:** Code with inconsistent formatting (tabs vs spaces, missing semicolons)
**Expected:** `cm code check` fails with formatting violations

### PRT-003: Config Files Detection
**Test each config file type:**
- [ ] `.prettierrc`
- [ ] `.prettierrc.json`
- [ ] `.prettierrc.yml`
- [ ] `.prettierrc.yaml`
- [ ] `.prettierrc.js`
- [ ] `prettier.config.js`
- [ ] `prettier.config.mjs`

### PRT-004: Prettier Ignore
**Setup:** Unformatted code in `.prettierignore` path
**Expected:** File is skipped

### PRT-005: Prettier Not Installed
**Setup:** Project without prettier dependency
**Expected:** Check skipped with "not installed" message

### PRT-006: Disabled
**Config:** `enabled = false`
**Expected:** Prettier check skipped entirely

---

# TypeScript (tsc) Tests

## Configuration Options

```toml
[code.types.tsc]
enabled = true

[code.types.tsc.require]
strict = true
noImplicitAny = true
strictNullChecks = true
noUnusedLocals = true
noUnusedParameters = true
noImplicitReturns = true
esModuleInterop = true
skipLibCheck = true
forceConsistentCasingInFileNames = true
```

## Test Cases

### TSC-001: No Type Errors - Pass
**Setup:** Valid TypeScript code
**Expected:** `cm code check` passes

### TSC-002: Type Error - Fail
**Setup:** `const x: number = "string";`
**Expected:** `cm code check` fails with TS error

### TSC-003: Multiple Type Errors
**Setup:** Multiple type mismatches
**Expected:** All errors reported with file/line/column

### TSC-004: No tsconfig.json
**Setup:** Project without tsconfig.json
**Expected:** `cm code check` fails with "config not found"

### TSC-005: Audit - All Options Present
**Setup:** tsconfig.json with all required options set correctly
**Config:** All require options specified
**Expected:** `cm code audit` passes

### TSC-006: Audit - Missing Option
**Setup:** tsconfig.json missing `strict`
**Config:** `require = { strict = true }`
**Expected:** `cm code audit` fails - "strict: expected true, got missing"

### TSC-007: Audit - Wrong Value
**Setup:** tsconfig.json with `strict: false`
**Config:** `require = { strict = true }`
**Expected:** `cm code audit` fails - "strict: expected true, got false"

### TSC-008: Audit - Each Auditable Option
**Test each option individually:**
- [ ] `strict`
- [ ] `noImplicitAny`
- [ ] `strictNullChecks`
- [ ] `noUnusedLocals`
- [ ] `noUnusedParameters`
- [ ] `noImplicitReturns`
- [ ] `noFallthroughCasesInSwitch`
- [ ] `esModuleInterop`
- [ ] `skipLibCheck`
- [ ] `forceConsistentCasingInFileNames`

### TSC-009: tsconfig with Comments (JSONC)
**Setup:** tsconfig.json with `//` and `/* */` comments
**Expected:** Parsing succeeds, audit works

### TSC-010: tsc Not Installed
**Setup:** Project without TypeScript
**Expected:** Check skipped with "not installed" message

---

# Knip Tests

## Configuration Options

```toml
[code.unused.knip]
enabled = true
```

## Test Cases

### KNP-001: Clean Project - Pass
**Setup:** All exports and dependencies used
**Expected:** `cm code check` passes

### KNP-002: Unused File
**Setup:** `src/unused.ts` not imported anywhere
**Expected:** Violation: "Unused file"

### KNP-003: Unused Export
**Setup:** `export const unusedFunc = () => {}` never imported
**Expected:** Violation: "Unused export: unusedFunc"

### KNP-004: Unused Dependency
**Setup:** Package in dependencies but never imported
**Expected:** Violation: "Unused dependency: package-name"

### KNP-005: Unused DevDependency
**Setup:** Package in devDependencies but never used
**Expected:** Violation: "Unused devDependency: package-name"

### KNP-006: Unlisted Dependency
**Setup:** Import a package not in package.json
**Expected:** Violation: "Unlisted dependency: package-name" (severity: error)

### KNP-007: Unused Type
**Setup:** `export type UnusedType = string;` never used
**Expected:** Violation: "Unused type: UnusedType"

### KNP-008: Duplicate Export
**Setup:** Same thing exported from multiple files
**Expected:** Violation: "Duplicate export"

### KNP-009: Unresolved Import
**Setup:** Import from non-existent file
**Expected:** Violation: "Unresolved import" (severity: error)

### KNP-010: Audit - No package.json
**Setup:** Project without package.json
**Expected:** `cm code audit` fails - "package.json not found"

### KNP-011: Config Files Detection
**Test each config file type:**
- [ ] `knip.json`
- [ ] `knip.jsonc`
- [ ] `knip.js`
- [ ] `knip.ts`
- [ ] `knip.config.js`
- [ ] `knip.config.ts`

### KNP-012: Works Without Config
**Setup:** No knip config file, just package.json
**Expected:** Knip runs with defaults

---

# npm-audit Tests

## Configuration Options

```toml
[code.security.npmaudit]
enabled = true
```

## Test Cases

### NPM-001: No Vulnerabilities - Pass
**Setup:** Project with secure dependencies
**Expected:** `cm code check` passes

### NPM-002: Vulnerability Found
**Setup:** Add known vulnerable package (old version)
**Expected:** `cm code check` fails with vulnerability details

### NPM-003: pnpm Detection
**Setup:** Project with pnpm-lock.yaml
**Expected:** Uses `pnpm audit` instead of `npm audit`

### NPM-004: npm Detection
**Setup:** Project with package-lock.json
**Expected:** Uses `npm audit`

### NPM-005: No Lock File
**Setup:** package.json only, no lock file
**Expected:** Runs audit (may warn about no lock file)

### NPM-006: Disabled
**Config:** `enabled = false`
**Expected:** npm-audit check skipped

---

# Gitleaks (Secrets) Tests

## Configuration Options

```toml
[code.security.secrets]
enabled = true
```

## Test Cases

### GLK-001: No Secrets - Pass
**Setup:** Clean code without secrets
**Expected:** `cm code check` passes

### GLK-002: Hardcoded API Key
**Setup:** `const API_KEY = "sk-1234567890abcdef";`
**Expected:** `cm code check` fails with secret detection

### GLK-003: AWS Credentials
**Setup:** `AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"`
**Expected:** Secret detected

### GLK-004: Private Key
**Setup:** File containing `-----BEGIN RSA PRIVATE KEY-----`
**Expected:** Secret detected

### GLK-005: Database Connection String
**Setup:** `postgres://user:password@host:5432/db`
**Expected:** Secret detected

### GLK-006: Generic Password
**Setup:** `password = "mysecretpassword123"`
**Expected:** May or may not detect (depends on entropy)

### GLK-007: Custom Config
**Setup:** `.gitleaks.toml` with custom rules
**Expected:** Custom rules applied

### GLK-008: Gitleaks Not Installed
**Setup:** System without gitleaks binary
**Expected:** Check skipped with "not installed" message

### GLK-009: Multiple Secrets
**Setup:** Multiple secrets in different files
**Expected:** All secrets reported with file/line info

---

# Naming Conventions Tests

## Configuration Options

```toml
[code.naming]
enabled = true

[[code.naming.rules]]
extensions = ["ts", "tsx"]
file_case = "kebab-case"
folder_case = "kebab-case"
exclude = ["tests/**"]
allow_dynamic_routes = true

[[code.naming.rules]]
extensions = ["js"]
file_case = "camelCase"
folder_case = "kebab-case"
```

## Test Cases

### NAM-001: Kebab-case Files - Pass
**Setup:** `src/my-component.ts`, `src/utils/helper-function.ts`
**Expected:** `cm code check` passes

### NAM-002: Kebab-case Files - Fail
**Setup:** `src/MyComponent.ts` (PascalCase)
**Expected:** Violation: `File "MyComponent" should be kebab-case`

### NAM-003: Snake_case Files - Pass
**Setup:** Python-style `my_module.ts`
**Config:** `file_case = "snake_case"`
**Expected:** Passes

### NAM-004: PascalCase Files - Pass
**Setup:** React components `MyComponent.tsx`
**Config:** `file_case = "PascalCase"`
**Expected:** Passes

### NAM-005: camelCase Files - Pass
**Setup:** `myFile.js`
**Config:** `file_case = "camelCase"`
**Expected:** Passes

### NAM-006: Folder Naming - Pass
**Setup:** `src/components/user-profile/index.ts`
**Config:** `folder_case = "kebab-case"`
**Expected:** Passes

### NAM-007: Folder Naming - Fail
**Setup:** `src/Components/UserProfile/index.ts`
**Config:** `folder_case = "kebab-case"`
**Expected:** Violations for both folders

### NAM-008: Exclude Pattern
**Setup:** Violations in `tests/` directory
**Config:** `exclude = ["tests/**"]`
**Expected:** Test files excluded from check

### NAM-009: Multiple Rules
**Setup:** `.ts` files in kebab-case, `.js` files in camelCase
**Config:** Two separate rule blocks
**Expected:** Each extension validated by its own rule

### NAM-010: Dynamic Routes - Next.js [id]
**Setup:** Folder named `[id]` containing `page.tsx`
**Config:** `allow_dynamic_routes = true`
**Expected:** Passes (validates inner content "id")

### NAM-011: Dynamic Routes - Catch-all [...slug]
**Setup:** Folder named `[...slug]`
**Config:** `allow_dynamic_routes = true`
**Expected:** Passes

### NAM-012: Dynamic Routes - Optional [[...slug]]
**Setup:** Folder named `[[...slug]]`
**Config:** `allow_dynamic_routes = true`
**Expected:** Passes

### NAM-013: Dynamic Routes - Route Group (group)
**Setup:** Folder named `(marketing)`
**Config:** `allow_dynamic_routes = true`
**Expected:** Passes

### NAM-014: Dynamic Routes - Parallel @slot
**Setup:** Folder named `@sidebar`
**Config:** `allow_dynamic_routes = true`
**Expected:** Passes

### NAM-015: Numeric File Names
**Setup:** `404.tsx`, `500.tsx`
**Expected:** Passes (numeric names allowed)

### NAM-016: Special Files Skipped
**Setup:** Files starting with `_` like Python's `__init__.py`
**Expected:** Special files skipped

### NAM-017: Multi-extension Files
**Setup:** `my-component.test.ts`, `helper.spec.tsx`
**Expected:** Base name validated (`my-component`, `helper`)

### NAM-018: Nested Folder Validation
**Setup:** Deep nesting `src/features/user/profile/settings/index.ts`
**Expected:** All folder levels validated

### NAM-019: Default Excludes
**Setup:** Files in `node_modules/`, `.git/`, `dist/`
**Expected:** These directories automatically excluded

### NAM-020: Audit - Valid Config
**Config:** Rules with extensions
**Expected:** `cm code audit` passes

### NAM-021: Audit - Empty Extensions
**Config:** `extensions = []`
**Expected:** `cm code audit` fails - "must have at least one extension"

---

# Disable Comments Tests

## Configuration Options

```toml
[code.quality.disable-comments]
enabled = true
extensions = ["ts", "tsx", "js", "jsx"]
exclude = ["tests/**"]
```

## Test Cases

### DIS-001: No Disable Comments - Pass
**Setup:** Clean code without any disable comments
**Expected:** `cm code check` passes

### DIS-002: eslint-disable
**Setup:** `// eslint-disable-next-line`
**Expected:** Violation detected

### DIS-003: eslint-disable-line
**Setup:** `const x = 1; // eslint-disable-line`
**Expected:** Violation detected

### DIS-004: eslint-disable Block
**Setup:** `/* eslint-disable */`
**Expected:** Violation detected

### DIS-005: @ts-ignore
**Setup:** `// @ts-ignore`
**Expected:** Violation detected

### DIS-006: @ts-expect-error
**Setup:** `// @ts-expect-error`
**Expected:** Violation detected

### DIS-007: @ts-nocheck
**Setup:** `// @ts-nocheck` at file top
**Expected:** Violation detected

### DIS-008: prettier-ignore
**Setup:** `// prettier-ignore`
**Expected:** Violation detected

### DIS-009: Exclude Pattern
**Setup:** Disable comments in test files
**Config:** `exclude = ["tests/**", "**/*.test.ts"]`
**Expected:** Test files excluded

### DIS-010: Multiple Comments Same File
**Setup:** Multiple disable comments in one file
**Expected:** Each reported with line number

### DIS-011: Extensions Filter
**Setup:** Disable comments in `.md` file
**Config:** `extensions = ["ts", "tsx"]`
**Expected:** Markdown files not checked

### DIS-012: Disabled
**Config:** `enabled = false`
**Expected:** Check skipped

---

# Tests Validation Tests

## Configuration Options

```toml
[code.tests]
enabled = true
pattern = "**/*.{test,spec}.{ts,tsx,js,jsx}"
min_test_files = 1
```

## Test Cases

### TST-001: Test Files Exist - Pass
**Setup:** `tests/index.test.ts` exists
**Expected:** `cm code check` passes

### TST-002: No Test Files - Fail
**Setup:** No files matching test pattern
**Expected:** Violation - no test files found

### TST-003: Custom Pattern
**Setup:** Tests in `__tests__/` directory
**Config:** `pattern = "**/__tests__/**/*.ts"`
**Expected:** Pattern respected

### TST-004: Min Test Files
**Setup:** 1 test file exists
**Config:** `min_test_files = 5`
**Expected:** Violation - not enough test files

### TST-005: Multiple Test Patterns
**Setup:** Mix of `.test.ts` and `.spec.ts` files
**Config:** `pattern = "**/*.{test,spec}.{ts,tsx}"`
**Expected:** All patterns matched

### TST-006: Disabled
**Config:** `enabled = false`
**Expected:** Check skipped

---

# Output Format Tests

### OUT-001: Text Output (Default)
**Command:** `cm code check`
**Expected:** Human-readable text output

### OUT-002: JSON Output
**Command:** `cm code check -f json`
**Expected:** Valid JSON with violations array

### OUT-003: JSON Schema
**Command:** `cm schema config`
**Expected:** JSON schema for check.toml

---

# Exit Code Tests

### EXIT-001: All Checks Pass
**Expected:** Exit code 0

### EXIT-002: Violations Found
**Expected:** Exit code 1

### EXIT-003: Config Error
**Setup:** Invalid check.toml
**Expected:** Exit code 2

### EXIT-004: Runtime Error
**Setup:** Tool crashes
**Expected:** Exit code 3

---

# Integration Tests

### INT-001: All Tools Enabled
**Setup:** Enable all CODE tools
**Expected:** All tools run, results aggregated

### INT-002: Some Tools Disabled
**Setup:** Disable ESLint, enable others
**Expected:** Disabled tools skipped

### INT-003: Audit Then Check
**Command:** `cm code audit && cm code check`
**Expected:** Audit verifies configs, check runs tools

### INT-004: Aggregate Command
**Command:** `cm check` (runs code + process + infra)
**Expected:** CODE domain results included

---

# Checklist

## ESLint
- [ ] ESL-001 through ESL-014

## Prettier
- [ ] PRT-001 through PRT-006

## TypeScript
- [ ] TSC-001 through TSC-010

## Knip
- [ ] KNP-001 through KNP-012

## npm-audit
- [ ] NPM-001 through NPM-006

## Gitleaks
- [ ] GLK-001 through GLK-009

## Naming
- [ ] NAM-001 through NAM-021

## Disable Comments
- [ ] DIS-001 through DIS-012

## Tests
- [ ] TST-001 through TST-006

## Output
- [ ] OUT-001 through OUT-003

## Exit Codes
- [ ] EXIT-001 through EXIT-004

## Integration
- [ ] INT-001 through INT-004
