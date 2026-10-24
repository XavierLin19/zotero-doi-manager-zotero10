# Validation: 1.5.0.10

Date: 2026-10-24. Target: Zotero 10.0.x; inspected local installation: 10.0.6 / Firefox ESR 140.

## Passed
- Six Node.js regression tests in a simulated Zotero environment: version bounds and update URL; startup/menu insertion and preference resource; window close/shutdown/restart; DOI cleanup and request routing; mocked successful validation and persistence; automatic verification setting.
- Syntax checks for bootstrap.js and zoteroshortdoi.js.
- XPI root manifest and required resources; all 20 archive entries match source bytes.
- Source inspection of Zotero 10.0.6 plugin sandbox and PreferencePanes interfaces.

## Not verified
- Real UI installation, settings rendering, and interaction.
- End-to-end online DOI/Crossref/shortDOI requests in Zotero.
- Multiple windows, large libraries, and service/network errors in an actual session.

An isolated headless launch attempt did not produce a runtime report. It provides no positive runtime evidence. This repository excludes that test profile, temporary library, runtime logs, and local installation source extracts.

The test suite simulates host APIs and an HTTP response. Passing it does not prove runtime or network compatibility. The declared compatibility range is the build's target, not a certification.
