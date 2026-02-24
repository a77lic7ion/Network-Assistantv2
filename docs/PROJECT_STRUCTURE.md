# Project Structure

```
netlab-ai/
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx                        # Root layout
│   ├── index.css                      # Tailwind directives
│   │
│   ├── store/
│   │   ├── useNetworkStore.ts         # Nodes, edges, topology
│   │   ├── useSettingsStore.ts        # API keys, selected model per provider
│   │   ├── useChatStore.ts            # Chat history per node / global
│   │   └── useSimulationStore.ts      # Ping/trace results
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx            # Left nav / tools
│   │   │   ├── TopBar.tsx             # App title, settings trigger
│   │   │   └── RightPanel.tsx         # Sliding detail / chat panel
│   │   │
│   │   ├── settings/
│   │   │   ├── SettingsModal.tsx      # Root modal
│   │   │   ├── ProviderCard.tsx       # Per-provider config (key, model, test)
│   │   │   ├── ModelSelector.tsx      # Dropdown with prefetched models
│   │   │   └── TavilyConfig.tsx       # Tavily API key + test
│   │   │
│   │   ├── canvas/
│   │   │   ├── NetworkCanvas.tsx      # React Flow wrapper
│   │   │   ├── DeviceNode.tsx         # Custom React Flow node component
│   │   │   ├── DeviceEdge.tsx         # Custom edge with link label
│   │   │   ├── NodeToolbar.tsx        # Floating toolbar above selected node
│   │   │   └── AddNodePanel.tsx       # Drag-source sidebar for new nodes
│   │   │
│   │   ├── node-detail/
│   │   │   ├── NodeDetailPanel.tsx    # Tabbed panel for selected node
│   │   │   ├── NodeInfoTab.tsx        # IP, hostname, vendor, software, model
│   │   │   ├── RunningConfigTab.tsx   # "show run" viewer (read-only + copy)
│   │   │   ├── InterfacesTab.tsx      # Interface status table derived from config
│   │   │   └── ConfigUploader.tsx     # Upload blank config tab, parse, store
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatPanel.tsx          # Chat interface (global or node-scoped)
│   │   │   ├── ChatMessage.tsx        # Renders markdown + CLI code blocks
│   │   │   ├── CLIBlock.tsx           # Sectioned code block with copy button
│   │   │   ├── ChatInput.tsx          # Text input + send
│   │   │   └── ContextSelector.tsx    # Choose which nodes are in AI context
│   │   │
│   │   ├── simulator/
│   │   │   ├── SimulatorPanel.tsx     # Ping/trace UI
│   │   │   ├── PingResult.tsx         # Display hop-by-hop result
│   │   │   └── SimEngine.ts           # Pure logic — path resolution engine
│   │   │
│   │   └── global-config/
│   │       ├── GlobalConfigPanel.tsx  # "Apply to all" command entry
│   │       └── ConfigDiffViewer.tsx   # Before/after per node diff
│   │
│   ├── agents/
│   │   ├── aiGateway.ts              # Unified AI provider call dispatcher
│   │   ├── configAgent.ts            # System prompt + config generation logic
│   │   ├── validatorAgent.ts         # Pre-output CLI syntax validation
│   │   ├── globalConfigAgent.ts      # Multi-node config push agent
│   │   └── tavilySearch.ts           # Tavily web search wrapper
│   │
│   ├── parsers/
│   │   ├── configTabParser.ts        # Parse uploaded blank config tab text
│   │   └── runningConfigParser.ts    # Parse/merge incremental IOS config
│   │
│   ├── simulation/
│   │   └── networkSimulator.ts       # Full path-resolution + VLAN/IP logic
│   │
│   ├── types/
│   │   └── index.ts                  # All TypeScript interfaces
│   │
│   └── lib/
│       ├── utils.ts                  # cn(), clamp(), etc.
│       └── constants.ts              # Default prompts, vendor lists, etc.
│
├── .env                              # API keys (never committed)
├── vite.config.ts
└── tailwind.config.ts
```
