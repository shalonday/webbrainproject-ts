# Content Ingestion Plan

This is an implementation-ready plan for a URL-based content ingestion flow. It is organized as sequential phases with explicit inputs, outputs, file targets, and acceptance criteria so an implementation LLM can build it step by step.

## Shared assumptions

- The user submits a single URL, not raw JSON.
- The backend owns scraping, parsing, canonicalization, and Neo4j writes.
- The frontend only displays the extracted candidate subtree and allows edits before confirmation.
- The URL node name must always be the literal URL string.
- If a prerequisite skill does not yet have a learning material node attached, the commit flow may create a placeholder URL node and must warn the user.

## Phase 1: URL submission and whitelist gate

### Goal

Create a URL submission UI and a backend validation gate that only allows approved sites.

### Inputs

- URL string from the user.

### Outputs

- A validated URL request sent to the backend.
- A rejected request when the URL is malformed or not in the whitelist.

### Backend contract

- `POST /ingest/analyze`
- Request body: `{ url: string }`
- Response on success: `AnalyzeResponse` containing the canonicalized subtree for review
- Response on validation failure: `400` with `{ error: string }`

### Sub-phases

1. Add a UI entry point on the Search page by placing a dedicated URL-ingestion action directly in the search field (Option B): add a small "Add URL"/link icon to the `SearchInput` endAdornment that opens a `ContentIngestionDialog`. The button should be visible while the user is searching and should open with the current typed value prefilled when it looks like a URL. Keep the top-right FAB stack unchanged for existing actions; this modal entry point lives in the search control itself.
2. Add client-side URL validation with a clear error message.
3. Add a backend site whitelist config.
4. Reject URLs that are not on the whitelist before scraping starts.

### Suggested files

- `src/pages/search/Search.tsx`
- `src/pages/search/components/SearchInput.tsx`
- `src/pages/search/components/ContentIngestionDialog.tsx`
- `perk-api/services/ingest/scraperConfig.js`
- `perk-api/app.js`

### Acceptance criteria

- The UI will not submit an empty or malformed URL.
- The backend will reject non-whitelisted domains.
- Tests cover allowed and blocked URLs.

## Phase 2: Scrape and parse page content

### Goal

Scrape the approved URL and extract the main educational content in a form suitable for LLM analysis.

### Inputs

- Approved URL.

### Outputs

- Normalized page content string.
- Scraping/parsing error when the page cannot be processed.

### Backend contract

- Internal helper: `scrapeContent(url: string): Promise<{ content: string, title?: string }>`
- Content must be truncated if necessary to stay within the LLM input budget.

### Sub-phases

1. Load the page with a browser-capable scraper.
2. Extract the page's main body content using site-specific rules.
3. Normalize the text so it can be passed to the LLM.
4. Fail fast with a readable error if the site is not parseable.

### Suggested files

- `perk-api/services/ingest/scraper.js`
- `perk-api/services/ingest/scraperConfig.js`

### Acceptance criteria

- Whitelisted sites are scraped successfully.
- Unsupported or blocked pages return a controlled error.
- The extracted content is stable enough for downstream LLM parsing.

## Phase 3: Extract and canonicalize the graph

### Goal

Extract a candidate subtree from the scraped content, then canonicalize the extracted skills against existing graph nodes before presenting the result to the user.

### Inputs

- Scraped content string.
- Existing Neo4j graph data for skill matching.

### Outputs

- Canonicalized candidate subtree containing:
  - URL node data
  - prerequisite candidates
  - objective candidates
  - canonical match metadata
  - unresolved/placeholder warnings

### Data shape

Use this response shape from analysis:

```ts
type CanonicalizedSkill = {
  extractedName: string;
  canonicalMatch: { uuid: string; name: string; similarity: number } | null;
  autoAccepted: boolean;
  role: "prerequisite" | "objective";
};

type AnalyzeResponse = {
  url: string;
  prerequisites: CanonicalizedSkill[];
  objectives: CanonicalizedSkill[];
};
```

### Sub-phases

1. Run the LLM graph extraction step on the scraped content.
2. Separate extracted prerequisite skills from objective skills.
3. Canonicalize the extracted skill names against existing Neo4j skills.
4. Mark exact or near-exact matches as reusable existing nodes.
5. Leave unmatched skills as new candidates with no canonical match.

### Suggested files

- `perk-api/services/ingest/contentAnalyzer.js`
- `perk-api/services/ingest/canonicalizer.js`

