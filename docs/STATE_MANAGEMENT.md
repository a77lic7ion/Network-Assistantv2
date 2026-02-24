# Core Application State (Zustand)

### `useNetworkStore.ts`

This is the primary store. It holds the entire topology.

```typescript
interface NetworkStore {
  // React Flow state
  nodes: Node<DeviceNodeData>[];
  edges: Edge<LinkData>[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  // Device operations
  addDevice: (device: Partial<DeviceNodeData>, position: XYPosition) => string; // returns new node id
  updateDevice: (id: string, updates: Partial<DeviceNodeData>) => void;
  removeDevice: (id: string) => void;
  getDevice: (id: string) => DeviceNodeData | undefined;

  // Running config operations
  appendToRunningConfig: (deviceId: string, cliBlock: string) => void;
  setRunningConfig: (deviceId: string, config: string) => void;
  getRunningConfig: (deviceId: string) => string;

  // Selected node for detail panel
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  // Core device (the first one, special status)
  coreNodeId: string | null;
  setCoreNodeId: (id: string) => void;
}
```

### `useSettingsStore.ts`

```typescript
interface ProviderSettings {
  apiKey: string;
  selectedModel: string;
  availableModels: string[];       // fetched from provider
  status: 'unconfigured' | 'testing' | 'ok' | 'error';
  errorMessage?: string;
}

interface SettingsStore {
  providers: {
    gemini: ProviderSettings;
    openai: ProviderSettings;
    anthropic: ProviderSettings;
    mistral: ProviderSettings;
    ollama: ProviderSettings & { baseUrl: string }; // Ollama needs base URL
  };
  activeProvider: 'gemini' | 'openai' | 'anthropic' | 'mistral' | 'ollama';
  tavily: { apiKey: string; status: 'unconfigured' | 'testing' | 'ok' | 'error' };

  // Actions
  setApiKey: (provider: string, key: string) => void;
  setSelectedModel: (provider: string, model: string) => void;
  setActiveProvider: (provider: string) => void;
  fetchModels: (provider: string) => Promise<void>;   // prefetch models list
  testProvider: (provider: string) => Promise<void>;  // send ping message
  testTavily: () => Promise<void>;
}
```

### `useChatStore.ts`

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  cliBlocks?: CLIBlock[];         // extracted CLI sections from assistant output
  timestamp: number;
  validationResult?: ValidationResult;
  nodeContext?: string[];          // which node IDs were in context
}

interface ChatStore {
  // Separate chat histories: 'global' or a node ID
  histories: Record<string, ChatMessage[]>;
  activeChatScope: 'global' | string; // 'global' or node ID

  addMessage: (scope: string, message: ChatMessage) => void;
  clearHistory: (scope: string) => void;
  setActiveChatScope: (scope: string) => void;
}
```
