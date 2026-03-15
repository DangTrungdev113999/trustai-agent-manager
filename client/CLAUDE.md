# Frontend — Standards

## Setup (nếu chưa init)
```bash
npm create vite@latest . -- --template react-ts && npm i
npx shadcn@latest init
npm i lucide-react react-hook-form @hookform/resolvers zod @tanstack/react-query zustand sonner
npm i -D @tailwindcss/vite @testing-library/react @testing-library/jest-dom jsdom
npx shadcn@latest add button input label card dialog select toast
```

## REQUIRED — Không dùng HTML thuần
- **shadcn/ui** cho MỌI UI (button, input, select, dialog, card)
- **sonner** cho MỌI mutation feedback (toast)
- **lucide-react** cho icons
- **React Hook Form + zod** cho forms + validation
- **TanStack Query v5** cho server state
- **Zustand** cho client state

## Folder Structure
```
src/
├── app/            # App shell (App.tsx, router, providers)
├── features/       # 1 feature = 1 folder
│   └── {name}/
│       ├── components/
│       ├── hooks/
│       ├── api/        # TanStack Query hooks
│       └── schemas/    # Zod schemas
├── components/ui/  # shadcn/ui generated
├── hooks/          # Shared hooks
└── lib/            # api client, utils
```

## Patterns

### API (TanStack Query)
```tsx
const queryKeys = { all: ['items'], list: (f) => [...queryKeys.all, f] }
const useItems = (filters) => useQuery({ queryKey: queryKeys.list(filters), queryFn: () => api.get('/api/items') })
const useCreateItem = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (d) => api.post('/api/items', d), onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.all }) }) }
```

### Form (React Hook Form + Zod)
```tsx
const schema = z.object({ title: z.string().min(1), description: z.string().optional() })
const form = useForm({ resolver: zodResolver(schema) })
```

### Component States — REQUIRED cho mọi async component
| State | Pattern |
|-------|---------|
| Loading | Skeleton (không spinner) |
| Error | Message + Retry button |
| Empty | Icon + Message + CTA |
| Success | Render data |

### Toast (mọi mutation)
```tsx
toast.promise(mutation.mutateAsync(data), { loading: 'Saving...', success: 'Done!', error: (e) => e.message })
```

## Vite Config — REQUIRED
```ts
export default defineConfig({
  server: {
    allowedHosts: true,
    port: FE_PORT,       // từ state.json
    proxy: { '/api': 'http://localhost:BE_PORT' }
  },
  resolve: { alias: { '@': resolve(__dirname, 'src'), '@shared': resolve(__dirname, '../shared') } }
})
```

## Test
- `npx vitest run` từ client/
- Render tests only. NO vi.mock()
- Pattern: `render(<MemoryRouter><Component /></MemoryRouter>)`

## Khi không chắc → dùng WebSearch tìm docs
