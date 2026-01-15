# Issues Log

Last Updated: 2026-01-15

## Open Issues

### Real Bugs in check-my-toolkit

### ISSUE-001: Missing `allow_dynamic_routes` Option for Naming Conventions
**Test ID(s):** NAM-010, NAM-011, NAM-012, NAM-013, NAM-014
**Priority:** Medium
**Status:** Open
**Date Opened:** 2026-01-15

**Description:**
The TEST-PLAN.md specifies an `allow_dynamic_routes` option for `[[code.naming.rules]]` that should allow Next.js/Remix dynamic route folders like `[id]`, `[...slug]`, `[[...slug]]`, `(group)`, and `@slot`. However, this option is not implemented in check-my-toolkit.

**Expected Behavior (per TEST-PLAN.md):**
```toml
[[code.naming.rules]]
extensions = ["tsx"]
file_case = "kebab-case"
folder_case = "kebab-case"
allow_dynamic_routes = true
```
Should allow folders named `[id]`, `[...slug]`, `(marketing)`, `@sidebar`, etc.

**Actual Behavior:**
```
Config error: Invalid check.toml configuration:
  - code.naming.rules.0: Unrecognized key(s) in object: 'allow_dynamic_routes'
```

**Evidence:**
The `cm schema config` output shows naming rules only support: `extensions`, `file_case`, `folder_case`, `exclude`. No `allow_dynamic_routes` property exists.

**Source Code Reference:**
Based on exploration of chrismlittle123/check-my-toolkit, the naming.ts implementation does have logic for dynamic route detection (lines 134-167), but the config schema doesn't expose the `allow_dynamic_routes` option to users.

---

## Test Implementation Issues (Not Bugs in cm)

The following are issues with the test suite, not bugs in check-my-toolkit:

### TEST-ISSUE-001: ESLint Tests Use Invalid Flat Config
**Affected Tests:** ESL-001, ESL-006, ESL-012
**Problem:** Tests create ESLint flat configs without:
1. `"type": "module"` in package.json
2. `files` pattern in eslint.config.js (required for ESLint 9+)

**Fix Required:** Update `createEslintConfig` helper to create valid ESLint 9 flat configs.

---

### TEST-ISSUE-002: "Not Installed" Tests Are Invalid
**Affected Tests:** ESL-013, PRT-005, TSC-010
**Problem:** Tests expect cm to report "not installed" when a tool isn't in package.json. However, cm uses `npx` which auto-downloads tools, so tools don't need to be locally installed.

When config is missing (not the tool), cm correctly reports "Config not found" - this is expected behavior.

**Fix Required:** Remove or redefine these tests. The "not installed" scenario only applies when npx fails to find/install the tool.

---

### TEST-ISSUE-003: TypeScript Tests Don't Actually Run tsc
**Affected Tests:** TSC-002, TSC-003
**Problem:** Test fixtures don't have TypeScript installed (no npm install). The cm tool correctly skips with "TypeScript not installed" because npx can't find tsc in the temp directory context.

**Fix Required:** Either:
1. Run `npm install typescript` in fixtures, or
2. Mock the tsc execution, or
3. Accept that these are integration tests requiring a real TypeScript installation

---

### TEST-ISSUE-004: createTsConfig Helper Has Wrong Defaults
**Affected Tests:** TSC-006
**Problem:** The `createTsConfig` helper always includes `strict: true` as a default. When testing "missing option" scenario, the test passes `{ noImplicitAny: true }` but `strict: true` is still included due to spread operator order.

```ts
// Current (buggy):
const tsconfig = {
  compilerOptions: {
    strict: true,  // Default
    ...compilerOptions,  // Doesn't remove strict
  }
}
```

**Fix Required:** Update `createTsConfig` to not include defaults, or use explicit option removal.

---

### TEST-ISSUE-005: Gitleaks Tests May Use Non-Matching Patterns
**Affected Tests:** GLK-003, GLK-005
**Problem:** Gitleaks detected the generic-api-key pattern but not AWS credentials or DB connection strings. This may be because:
1. The test patterns don't match gitleaks' built-in rules
2. Gitleaks rules have changed in newer versions

**Verification:** Running `cm code check` manually with AWS credentials in a file DOES detect them when the pattern matches gitleaks' expectations.

**Fix Required:** Update test fixtures to use patterns that match current gitleaks rules.

---

### TEST-ISSUE-006: Naming Tests Missing Required Properties
**Affected Tests:** NAM-003, NAM-004, NAM-005, NAM-008, NAM-009
**Problem:** The schema requires `extensions`, `file_case`, AND `folder_case` for each naming rule. Some tests may only provide partial configs.

**Fix Required:** Ensure all naming rule configs include all three required properties.

---

## Resolved Issues

*No resolved issues yet.*

---

## Summary

| Type | Count |
|------|-------|
| Real Bugs in cm | 1 |
| Test Implementation Issues | 6 |

The single real bug is the missing `allow_dynamic_routes` configuration option for naming conventions. All other failing tests are due to test implementation issues that need to be fixed in the test suite.
