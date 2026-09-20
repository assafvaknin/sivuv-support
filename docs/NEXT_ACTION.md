# Objective

Complete the support repository's transition to local-Mac tests without interrupting GitHub Pages deployment.

# Why

The four public pages and four tests already pass locally. Only the test workflow should leave GitHub; Pages must continue publishing the production support site.

# Current State

- `chore/local-verification` has a successful exact-commit local result.
- Protected `main` still requires `Validate support site`.
- The test workflow is active pending approval.
- GitHub Pages is active and must remain active.

# Required Work

1. After explicit owner approval, replace the historical required test context with `Local Mac verification` without changing any other protection.
2. Disable only the support-site test workflow; explicitly keep the Pages workflow active.
3. Open, review, and merge the focused transition PR through protected `main`.
4. Verify all live support URLs after deployment.
5. After the Sivuv review result, compare the released behavior with support, privacy, terms, and accessibility content.

# Acceptance Criteria

- Four local tests and all page validations pass on the exact commit.
- Protected `main` requires `Local Mac verification`.
- The GitHub test workflow is disabled.
- GitHub Pages remains active and every live URL responds with the intended content.
- No content claim is changed without corresponding product evidence.

# Tests

Run `scripts/verify_local.sh` on the Mac and publish the exact commit result with `scripts/report_local_status.sh success <commit>`.

# Git Strategy

Continue `chore/local-verification`, open a focused PR into protected `main`, and preserve the Pages workflow and unrelated protection settings.

# After Completion

Keep the site stable. Re-verify metadata and legal/privacy descriptions when the Apple review outcome or released app behavior changes.
