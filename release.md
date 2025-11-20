## Release Process

* Publish to npm.
* Draft a GitHub release.
  * In release notes list breaking changes, new features, bug fixes, CVE, perf/size changes.
  * Leave a link to comparison with previous release tag
* Update [support.md](/support.md) for previous versions.
* Backport security to LTS, if needed: cherry-pick, test, patch release.

Tags: Semantic (vX.Y.Z).
Labels: bug, enhancement, security.
