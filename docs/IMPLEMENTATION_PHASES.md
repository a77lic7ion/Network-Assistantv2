# Implementation Phases

Build the application in this order to enable incremental testing:

### Phase 1 — Foundation (Days 1-2)

- Vite + React + TypeScript scaffold
- Tailwind + shadcn/ui setup
- Zustand stores (all three, with `persist`)
- TopBar + Sidebar layout shell
- SettingsModal (static UI, no real API calls yet)

### Phase 2 — AI Provider Integration (Days 3-4)

- `aiGateway.ts` with all five provider adapters
- Model prefetch for each provider
- Connection testing for each provider
- Tavily integration + test
- Toast notifications for test results

### Phase 3 — Canvas (Days 5-7)

- React Flow integration
- Custom `DeviceNode` component
- CORE device creation modal
- Additional node drag-and-drop + modal
- Edge creation + link config modal
- Node selection → right panel trigger

### Phase 4 — Node Detail Panel (Days 8-9)

- NodeDetailPanel with three tabs
- Info tab with inline editing
- Config uploader + `configTabParser.ts`
- Running config tab (read-only, copy)
- Interfaces tab (derived from config)

### Phase 5 — AI Chat Agent (Days 10-12)

- `ChatPanel` with ContextSelector
- `configAgent.ts` system prompt builder
- Streaming response rendering
- CLI block extraction + `CLIBlock` component
- "Apply to Running Config" button
- `runningConfigParser.ts` merge logic

### Phase 6 — Validator Agent (Days 13-14)

- `validatorAgent.ts`
- Tavily search injection into validation
- Validation result display in CLIBlock
- Automated correction loop

### Phase 7 — Simulator (Days 15-17)

- `networkSimulator.ts` path resolution engine
- Config → SimNode parser
- `SimulatorPanel` UI
- `PingResult` display with warnings

### Phase 8 — Global Config Pusher (Days 18-19)

- `globalConfigAgent.ts`
- `GlobalConfigPanel` UI
- `ConfigDiffViewer` per-node diff
- Bulk apply with individual approval

### Phase 9 — Polish (Days 20-21)

- Responsive layout tweaks
- Keyboard shortcuts (e.g., `Cmd+K` for chat, `Esc` to close panels)
- Export topology as JSON
- Import topology from JSON
- Dark mode refinements
- Error boundaries around all panels
