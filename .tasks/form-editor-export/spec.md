# M1: Form Editor + Export — Technical Specification

## Scope
Hybrid MD file editor for workspace files (SOUL.md, IDENTITY.md, AGENTS.md):
- Parse MD → structured form data
- Edit via React form + live MD preview
- Generate MD from form state
- Import/export workspace (.zip)

## 1. TypeScript Types

```typescript
// Shared types (libs/types/workspace.ts)
export interface WorkspaceFile {
  filename: 'SOUL.md' | 'IDENTITY.md' | 'AGENTS.md';
  content: string; // Raw markdown
  parsedData: ParsedFileData;
}

export interface ParsedFileData {
  // IDENTITY.md
  identity?: {
    name: string;
    role: string;
    emoji: string; // Single Unicode emoji
    vibe: string;
  };
  
  // SOUL.md
  soul?: {
    language: string;
    rules: string[]; // Numbered list items
    planThreadBehavior?: string; // Freeform MD section
    initProjectCommand?: string; // Parsed from exec block
    milestoneWorkflow?: string; // Freeform MD section
    teamMembers?: { name: string; mention: string }[];
  };
  
  // AGENTS.md
  agents?: {
    firstRunInstructions?: string;
    sessionStartChecklist?: string[];
    memoryPolicy?: string;
    safetyRules?: string[];
    externalVsInternal?: string;
    groupChatGuidelines?: string;
    toolsNotes?: string;
  };
  
  // Freeform sections (non-structured content)
  freeformSections: { heading: string; content: string }[];
}

export interface WorkspaceExport {
  version: '1.0';
  files: WorkspaceFile[];
  exportedAt: string; // ISO 8601
}
```

## 2. Backend API

### 2.1 Endpoints

**Parse workspace MD files:**
```
POST /api/workspace/parse
Content-Type: multipart/form-data

Body:
- file: File (SOUL.md / IDENTITY.md / AGENTS.md)

Response 200:
{
  "filename": "SOUL.md",
  "parsedData": ParsedFileData,
  "warnings": string[] // e.g., "Unknown heading: ## Custom Section"
}

Error 400:
{
  "error": "INVALID_FILE",
  "message": "File must be .md and <= 10MB"
}

Error 429:
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Max 10 parse requests per minute",
  "retryAfter": 42 // seconds
}
```

**Generate MD from form data:**
```
POST /api/workspace/generate
Content-Type: application/json

Body:
{
  "filename": "SOUL.md",
  "parsedData": ParsedFileData
}

Response 200:
{
  "filename": "SOUL.md",
  "content": string // Generated markdown
}
```

**Export workspace as .zip:**
```
POST /api/workspace/export
Content-Type: application/json

Body:
{
  "files": WorkspaceFile[]
}

Response 200:
Content-Type: application/zip
Content-Disposition: attachment; filename="workspace-export-2026-03-15.zip"

Binary .zip containing:
- SOUL.md
- IDENTITY.md
- AGENTS.md
- manifest.json (metadata: version, exportedAt)

Error 400:
{
  "error": "INVALID_FILE_COUNT",
  "message": "Must include all 3 workspace files"
}

Error 400:
{
  "error": "EMPTY_WORKSPACE",
  "message": "Cannot export empty workspace"
}
```

**Import workspace from .zip:**
```
POST /api/workspace/import
Content-Type: multipart/form-data

Body:
- file: File (.zip <= 10MB)

Response 200:
{
  "files": WorkspaceFile[],
  "warnings": string[]
}

Error 400:
{
  "error": "INVALID_ZIP",
  "message": "Missing required file: SOUL.md"
}

Error 429:
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Max 5 import requests per minute",
  "retryAfter": 30
}
```

### 2.2 Validation Rules

| Field | Rule |
|-------|------|
| File size | <= 10MB per file |
| Emoji (IDENTITY.md) | Single Unicode emoji, trimmed (use `emoji-regex` lib) |
| Filename | Exact match: `SOUL.md`, `IDENTITY.md`, `AGENTS.md` (case-sensitive) |
| .zip structure | Must contain all 3 MD files + optional manifest.json |
| MD content | Valid UTF-8, no null bytes |
| Freeform heading | Non-empty after trim, no `##` prefix (auto-stripped) |