### Acceptance criteria

- Existing skills are reused when the canonical match is confident.
- New skills remain visible as unresolved candidates.
- The output is deterministic enough for the review UI to render consistently.

## Phase 4: Return candidate subtree to the UI

### Goal

Send the canonicalized subtree back to the frontend so the user can inspect the extracted URL, prerequisites, and objectives.

### Inputs

- `AnalyzeResponse` from the backend.

### Outputs

- A review screen with the canonicalized subtree.
- Clear loading, success, and error states.

### UI behavior

- Show the URL prominently.
- Show prerequisites and objectives in separate sections.
- Show whether each skill matched an existing graph node.
- Show a warning badge for unresolved prerequisites.

### Sub-phases

1. Render the URL candidate.
2. Render prerequisite and objective candidates separately.
3. Surface canonical match confidence in the review UI.
4. Surface placeholder warnings before confirmation.

### Suggested files

- `src/pages/search/components/ContentIngestionDialog.tsx`
- `src/api/perkClient.ts`
- `src/types/types.ts`

### Acceptance criteria

- The UI can render a full candidate subtree from the backend response.
- The user can see which nodes were matched and which are new.

## Phase 5: Review and edit the candidate subtree

### Goal

Let the user add, remove, or modify prerequisites and objectives before the tree is committed.

### Inputs

- Canonicalized subtree from the analysis step.
- User edits.

### Outputs

- A resolved tree payload ready for commit.

### Resolve rules

- If a skill has a canonical match and the user accepts it, send its `uuid` back to the backend.
- If a skill is new, send its `name` back to the backend.
- If the user edits the label, treat it as a new candidate unless the edit is re-canonicalized.

### Sub-phases

1. Allow adding a prerequisite or objective.
2. Allow removing an extracted candidate.
3. Allow changing a candidate's name.
4. Allow the user to accept or reject a canonical match.
5. Summarize unresolved prerequisites before submission.

### Suggested files

- `src/pages/search/components/ContentIngestionDialog.tsx`
- `src/pages/search/Search.tsx`

### Acceptance criteria

- The user can reshape the candidate subtree before commit.
- The UI clearly distinguishes reused nodes from new nodes.
- The user sees which prerequisites may become placeholders.

## Phase 6: Commit the reviewed tree to Neo4j

### Goal

Persist the reviewed tree to Neo4j. If a prerequisite has no existing learning material, create or attach a placeholder node and warn the user.

### Inputs

- Resolved tree payload from the UI.

### Outputs

- Written Neo4j nodes and relationships.
- A list of prerequisites that required placeholders.

### Backend contract

- `POST /ingest/commit`
- Request body:

```ts
{
  url: string;
  prerequisites: Array<{ uuid?: string; name: string }>;
  objectives: Array<{ uuid?: string; name: string }>;
}
```

- Response:

```ts
{
	message: string;
	nodes: WBNode[];
	links: Link[];
	placeholderSkills: string[];
}
```

### Write rules

- Reuse the URL node if it already exists.
- Reuse a skill node if the frontend passed a `uuid`.
- Create a new skill node if the frontend passed only a name.
- If a prerequisite skill has no teaching material yet, attach a placeholder URL node and record that skill name in `placeholderSkills`.
- Do not silently drop unresolved prerequisites.

### Sub-phases

1. Validate the final payload.
2. Create or reuse the URL node.
3. Create or reuse prerequisite skills.
4. Create or reuse objective skills.
5. Write `IS_PREREQUISITE_TO` and `TEACHES` relationships.
6. Create placeholder nodes for unresolved prerequisites and return a warning list.

### Suggested files

- `perk-api/services/ingest/ingestService.js`
- `perk-api/app.js`

### Acceptance criteria

- Existing nodes are reused when possible.
- New skills are added when necessary.
- Placeholder behavior is explicit and visible.
- The user is warned when a prerequisite has no learning material yet.

## Suggested implementation order

1. Build the whitelist gate and URL submission UI.
2. Add scraping and content parsing on the backend.
3. Add LLM extraction and canonicalization.
4. Return the candidate subtree to the frontend.
5. Add editing controls and confirmation flow.
6. Add the Neo4j commit step and placeholder behavior.

## Notes for the implementation LLM

- Keep each phase independently testable.
- Prefer small helper functions over large orchestration blocks.
- Keep the frontend and backend contracts explicit.
- Treat placeholder prerequisites as a warning path, not a hard failure.
- Keep the URL node name as the literal URL string.
