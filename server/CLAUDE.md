# Backend — Standards

## Setup (nếu chưa init)
```bash
npm init -y
npm i express
npm i -D typescript @types/express @types/node tsx vitest supertest @types/supertest
npx tsc --init --strict --module ESNext --moduleResolution bundler --outDir dist
```

Add to package.json:
```json
{ "type": "module", "scripts": { "dev": "tsx watch src/index.ts", "start": "tsx src/index.ts", "test": "vitest run" } }
```

## REQUIRED — Server Entry Point
```ts
// src/index.ts
import app from './app'
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server on ${PORT}`))
```

Server PHẢI start được. `npm run dev` PHẢI output "Server on [port]".

## Structure
```
src/
├── index.ts          # Entry (app.listen)
├── app.ts            # Express app
├── routes/
├── controllers/      # Thin: params → service → response
├── services/         # Business logic (1 function = 1 file)
└── lib/              # DB, utils, error handler
```

## Patterns

### Controller — Thin
```ts
export async function createItem(req: Request, res: Response) {
  const result = await service.create(req.body)
  res.status(201).json({ data: result })
}
// KHÔNG try/catch — global error handler
```

### Error Handling
```ts
throw new Error('Not found code:not_found')
// Handler: { error: { code: "not_found", message: "Not found" } }
```

### Response: `{ data }` success, `{ error: { code, message } }` error

## Test
- `npx vitest run`
- supertest cho API tests
- KHÔNG sửa test assertions

## Khi không chắc → dùng WebSearch tìm docs