### 2.3 Rate Limiting

| Endpoint | Limit | Window | Identifier |
|----------|-------|--------|------------|
| `/api/workspace/parse` | 10 requests | 1 minute | Client IP |
| `/api/workspace/import` | 5 requests | 1 minute | Client IP |
| `/api/workspace/generate` | 20 requests | 1 minute | Client IP |
| `/api/workspace/export` | 10 requests | 1 minute | Client IP |

**Concurrent handling:**
- Use request queue per IP (max 2 concurrent)
- Additional requests → HTTP 503 "Server busy, retry in 5s"

### 2.4 MD Parser Logic

**Parsing strategy:**
1. Split by `## Heading` to extract sections
2. Known headings → structured fields (e.g., `## Rules` → `soul.rules[]`)
3. Unknown headings → `freeformSections[]`
4. Preserve original formatting (whitespace, list styles)
5. **Sanitize freeform headings:** Strip leading `##`, trim whitespace, escape markdown special chars in heading text

**Example: SOUL.md**
```markdown
# Marcus — Architect @ TrustAI

Tiếng Việt (trừ code). Ngắn gọn.

## Rules
1. KHÔNG paste bash ra Discord
2. LUÔN dùng `<@ID>` mention

## PLAN thread — Brainstorm
- Research trước khi review
- Alex confirm → Marcus tạo M1
```

**Parsed:**
```json
{
  "soul": {
    "language": "Tiếng Việt (trừ code). Ngắn gọn.",
    "rules": [
      "KHÔNG paste bash ra Discord",
      "LUÔN dùng `<@ID>` mention"
    ]
  },
  "freeformSections": [
    {
      "heading": "PLAN thread — Brainstorm",
      "content": "- Research trước khi review\n- Alex confirm → Marcus tạo M1"
    }
  ]
}
```

**Team table parsing:**
- Ignore empty rows (`| | |` → skip)
- Require both columns non-empty (name + mention)
- Invalid rows → warning: "Skipped empty team row"

### 2.5 MD Generator Logic

**Generation strategy:**
1. Render structured fields → known headings
2. Append `freeformSections[]` as-is
3. Preserve user formatting (list styles, code blocks)
4. Add blank line between sections
5. **Escape freeform headings:** Re-add `##` prefix, sanitize heading text

**Example output:**
```markdown
# Marcus — Architect @ TrustAI

Tiếng Việt (trừ code). Ngắn gọn.

## Rules
1. KHÔNG paste bash ra Discord
2. LUÔN dùng `<@ID>` mention

## PLAN thread — Brainstorm
- Research trước khi review
- Alex confirm → Marcus tạo M1
```

## 3. Frontend (React)

### 3.1 Components

**WorkspaceEditor.tsx:**
- Tabs: SOUL.md | IDENTITY.md | AGENTS.md
- Split view: Form (left) + MD Preview (right)
- Auto-save to local state on field change
- Export/Import buttons (top-right toolbar)
  - Export: disabled if all files empty
  - Import: show warning modal if form has unsaved edits
- **Concurrent operation guard:** Disable Export/Import buttons during active parse/generate requests

**StructuredForm.tsx:**
- Dynamic fields based on `parsedData` schema
- Text inputs, textareas, emoji picker
- List editor for arrays (`soul.rules[]`, `soul.teamMembers[]`)
- **States:**
  - Loading: skeleton loaders for fields
  - Error: red border + inline error message
  - Default: editable fields

**FreeformSection.tsx:**
- Textarea for each `freeformSections[i].content`
- Collapsible sections (heading as label, collapsed by default if >5 sections)
- "Add Section" button
  - Validation: heading required (show error if empty on blur)
  - Default heading: "Untitled Section"
- **M1 scope:** No drag-to-reorder (hardcoded section order = parse order)

**MDPreview.tsx:**
- Read-only rendered markdown (use `react-markdown`)
- **M1 scope:** No scroll-sync with form (independent scrollbars)

### 3.2 File Upload Flow

