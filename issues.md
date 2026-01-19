# check-my-toolkit Bug Report

Bugs found in features added since v1.3.0 (covering v1.3.1 bug fixes and v1.4.0 new features).

---

## Confirmed Bugs

### Issue 1: No Validation for Invalid Glob Patterns

**GitHub Issue:** https://github.com/chrismlittle123/check-my-toolkit/issues/136

**File:** `src/process/tools/forbidden-files.ts`

**Description:** The `findForbiddenFiles` method accepts any string as a pattern but silently swallows errors from invalid glob patterns. If an invalid pattern is provided (e.g., malformed regex-like strings), the catch block returns an empty array instead of reporting a configuration error.

**Reproduction:**
```toml
[process.forbidden_files]
enabled = true
files = ["[invalid-pattern"]  # Unbalanced bracket
```

**Expected:** A configuration validation error should be reported.

**Actual:** The invalid pattern is silently ignored and no files are found.

---

### Issue 2: Hardcoded Ignore Patterns Cannot Be Customized

**GitHub Issue:** https://github.com/chrismlittle123/check-my-toolkit/issues/137

**File:** `src/process/tools/forbidden-files.ts`

**Description:** The ignore patterns `["**/node_modules/**", "**/.git/**"]` are hardcoded and cannot be customized or extended by users.

**Impact:** Users cannot:
- Add additional ignore patterns (e.g., `dist/`, `build/`, `.venv/`)
- Remove the default ignores if they intentionally want to check those directories

---

### Issue 3: Block Comments Not Handled in Disable-Comments Detection

**GitHub Issue:** https://github.com/chrismlittle123/check-my-toolkit/issues/138

**File:** `src/code/tools/disable-comments.ts`

**Description:** The `findCommentStart` function only detects `//` style line comments for JavaScript/TypeScript. It does not handle `/* */` block comments at all.

**Reproduction:**
```typescript
/* eslint-disable no-unused-vars */
const x = 1;
/* eslint-enable */
```

**Expected:** The `eslint-disable` pattern should be detected inside the block comment.

**Actual:** Block comment disable directives are not detected because only `//` markers are recognized.

---

## Summary

| # | Feature | Severity | Category | GitHub Issue |
|---|---------|----------|----------|--------------|
| 1 | Invalid glob patterns silently ignored | Medium | forbidden_files | [#136](https://github.com/chrismlittle123/check-my-toolkit/issues/136) |
| 2 | Hardcoded ignore patterns | Medium | forbidden_files | [#137](https://github.com/chrismlittle123/check-my-toolkit/issues/137) |
| 3 | Block comments not detected | High | disable-comments | [#138](https://github.com/chrismlittle123/check-my-toolkit/issues/138) |
