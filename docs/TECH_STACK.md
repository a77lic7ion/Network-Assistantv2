# Technology Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React 18 + Vite | Fast dev, HMR, modern JSX |
| Language | TypeScript | Type safety for complex network state |
| State Management | Zustand | Simple, scalable global state |
| Canvas / Topology | React Flow (`reactflow`) | Best-in-class drag-and-drop node graph |
| Styling | Tailwind CSS + shadcn/ui | Rapid, consistent UI |
| Code Blocks | `react-syntax-highlighter` | Cisco IOS syntax highlighting |
| File Parsing | Browser File API + custom parser | For uploaded blank config tabs |
| AI Providers | Native `fetch` to each REST API | No extra SDK dependencies |
| Web Search | Tavily REST API | Real-time CLI/IOS documentation lookup |
| Markdown Rendering | `react-markdown` + `remark-gfm` | Chat message rendering |
| Icons | Lucide React | Consistent icon set |
| Notifications | `sonner` (toast library) | Test results, errors |
| Persistence | `localStorage` (via Zustand `persist`) | Session state survives refresh |

### NPM Dependencies

```bash
npm create vite@latest netlab-ai -- --template react-ts
cd netlab-ai
npm install \
  zustand \
  reactflow \
  tailwindcss postcss autoprefixer \
  @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-select \
  @radix-ui/react-tooltip @radix-ui/react-scroll-area \
  lucide-react \
  react-syntax-highlighter @types/react-syntax-highlighter \
  react-markdown remark-gfm \
  sonner \
  clsx tailwind-merge \
  uuid @types/uuid
npx tailwindcss init -p
```
