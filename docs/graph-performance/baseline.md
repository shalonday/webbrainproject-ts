# Baseline Results (Phase 0)

Date: 2026-06-28
Branch: graph-performance
Workspace: webbrainproject-ts

## Command Outcomes

1. Install dependencies

- Command: npm ci --no-progress --no-audit --fund=false
- Result: PASS
- Notes: added 592 packages in ~4 minutes.

2. Lint

- Command: npm run lint
- Result: PASS with warnings
- Warnings observed: 8 (no errors)
- Files with warnings:
  - src/api/perkClient.ts (2 no-console warnings)
  - src/pages/search/chatbot/RAGChatbot.tsx (1 react-hooks dependency warning, 2 no-console warnings)
  - src/pages/search/chatbot/storage.ts (3 no-console warnings)

3. Tests

- Command: npm run test:run
- Result: FAIL (pre-existing baseline failures)
- Summary: 3 failed test files, 19 passed test files; 6 failed tests, 206 passed tests
- Duration: 121.86s
- Failed files and key failures:
  - src/pages/search/D3Chart.test.tsx (4 failures)
    - Tooltip text expectation mismatch
    - Unexpected title element count in no-timestamp case
    - Unexpected title count for done nodes and hydration case
  - src/test/search/GeneratePathButton.test.tsx (1 failure)
    - Timeout in "is disabled when no search result is selected"
  - src/test/search/PathTraversal.test.tsx (1 failure)
    - Timeout in "disables Move Forward button when at the last node"

4. Build

- Command: npm run build
- Result: PASS
- Notes:
  - Vite build completed successfully
  - Chunk size warning: dist/assets/index-BOECBsMb.js is 663.62 kB (gzip 213.32 kB)

## Phase 0 Exit Status

- Baseline checks are not fully green due to pre-existing test failures.
- Baseline is captured and documented for PoC comparison.
- Proceeding with PoC is acceptable if pre-existing failures are treated as known baseline risk.