**Import:**
1. User clicks "Import Workspace"
2. **If form has edits:** Show modal: "Discard unsaved changes?" → Cancel | Proceed
3. File picker → select .zip
4. Show loading overlay: "Processing..."
5. **Disable Export/Import buttons** (prevent concurrent requests)
6. POST `/api/workspace/import`
7. On success: Load `files[]` into editor state, switch to SOUL.md tab, re-enable buttons
8. On error: Show toast notification + error message, re-enable buttons

**Export:**
1. User clicks "Export Workspace"
2. **If all files empty:** Button disabled, tooltip: "Add content to export"
3. **If parse in progress:** Button disabled, tooltip: "Processing..."
4. Collect current form state → `WorkspaceFile[]`
5. **Disable Export/Import buttons**
6. POST `/api/workspace/export`
7. Browser download .zip, re-enable buttons

### 3.3 Validation UI

- Show field errors inline (red border + message)
- Toast notifications for API errors (rate limit, server errors)
- Disable Export if:
  - All files have empty `parsedData` + empty `freeformSections[]`
  - Any file has validation errors (invalid emoji, empty required fields)
  - Active parse/import operation in progress

## 4. Test Scenarios

### 4.1 Parser Tests

| Test | Input | Expected Output |
|------|-------|----------------|
| Parse SOUL.md | Valid MD with Rules + Team | `soul.rules[]` populated, `soul.teamMembers[]` extracted |
| Unknown heading | `## Custom Section` | Appears in `freeformSections[]` |
| Empty file | `""` | `{ freeformSections: [] }` (no error) |
| Oversized file | 11MB MD file | Error: `INVALID_FILE` |
| Empty table row | `\| \| \|` in Team table | Row skipped, warning: "Skipped empty team row" |
| Freeform heading with `##` | User enters `## My ## Section` | Parsed as heading "My ## Section" (## stripped) |

### 4.2 Generator Tests

| Test | Input | Expected Output |
|------|-------|----------------|
| Generate from parsed data | `soul.rules = ["Rule 1", "Rule 2"]` | `## Rules\n1. Rule 1\n2. Rule 2` |
| Preserve freeform | `freeformSections[0]` | Exact content appended |
| Empty data | `{ freeformSections: [] }` | Empty MD string |

### 4.3 Import/Export Tests

| Test | Input | Expected Output |
|------|-------|----------------|
| Valid .zip | Contains all 3 MD files | `files[]` populated |
| Missing file | .zip without AGENTS.md | Error: `INVALID_ZIP` |
| Oversized .zip | 11MB .zip | Error: `INVALID_FILE` |
| Export → Import (1 roundtrip) | Export workspace → import same .zip | Identical `parsedData` |
| Export → Import → Export (2 roundtrips) | Repeat export/import twice | Byte-identical content after both rounds |

### 4.4 UI Tests

| Test | Action | Expected Behavior |
|------|--------|-------------------|
| Edit field | Change `soul.language` → type "English" | MD preview updates instantly |
| Add freeform section | Click "Add Section" → leave heading empty | Error: "Heading required" on blur |
| Import workspace | Upload .zip | Editor loads files, switches to SOUL.md tab |
| Import with unsaved edits | Edit form → click Import | Modal: "Discard unsaved changes?" |
| Export workspace | Click Export | Browser downloads `workspace-export-YYYY-MM-DD.zip` |
| Export empty workspace | No content in any file → click Export | Button disabled |
| Validation error | Enter invalid emoji "🔥🔥" | Red border + error message |
| Rate limit hit | 11th parse request in 1 min | Toast: "Too many requests, retry in 30s" |
| Concurrent operation guard | Upload file → click Export immediately | Export button disabled until parse completes |

### 4.5 Security Tests

| Test | Input | Expected Output |
|------|-------|----------------|
| XSS in MD | `SOUL.md` contains `<script>alert('xss')</script>` | Preview shows escaped text (no script execution) |
| Zip bomb | 1MB .zip expands to 200MB | Error: `ZIP_TOO_LARGE` (extracted size > 50MB) |
| Path traversal | .zip contains `../../../etc/passwd` | File ignored, warning: "Invalid filename" |
| Compression ratio | 100KB .zip expands to 20MB | Accepted (ratio 200:1 under threshold) |
| Rate limit (parse) | 11 parse requests in 1 min | 11th request → 429 error, `Retry-After: 30` |
| Concurrent requests | 3 import requests sent simultaneously | 2 processed, 1 queued → 503 "Server busy" |
| Emoji trailing space | `validateEmoji("⚙️ ")` | Passes (trimmed before validation) |

### 4.6 Edge Case Tests

| Test | Input | Expected Output |
|------|-------|----------------|
| Multi-codepoint emoji | `👨👩👧👦` in emoji field | Accepted (visually one emoji) |
| Emoji + text | `Marcus ⚙️` | Error: "Emoji must be standalone" |
| 100 freeform sections | SOUL.md with 100 `## Custom N` headings | All parsed, UI collapses by default |
| Empty freeform section | `## Custom\n\n` (no content) | Preserved in `freeformSections[]` |
| Freeform heading with `##` | `## My ## Section` → parse → generate | Roundtrip preserves: `## My ## Section` |
| Empty freeform heading (UI) | User adds section, leaves heading blank | Error on blur: "Heading required" |
| Empty team table row | `\| \| \|` in Team table | Row skipped, warning logged |

### 4.7 Roundtrip Tests

| Test | Action | Expected Behavior |
|------|--------|-------------------|
| Parse → generate (1 roundtrip) | Load SOUL.md → export → compare | Byte-identical (whitespace preserved) |
| Edit freeform → roundtrip | Add text to custom section → export → import | Text preserved, section order unchanged |
| 2 roundtrips | Export → import → export → import → compare | Byte-identical after both rounds |

### 4.8 Browser Compatibility Tests

| Browser | Test | Expected Behavior |
|---------|------|-------------------|
| Chrome 120+ | Export workspace → download .zip | File downloads to default folder |
| Safari 17+ | Export workspace → download .zip | File downloads, no MIME type errors |
| Firefox 121+ | Export workspace → download .zip | File downloads, correct filename |
| Edge 120+ | Import .zip | File picker opens, .zip accepted |

**Minimum supported versions:**
- Chrome/Edge: 120+
- Safari: 17+
- Firefox: 121+
- Mobile browsers: Not supported (M1 desktop-only)

## 5. Tech Stack

| Layer | Tech |
|-------|------|
| BE | Express, `gray-matter` (MD frontmatter), `emoji-regex` (validation), `express-rate-limit` |
| FE | React 18, `react-markdown`, `emoji-picker-react`, `DOMPurify` (XSS sanitization) |
| Storage | None (in-memory only for M1) |
| Tests | Jest (BE), Vitest (FE), Playwright (E2E browser compatibility) |

## 6. Non-Goals (M1)

- ❌ Multi-user editing (single-user only)
- ❌ Version history / undo
- ❌ Cloud storage (local export/import only)
- ❌ Real-time collaboration
- ❌ Auto-save to backend (all state in FE until export)
- ❌ Scroll-sync between form and preview (M2 feature)
- ❌ Drag-to-reorder freeform sections (M2 feature)
- ❌ Mobile browser support (desktop-only)

## 7. Success Criteria

- [ ] Parse all 3 workspace MD files without errors
- [ ] Generate MD from form → matches original formatting
- [ ] Import/export roundtrip preserves data (no data loss, 2+ roundtrips tested)
- [ ] Form validation prevents invalid emoji/oversized files
- [ ] MD preview syncs with form edits in <100ms
- [ ] Rate limiting blocks excessive requests (429 error)
- [ ] Concurrent operation guard prevents race conditions
- [ ] All test scenarios pass (30+ test cases)
- [ ] Browser compatibility: Chrome 120+, Safari 17+, Firefox 121+, Edge 120+

## 8. UX States

### 8.1 WorkspaceEditor States

| State | Trigger | UI |
|-------|---------|-----|
| Empty | Initial load, no files | "Import workspace to start" placeholder |
| Loading | Import in progress | Spinner overlay + "Processing..." |
| Error | Import/parse failed | Error banner + retry button |
| Default | Files loaded | Form + preview visible |
| Unsaved changes | User edits form | "Unsaved changes" indicator (dot on tab) |
| Operation in progress | Parse/import active | Export/Import buttons disabled |

### 8.2 StructuredForm States

| State | Trigger | UI |
|-------|---------|-----|
| Loading | File upload parsing | Skeleton loaders for all fields |
| Error | Validation failed (e.g., invalid emoji) | Red border + inline error message |
| Default | Data loaded, no errors | Editable fields |

### 8.3 MDPreview States

| State | Trigger | UI |
|-------|---------|-----|
| Loading | Generating preview | Skeleton loader |
| Error | Generation failed | "Preview unavailable" message |
| Default | MD rendered | Scrollable markdown (independent scroll) |

### 8.4 Export Button States

| State | Trigger | UI |
|-------|---------|-----|
| Disabled | All files empty (no content) | Grayed out, tooltip: "Add content to export" |
| Disabled | Operation in progress | Grayed out, tooltip: "Processing..." |
| Enabled | At least one file has content + no active operations | Clickable, blue background |

### 8.5 Import Button States

| State | Trigger | UI |
|-------|---------|-----|
| Warning | User has unsaved form edits | Modal on click: "Discard unsaved changes? Cancel \| Proceed" |
| Disabled | Operation in progress | Grayed out, tooltip: "Processing..." |
| Default | No unsaved edits + no active operations | File picker opens immediately |

## 9. Security Measures

### 9.1 XSS Prevention
- **MD Preview:** Use `react-markdown` with `disallowedElements={['script', 'iframe']}` + `DOMPurify` sanitization
- **User input:** Escape HTML in form fields before rendering

### 9.2 Zip Extraction
- **Compressed size:** <= 10MB
- **Extracted size limit:** <= 50MB total (all files combined)
- **Path validation:** Strip directory paths, only allow base filenames (`SOUL.md`, not `../SOUL.md`)
- **Zip bomb detection:** Reject if compression ratio > 100:1

### 9.3 File Validation
- **MD content:** Strip null bytes, validate UTF-8 encoding
- **Filename whitelist:** Only `SOUL.md`, `IDENTITY.md`, `AGENTS.md`, `manifest.json`

### 9.4 Rate Limiting
- **Per-IP limits:** See §2.3 table
- **Concurrent request queue:** Max 2 concurrent requests per IP
- **429 response:** Include `Retry-After` header (seconds)

### 9.5 Emoji Validation Edge Cases
**Implementation:**
```typescript
import emojiRegex from 'emoji-regex';

function validateEmoji(input: string): boolean {
  const trimmed = input.trim(); // Handle trailing/leading spaces
  const regex = emojiRegex();
  const matches = trimmed.match(regex);
  return matches !== null && matches.length === 1 && trimmed === matches[0];
}
```

**Test cases:**
- `validateEmoji("⚙️ ")` → `true` (trailing space trimmed)
- `validateEmoji(" 🔥")` → `true` (leading space trimmed)
- `validateEmoji("🔥🔥")` → `false` (two emojis)

## 10. Clarifications

### 10.1 Emoji Validation
**Rule:** Single **rendered** emoji only (multi-codepoint allowed if visually one emoji)

**Examples:**
- ✅ `⚙️` (single codepoint with variation selector)
- ✅ `👨👩👧👦` (multi-codepoint, but visually one family emoji)
- ❌ `🔥🔥` (two separate emojis)
- ❌ `Marcus ⚙️` (text + emoji)

### 10.2 Team Members Parsing
**SOUL.md table format:**
```markdown
## Team
| Member | Mention |
|--------|---------|
| Marcus | `<@1480799610283884608>` |
| Alex   | `<@1480799502536540323>` |
|        |         |
```

**Parser logic:**
1. Detect `## Team` heading
2. Find markdown table (rows with `|`)
3. Extract rows: `{ name: column1.trim(), mention: column2.trim() }`
4. **Skip empty rows:** If `name.trim() === "" || mention.trim() === ""` → skip, add warning
5. Strip backticks from mention field

### 10.3 Freeform Section Order
**Guarantee:** Parse → generate roundtrip preserves:
- Section order (heading sequence)
- Content formatting (whitespace, lists)
- Heading levels (`##` vs `###`)

**UI behavior:**
- Freeform sections: collapsible (collapsed by default if >5 sections)
- **M1:** Section order = parse order (no drag-to-reorder UI)
- **M2:** Add drag handles for reordering

### 10.4 Freeform Heading Sanitization
**Input:** User enters heading with markdown chars: `My ## Special ## Section`

**Parser behavior:**
1. Strip leading `##` if present: `My ## Special ## Section` → `My ## Special ## Section`
2. Trim whitespace
3. Escape inner `##` when rendering in UI (show as text, not heading)

**Generator behavior:**
1. Add `## ` prefix to heading
2. Output: `## My ## Special ## Section`

**Roundtrip test:**
- Original MD: `## My ## Special ## Section`
- Parse → `{ heading: "My ## Special ## Section", ... }`
- Generate → `## My ## Special ## Section`
- **Result:** Byte-identical ✅

### 10.5 Scroll-Sync (M1 Exclusion)
**Decision:** M1 does not implement scroll-sync between form and preview.

**Rationale:**
- Adds complexity (scroll event listeners, viewport calculations)
- Not critical for MVP (users can manually scroll)
- Better suited for M2 polish pass

**M1 behavior:**
- Form and preview have independent scrollbars
- No synchronization

**M2 plan:**
- Use `scroll-sync` library or custom implementation
- Scroll form → preview follows (and vice versa)

### 10.6 Drag-to-Reorder (M1 Exclusion)
**Decision:** M1 does not implement drag-to-reorder for freeform sections.

**Rationale:**
- Requires drag-and-drop library (`react-beautiful-dnd` or similar)
- Not critical for MVP (section order = parse order is acceptable)
- Better suited for M2 feature pass

**M1 behavior:**
- Freeform sections appear in parse order
- No drag handles or reorder UI

**M2 plan:**
- Add drag handles to section headers
- Use `react-beautiful-dnd` for reordering
- Update `freeformSections[]` order on drop

## 11. API Error Codes

| Code | Message | HTTP |
|------|---------|------|
| `INVALID_FILE` | File must be .md and <= 10MB | 400 |
| `INVALID_ZIP` | Missing required file: SOUL.md | 400 |
| `ZIP_TOO_LARGE` | Extracted size exceeds 50MB | 400 |
| `INVALID_EMOJI` | Emoji must be standalone and single | 400 |
| `EMPTY_WORKSPACE` | Cannot export empty workspace | 400 |
| `RATE_LIMIT_EXCEEDED` | Too many requests, retry later | 429 |
| `SERVER_BUSY` | Server busy, retry in 5s | 503 |
| `PARSE_ERROR` | Failed to parse markdown | 500 |
| `GENERATE_ERROR` | Failed to generate markdown | 500 |

## 12. Coverage Matrix

Maps decisions.md requirements → spec implementation:

| Decision Requirement | Spec Section | Status |
|---------------------|--------------|--------|
| Form editor for SOUL.md, IDENTITY.md, AGENTS.md | §1 Types, §3.1 Components | ✅ |
| Parse MD files | §2.1 `/api/workspace/parse` | ✅ |
| Generate MD files | §2.1 `/api/workspace/generate` | ✅ |
| Form validation + preview | §3.1 StructuredForm, MDPreview | ✅ |
| Export .zip workspace | §2.1 `/api/workspace/export` | ✅ |
| Import .zip workspace | §2.1 `/api/workspace/import` | ✅ |
| LocalStorage (no cloud) | §6 Non-Goals | ✅ |
| Max 10MB file size | §2.2 Validation Rules | ✅ |
| No secrets in export | §6 Non-Goals (user adds manually) | ✅ |
| UX states (loading/error) | §8 UX States | ✅ |
| Security (rate limit, XSS) | §9 Security Measures | ✅ |
| Edge cases (emoji, roundtrips) | §4.6, §4.7 Edge Case + Roundtrip Tests | ✅ |
| Concurrent operation guard | §3.1 WorkspaceEditor, §4.4 UI Tests | ✅ |
| Browser compatibility | §4.8 Browser Compatibility Tests | ✅ |
| Scroll-sync exclusion (M1) | §6 Non-Goals, §10.5 Clarifications | ✅ |
| Drag-to-reorder exclusion (M1) | §6 Non-Goals, §10.6 Clarifications | ✅ |

**Full Coverage:** All M1 decisions + Nova's review gaps + clarifications implemented.
