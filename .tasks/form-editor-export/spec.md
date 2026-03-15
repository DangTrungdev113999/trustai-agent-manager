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
```

### 2.2 Validation Rules

| Field | Rule |
|-------|------|
| File size | <= 10MB per file |
| Emoji (IDENTITY.md) | Single Unicode emoji (use `emoji-regex` lib) |
| Filename | Exact match: `SOUL.md`, `IDENTITY.md`, `AGENTS.md` (case-sensitive) |
| .zip structure | Must contain all 3 MD files + optional manifest.json |
| MD content | Valid UTF-8, no null bytes |

### 2.3 MD Parser Logic

**Parsing strategy:**
1. Split by `## Heading` to extract sections
2. Known headings → structured fields (e.g., `## Rules` → `soul.rules[]`)
3. Unknown headings → `freeformSections[]`
4. Preserve original formatting (whitespace, list styles)

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

### 2.4 MD Generator Logic

**Generation strategy:**
1. Render structured fields → known headings
2. Append `freeformSections[]` as-is
3. Preserve user formatting (list styles, code blocks)
4. Add blank line between sections

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

**StructuredForm.tsx:**
- Dynamic fields based on `parsedData` schema
- Text inputs, textareas, emoji picker
- List editor for arrays (`soul.rules[]`, `soul.teamMembers[]`)

**FreeformSection.tsx:**
- Textarea for each `freeformSections[i].content`
- Collapsible sections (heading as label)
- "Add Section" button

**MDPreview.tsx:**
- Read-only rendered markdown (use `react-markdown`)
- Sync scroll with form (optional: scroll-sync lib)

### 3.2 File Upload Flow

**Import:**
1. User clicks "Import Workspace"
2. File picker → select .zip
3. POST `/api/workspace/import`
4. Load `files[]` into editor state
5. Switch to SOUL.md tab

**Export:**
1. User clicks "Export Workspace"
2. Collect current form state → `WorkspaceFile[]`
3. POST `/api/workspace/export`
4. Browser download .zip

### 3.3 Validation UI

- Show field errors inline (red border + message)
- Toast notifications for API errors
- Disable Export if any file has validation errors

## 4. Test Scenarios

### 4.1 Parser Tests

| Test | Input | Expected Output |
|------|-------|----------------|
| Parse SOUL.md | Valid MD with Rules + Team | `soul.rules[]` populated, `soul.teamMembers[]` extracted |
| Unknown heading | `## Custom Section` | Appears in `freeformSections[]` |
| Empty file | `""` | `{ freeformSections: [] }` (no error) |
| Invalid emoji | `name: "Marcus 🔥🔥"` | Warning: "Emoji must be single character" |
| Oversized file | 11MB MD file | Error: `INVALID_FILE` |

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
| Export → Import | Export workspace → import same .zip | Identical `parsedData` |

### 4.4 UI Tests

| Test | Action | Expected Behavior |
|------|--------|-------------------|
| Edit field | Change `soul.language` → type "English" | MD preview updates instantly |
| Add freeform section | Click "Add Section" | New textarea appears |
| Import workspace | Upload .zip | Editor loads files, switches to SOUL.md tab |
| Export workspace | Click Export | Browser downloads `workspace-export-YYYY-MM-DD.zip` |
| Validation error | Enter invalid emoji "🔥🔥" | Red border + error message |

## 5. Tech Stack

| Layer | Tech |
|-------|------|
| BE | Express, `gray-matter` (MD frontmatter), `emoji-regex` (validation) |
| FE | React 18, `react-markdown`, `emoji-picker-react` |
| Storage | None (in-memory only for M1) |
| Tests | Jest (BE), Vitest (FE) |

## 6. Non-Goals (M1)

- ❌ Multi-user editing (single-user only)
- ❌ Version history / undo
- ❌ Cloud storage (local export/import only)
- ❌ Real-time collaboration
- ❌ Auto-save to backend (all state in FE until export)

## 7. Success Criteria

- [ ] Parse all 3 workspace MD files without errors
- [ ] Generate MD from form → matches original formatting
- [ ] Import/export roundtrip preserves data (no data loss)
- [ ] Form validation prevents invalid emoji/oversized files
- [ ] MD preview syncs with form edits in <100ms
- [ ] All test scenarios pass (20+ test cases)

