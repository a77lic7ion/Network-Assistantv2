# Component Tree

```
App.tsx
├── TopBar.tsx
│   └── SettingsModal.tsx (portal)
│       ├── ProviderCard.tsx [gemini]
│       │   └── ModelSelector.tsx
│       ├── ProviderCard.tsx [openai]
│       │   └── ModelSelector.tsx
│       ├── ProviderCard.tsx [anthropic]
│       │   └── ModelSelector.tsx
│       ├── ProviderCard.tsx [mistral]
│       │   └── ModelSelector.tsx
│       ├── ProviderCard.tsx [ollama]
│       │   └── ModelSelector.tsx
│       └── TavilyConfig.tsx
│
├── Sidebar.tsx
│   └── AddNodePanel.tsx
│
├── NetworkCanvas.tsx  (React Flow)
│   ├── DeviceNode.tsx  (×N, custom node)
│   │   └── NodeToolbar.tsx  (when selected)
│   └── DeviceEdge.tsx  (×M, custom edge)
│
├── RightPanel.tsx  (conditional)
│   ├── NodeDetailPanel.tsx
│   │   ├── NodeInfoTab.tsx
│   │   │   └── ConfigUploader.tsx
│   │   ├── RunningConfigTab.tsx
│   │   └── InterfacesTab.tsx
│   └── ChatPanel.tsx
│       ├── ContextSelector.tsx
│       ├── ChatMessage.tsx  (×N)
│       │   └── CLIBlock.tsx  (×M per message)
│       └── ChatInput.tsx
│
└── BottomBar.tsx
    ├── SimulatorPanel.tsx
    │   └── PingResult.tsx
    ├── GlobalConfigPanel.tsx
    │   └── ConfigDiffViewer.tsx
    └── [shortcuts to panels above]
```
