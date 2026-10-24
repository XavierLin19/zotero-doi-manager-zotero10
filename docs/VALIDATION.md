# Validation: 1.5.0.11

Date: 2026-10-24. Host: actual Zotero 10.0.6 / Firefox ESR 140.

## Installation failure reproduced and fixed

The actual AddonManager rejected 1.5.0.10 with install state 4 and error -3 (`ERROR_CORRUPT_FILE`). Zotero's error console reported:

```text
Reading manifest: applications.zotero.update_url not provided
```

The previous adaptation incorrectly removed a field required by Zotero, despite being optional in the generic Firefox manifest schema. Version 1.5.0.11 restores `applications.zotero.update_url`, pointing at this repository's `updates.json` instead of the original project's update feed.

## Actual runtime checks: 7 passed

An actual Zotero 10.0.6 process used a separate profile and separate synthetic test library. A local diagnostic plugin invoked AddonManager.getInstallForFile(), installed the distributed XPI, then checked:

1. Installed and active, version 1.5.0.11; compatible=true, appDisabled=false.
2. Item context menu loaded.
3. Tools menu loaded.
4. Preference pane registered with the correct resource.
5. Selected a synthetic article, invoked the plugin's actual menu command, made a live DOI request, and verified `https://doi.org/10.1038/nphys1170` became `10.1038/nphys1170`.
6. Disabled the plugin and verified its menu disappeared.
7. Re-enabled it, waited for asynchronous startup, and verified the menu returned.

See the sanitized machine-readable report: [runtime-10.0.6.json](runtime-10.0.6.json).

This was a real headless application runtime test, not visual QA of the user's interactive profile. No user library was used for the test.

## Additional checks

- Six Node.js regression tests pass; the manifest test now requires the fork's update URL. It failed before restoring that field.
- JavaScript syntax checks pass.
- XPI root resources and complete source-byte correspondence checked.
- Update manifest SHA-256 checked against the distributed XPI.

## Not yet verified

- Visual rendering of the settings page.
- Crossref lookup for articles without a DOI.
- Long/short DOI conversion end to end.
- Multiple windows, large libraries and network/service errors.
- Automatic update delivery; the feed is provided but a future-version update has not been tested.

Raw process logs, profiles, test databases, and local installation source extracts are excluded from the repository. The broken 1.5.0.10 build has been removed from the current dist directory; its earlier Git history remains available.