## 8. UX States

### 8.1 WorkspaceEditor States

| State | Trigger | UI |
|-------|---------|-----|
| Empty | Initial load, no files | "Import workspace to start" placeholder |
| Loading | Import in progress | Spinner overlay + "Processing..." |
| Error | Import/parse failed | Error banner + retry button |
| Default | Files loaded | Form + preview visible |

### 8.2 MDPreview States

| State | Trigger | UI |
|-------|---------|-----|
| Loading | Generating preview | Skeleton loader |
| Error | Generation failed | "Preview unavailable" message |
| Default | MD rendered | Scrollable markdown |

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

## 10. Clarifications

### 10.1 Emoji Validation
**Rule:** Single **rendered** emoji only (multi-codepoint allowed if visually one emoji)

**Examples:**
- ✅ `⚙️` (single codepoint with variation selector)
- ✅ `👨‍👩‍👧‍👦` (multi-codepoint, but visually one family emoji)
- ❌ `🔥🔥` (two separate emojis)
- ❌ `Marcus ⚙️` (text + emoji)

**Implementation:**
```typescript
import emojiRegex from 'emoji-regex';

function validateEmoji(input: string): boolean {
  const regex = emojiRegex();
  const matches = input.match(regex);
  return matches !== null && matches.length === 1 && input === matches[0];
}
```

### 10.2 Team Members Parsing
**SOUL.md table format:**
```markdown
## Team
| Member | Mention |
|--------|---------|
| Marcus | `<@1480799610283884608>` |
| Alex   | `<@1480799502536540323>` |
```

**Parser logic:**
1. Detect `## Team` heading
2. Find markdown table (rows with `|`)
3. Extract rows: `{ name: column1.trim(), mention: column2.trim() }`
4. Strip backticks from mention field

### 10.3 Freeform Section Order
**Guarantee:** Parse → generate roundtrip preserves:
- Section order (heading sequence)
- Content formatting (whitespace, lists)
- Heading levels (`##` vs `###`)

**UI behavior:**
- Freeform sections: collapsible (collapsed by default if >5 sections)
- Drag-to-reorder (optional M2 feature)

## 11. Updated Test Scenarios

### 11.1 Security Tests

| Test | Input | Expected Output |
|------|-------|----------------|
| XSS in MD | `SOUL.md` contains `<script>alert('xss')</script>` | Preview shows escaped text (no script execution) |
| Zip bomb | 1MB .zip expands to 200MB | Error: `ZIP_TOO_LARGE` (extracted size > 50MB) |
| Path traversal | .zip contains `../../../etc/passwd` | File ignored, warning: "Invalid filename" |
| Compression ratio | 100KB .zip expands to 20MB | Accepted (ratio 200:1 under threshold) |

### 11.2 Edge Case Tests

| Test | Input | Expected Output |
|------|-------|----------------|
| Multi-codepoint emoji | `👨‍👩‍👧‍👦` in emoji field | Accepted (visually one emoji) |
| Emoji + text | `Marcus ⚙️` | Error: "Emoji must be standalone" |
| 100 freeform sections | SOUL.md with 100 `## Custom N` headings | All parsed, UI collapses by default |
| Empty freeform section | `## Custom\n\n` (no content) | Preserved in `freeformSections[]` |

### 11.3 Roundtrip Tests

| Test | Action | Expected Behavior |
|------|--------|-------------------|
| Parse → generate | Load SOUL.md → export → compare | Byte-identical (whitespace preserved) |
| Edit freeform → roundtrip | Add text to custom section → export → import | Text preserved, section order unchanged |
| Reorder sections (UI) | Drag section 3 above section 2 → export | Generated MD reflects new order |

## 12. API Error Codes

| Code | Message | HTTP |
|------|---------|------|
| `INVALID_FILE` | File must be .md and <= 10MB | 400 |
| `INVALID_ZIP` | Missing required file: SOUL.md | 400 |
| `ZIP_TOO_LARGE` | Extracted size exceeds 50MB | 400 |
| `INVALID_EMOJI` | Emoji must be standalone and single | 400 |
| `PARSE_ERROR` | Failed to parse markdown | 500 |
| `GENERATE_ERROR` | Failed to generate markdown | 500 |

## 13. Coverage Matrix

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

**Full Coverage:** All M1 decisions implemented.
