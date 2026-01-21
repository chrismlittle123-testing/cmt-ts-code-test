# check-my-toolkit Bug Report

Bugs found in features added since v1.4.0 (covering v1.5.0 through v1.6.0).

---

## Confirmed Bugs

### Issue 1: CI Commands Crashes When `if: true` (Boolean) Is Used

**File:** `src/process/tools/ci.ts`

**Description:** The `isUnconditionalExpression` function calls `.trim()` on the condition value without checking if it's a string first. When a YAML workflow uses `if: true` (boolean literal), the code crashes with "expression.trim is not a function".

**Reproduction:**
```yaml
# .github/workflows/ci.yml
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
```

```toml
# check.toml
[process.ci]
enabled = true

[process.ci.commands]
"ci.yml" = ["npm test"]
```

**Expected:** `if: true` should be treated as unconditional and the check should pass.

**Actual:** Error: `Tool error: expression.trim is not a function`

**Root Cause:** In `ci.ts:78-83`, the code assumes `expression` is always a string:
```javascript
isUnconditionalExpression(expression) {
    if (!expression) {
        return true;
    }
    const expr = expression.trim().toLowerCase();  // BUG: .trim() on boolean
    return ["true", "success()", "always()"].includes(expr);
}
```

**Severity:** High - Causes check to fail with runtime error

---

### Issue 2: Invalid Glob Patterns Not Validated in Config

**File:** `src/config/schema.ts`

**Description:** The `globPatternSchema` validation in schema.ts uses `minimatch.makeRe()` to validate patterns, but the pattern `[invalid-pattern` (with unbalanced bracket) is accepted as valid when it should be rejected.

**Reproduction:**
```toml
# check.toml
[process.forbidden_files]
enabled = true
files = ["[invalid-pattern"]
```

```bash
$ cm validate config
✓ Valid: check.toml
```

**Expected:** Configuration validation should fail with an error about invalid glob pattern.

**Actual:** Configuration validation passes, and the invalid pattern is silently ignored at runtime.

**Root Cause:** The `minimatch.makeRe()` function may not throw for all invalid patterns, or the try/catch is too broad. The pattern `[invalid-pattern` might be interpreted as a character class and not rejected.

**Severity:** Medium - Invalid configuration silently accepted

---

### Issue 3: CLI Returns Exit Code 1 Instead of 2 for Invalid Arguments

**File:** `src/cli.ts`

**Description:** The changelog for v1.5.7 claims "CLI now returns proper exit code 2 (CONFIG_ERROR) for invalid arguments", but the CLI still returns exit code 1 when an invalid format argument is provided.

**Reproduction:**
```bash
$ cm code check --format invalid
error: option '-f, --format <format>' argument 'invalid' is invalid. Allowed choices are text, json.
$ echo $?
1
```

**Expected:** Exit code 2 (CONFIG_ERROR) for invalid arguments.

**Actual:** Exit code 1.

**Root Cause:** Looking at `cli.ts:28-37`, the `exitOverride` handler only intercepts `commander.invalidArgument` and `commander.optionMissingArgument` error codes. However, the `choices()` validation from Commander may use a different error code (`commander.invalidOptionArgumentValue` or similar) that isn't being caught.

**Severity:** Low - Incorrect exit code for invalid arguments

---

## Summary

| # | Feature | Severity | Category | Fixed In |
|---|---------|----------|----------|----------|
| 1 | CI commands crashes on boolean `if: true` | High | CI commands (v1.6.0) | - |
| 2 | Invalid glob patterns accepted in config | Medium | Schema validation (v1.5.5) | - |
| 3 | CLI exit code 1 instead of 2 for invalid args | Low | CLI (v1.5.7) | - |

---

## Test Results Summary

**Total Tests Written:** 222
**Tests Passing:** 216
**Tests Failing:** 6

The 6 failing tests include:
- 3 tests that discovered the bugs documented above
- 2 tests for the glob pattern validation bug (in different test files)
- 1 test with incorrect expectation about JSON Schema structure (not a bug)

---

## Notes

### Not Bugs (Test Expectation Issues)

1. **NAM-005 (PascalCase naming):** The test failed because "src" folder doesn't match PascalCase. This is correct behavior - the test expectation was wrong. Users need to add exclude patterns for common folders like "src".

2. **SCH-025 (Schema output):** The test expected `properties` at the root level, but the schema uses `$ref` with `definitions`. This is a valid JSON Schema structure, not a bug.

