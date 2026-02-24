# NetLab AI Implementation Todo List

## Phase 1: Foundation

- [x] Initialize Vite project with React + TS
- [x] Install dependencies (zustand, reactflow, tailwind, shadcn, etc.)
- [x] Configure Tailwind CSS
- [x] Set up project folder structure
- [x] Implement Zustand stores with persistence:
  - [x] `useNetworkStore` (Nodes, Edges)
  - [x] `useSettingsStore` (API Keys, Models)
  - [x] `useChatStore` (History)
- [x] Create TopBar and Sidebar shell components

## Phase 2: AI Provider & Tavily Integration

- [x] Implement `aiGateway.ts` with retry/error handling
- [x] Add AI provider adapters (Gemini, OpenAI, Anthropic, Mistral, Ollama)
- [x] Add model prefetching logic
- [x] Implement Tavily search wrapper
- [x] Add connection testing in SettingsModal

## Phase 3: Canvas / Network Topology

- [x] Initialize React Flow with `fitView` and `DeviceNode` map
- [x] Implement `DeviceNode` custom component
- [x] Implement device addition modals (CORE and default)
- [x] Implement `onConnect` handler with link configuration modal
- [ ] Add drag-and-drop node palette

## Phase 4: Node Detail Panel

- [x] Implement sliding `RightPanel`
- [x] Create `NodeDetailPanel` with tabs (Info, Running Config, Interfaces)
- [x] Implement `ConfigUploader` using `FileReader.readAsText()`
- [x] Implement `configTabParser.ts` for raw context extraction
- [x] Implement `RunningConfigTab` (string-based viewer)

## Phase 5: AI Chat Agent

- [ ] Implement `ChatPanel` with `ContextSelector`
- [x] Create `NodeDetailPanel.tsx` with tabs
- [x] Implement deterministic `networkSimulator.ts`
- [x] Add Interface inventory extraction logic
- [x] Add `RunningConfigTab.tsx` with code highlighting
- [x] Implement basic drag-and-drop config uploader

### Phase 5: AI Chat Agent (Advanced)

- [x] Create `ChatPanel.tsx` with markdown support
- [x] Implement `CLIBlock.tsx` for interactive commands
- [x] Develop `ConfigAgent.ts` for detailed system prompts
- [x] Add ability to "Apply to Node" which updates `runningConfig` in store
- [x] Implement chat context (global vs node-specific)

### Phase 6: Syntax Validator & Search

- [x] Implement `ValidatorAgent.ts` for syntax checking
- [x] Integrate `TavilySearch.ts` for live docs lookup
- [x] Add "Validate" button to CLI blocks
- [x] Display inline validation errors and suggested fixes

### Phase 7: Global Config Pusher

- [x] Create `GlobalConfigPanel.tsx`
- [x] Develop `GlobalConfigAgent.ts` for multi-node tasks
- [x] Add summary of changes before applying
- [x] Implement "Push to All" logic

### Phase 8: Refinement & Polish

- [x] Finish deterministic simulation engine
- [x] Add smooth animations (framer-motion-less version)
- [x] Implement persistence for all stores
- [x] Final CSS polish for high-end aesthetic
uts
- [x] Final UI/UX tweaks (animations, transitions)

---

## Critical Rules & Guidelines

- **Source of Truth**: Zustand stores are the absolute source of truth.
- **AI Error Handling**: All AI calls wrapped in try/catch with user-facing toasts.
- **Ollama CORS**: Note in settings: `OLLAMA_ORIGINS=* ollama serve`.
- **Running Config**: Store and manipulate as a string.
- **Persistence**: Persist topology, configs, settings, chat history. Do NOT persist simulation results.
- **Edge Creation**: Open link config BEFORE adding edge to store.
- **File Parsing**: Raw text storage for uploaded config tabs.
