# agent-manager

## Project
- Description: Agent Manager — config agents + preview + export
- Ports: BE=3015, FE=5187
- Spec: `.tasks/[feature]/spec.md`

## Structure
```
agent-manager/
  client/          ← FE (đọc client/CLAUDE.md khi cd vào)
  server/          ← BE (đọc server/CLAUDE.md khi cd vào)
  shared/types/    ← Source of truth cho types
  .tasks/          ← Spec files
  .openclaw/       ← State + decisions
```

## Workflow
1. Đọc spec tại `.tasks/[feature]/spec.md` — đây là source of truth
2. Viết types trong `shared/types/`
3. BE implement trong `server/` → cd server trước khi code
4. FE implement trong `client/` → cd client trước khi code
5. Test: `npx vitest run` từ root

## Rules
- TypeScript strict, no `any`
- `shared/types/` = source of truth — FE + BE import từ đây
- Mọi logic phải có tests
- KHÔNG sửa test assertions — chỉ fix implementation
- Commit message: `feat|fix|test|chore: [description]`
