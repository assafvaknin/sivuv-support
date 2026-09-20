# Current Production State

The public static support site is live at <https://assafvaknin.github.io/sivuv-support/> and is deployed from protected `main` by GitHub Pages.

# Current Development State

The repository-only local-verification migration is prepared on `chore/local-verification`. It changes testing and documentation only; the live support content remains unchanged.

# Current Version

No independent semantic version. The site follows the released/reviewed Sivuv app behavior.

# Current Branch

`chore/local-verification`

# Build Status

No compilation step is required. All four static pages validate locally.

# Test Status

Four dependency-free local tests pass.

# CI Status

Protected `main` requires `Local Mac verification`, and the exact transition commit has a successful result. The support-site test workflow is disabled. GitHub Pages remains active as deployment only.

# Known Issues

There is no persistent local clone in the curated portfolio and no license file. Content must be rechecked after the Sivuv App Store review outcome.

# Current Milestone

Move only tests to the Mac while preserving the production Pages deployment.

# Blockers

No repository-protection blocker remains. Apple review remains external.

# Recent Important Decisions

GitHub Pages must remain active. The site is static, receives no shift data, and must describe only behavior verified in the released app.

# Release Status

Production support site live on GitHub Pages.

# Last Updated

2026-09-20
