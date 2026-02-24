# UI/UX Layout Specification

### Overall Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  TopBar: [NetLab AI Logo]  [Active Provider Badge]  [⚙ Settings]   │
├──────┬──────────────────────────────────────────────┬───────────────┤
│      │                                              │               │
│ Side │            CANVAS (React Flow)               │  Node Detail  │
│ bar  │                                              │  OR Chat      │
│      │   [Nodes and edges rendered here]            │  Panel        │
│      │                                              │  (slide-in)   │
│      │                                              │               │
│      │                                              │               │
├──────┴──────────────────────────────────────────────┴───────────────┤
│  BottomBar: [Simulator] [Global Config] [Chat] [Show Run All]       │
└─────────────────────────────────────────────────────────────────────┘
```

### Sidebar Contents

```
┌──────────────┐
│  NetLab AI   │
│  ──────────  │
│  + CORE Dev  │  ← Adds first/core device
│  + Add Node  │  ← Opens node type picker
│  ──────────  │
│  [≡] Topo    │  ← Topology overview / list
│  [⚡] Sim    │  ← Ping / trace simulator
│  [🌐] Global │  ← Global config push
│  [💬] Chat   │  ← Global chat (all nodes)
│  ──────────  │
│  [? Help]    │
└──────────────┘
```

### Color Scheme

- **Background:** `#0f1117` (dark)
- **Canvas:** `#141824`
- **Node cards:** `#1e2433` with `#2a3347` border
- **Core node accent:** Gold `#f5a623`
- **Accent / primary:** Cisco blue `#1ba0d7`
- **CLI blocks:** `#0d1117` background, `#00ff88` text (terminal green)
- **Success:** `#22c55e` | **Warning:** `#f59e0b` | **Error:** `#ef4444`
