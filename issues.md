# Issues Log

Last Updated: 2026-01-15

## Open Issues

### Blockers

### ISSUE-001: GLK-008 Test Requires Special Setup
**Test ID(s):** GLK-008
**Priority:** Low
**Status:** Open
**Date Opened:** 2026-01-15

**Description:**
The GLK-008 test case (Gitleaks Not Installed) requires special test setup to simulate gitleaks not being installed on the system. This would require either modifying the PATH environment variable during the test or using a mock.

**Expected Behavior:**
When gitleaks is not installed, `cm code check` should skip the secrets check with a "not installed" message.

**Actual Behavior:**
Test is skipped with `it.skip()` because simulating "not installed" state is non-trivial.

**Workaround:**
Test can be manually run on a system without gitleaks installed.

---

### High Priority

### ISSUE-002: "Not Installed" vs "Config Not Found" Behavior
**Test ID(s):** ESL-013, PRT-005, TSC-010
**Priority:** High
**Status:** Open
**Date Opened:** 2026-01-15

**Description:**
Tests expect `cm` to report "not installed" when tools (ESLint, Prettier, TypeScript) are not in package.json. Instead, `cm` reports "Config not found" error.

**Expected Behavior:**
When a tool is not installed (not in package.json), the check should be skipped with a "not installed" message.

**Actual Behavior:**
The tool reports "Config not found" and fails with exit code 1.

**Affected Tests:**
- ESL-013: ESLint Not Installed
- PRT-005: Prettier Not Installed
- TSC-010: tsc Not Installed

---

### ISSUE-003: Secrets Detection Not Triggering for Some Patterns
**Test ID(s):** GLK-002, GLK-003, GLK-004, GLK-005, GLK-007, GLK-009
**Priority:** High
**Status:** Open
**Date Opened:** 2026-01-15

**Description:**
Gitleaks secret detection tests are passing (exit code 0) when they should fail. The fake secrets in test files are not being detected.

**Expected Behavior:**
Hardcoded API keys, AWS credentials, private keys, and database connection strings should be detected as secrets.

**Actual Behavior:**
Tests pass with exit code 0, no secrets detected.

**Possible Causes:**
- Gitleaks may not be installed on the system
- The `code.security.secrets` section may need additional configuration
- Gitleaks rules may not match the test patterns

---

### Medium Priority

### ISSUE-004: Naming Convention Tests Failing
**Test ID(s):** NAM-001 through NAM-021 (multiple)
**Priority:** Medium
**Status:** Open
**Date Opened:** 2026-01-15

**Description:**
Multiple naming convention tests are failing. The `cm` tool may have different behavior than expected for file/folder naming validation.

**Affected Tests:**
- NAM-001: Kebab-case Files - Pass
- NAM-002: Kebab-case Files - Fail
- NAM-006: Folder Naming - Pass
- NAM-007: Folder Naming - Fail
- And others

---

### ISSUE-005: Disable Comments Detection Behavior
**Test ID(s):** DIS-001 through DIS-012 (multiple)
**Priority:** Medium
**Status:** Open
**Date Opened:** 2026-01-15

**Description:**
Disable comments detection tests have mixed results. Some comments are detected while others are not.

---

### ISSUE-006: Test Validation Behavior
**Test ID(s):** TST-001 through TST-006
**Priority:** Medium
**Status:** Open
**Date Opened:** 2026-01-15

**Description:**
Test file validation tests are failing. The `code.tests` configuration may behave differently than expected.

---

### Low Priority

### ISSUE-007: ESLint Rule Options Auditing
**Test ID(s):** ESL-012
**Priority:** Low
**Status:** Open
**Date Opened:** 2026-01-15

**Description:**
ESL-012 (Rule Auditing - Options Match) fails even when options should match. The complexity rule options format may differ between test expectation and actual ESLint config.

---

### ISSUE-008: Knip Unused Export Detection
**Test ID(s):** KNP-003
**Priority:** Low
**Status:** Open
**Date Opened:** 2026-01-15

**Description:**
KNP-003 (Unused Export) test passes when it should fail. Knip may not be detecting unused exports in the test scenario, possibly due to how entry points are configured.

---

## Resolved Issues

*No resolved issues yet.*

---

## Issue Template

When adding new issues, use this format:

```markdown
### ISSUE-XXX: [Title]
**Test ID(s):** [Related test IDs, e.g., ESL-001, ESL-002]
**Priority:** Blocker | High | Medium | Low
**Status:** Open | In Progress | Resolved
**Date Opened:** YYYY-MM-DD
**Date Resolved:** YYYY-MM-DD (if resolved)

**Description:**
[Detailed description of the issue]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]

**Workaround:**
[If any workaround exists]

**Resolution:**
[How it was fixed, if resolved]
```

---

## Notes

- Issues are categorized by priority: Blocker > High > Medium > Low
- Blockers prevent further test implementation
- Reference test IDs from TEST-PLAN.md when applicable
- Move resolved issues to the "Resolved Issues" section with resolution notes
