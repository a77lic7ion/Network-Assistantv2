# NetLab AI — Home Lab Network Configuration Assistant
## Application Blueprint for React/Vite

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Application StatNetwork AssistantNetLab AIe (Zustand)](#core-application-state-zustand)
5. [Feature Modules](#feature-modules)
   - [Settings Modal & AI Provider Configuration](#1-settings-modal--ai-provider-configuration)
   - [Canvas / Network Topology Builder](#2-canvas--network-topology-builder)
   - [Node Detail Panel](#3-node-detail-panel)
   - [AI Agent Chatbot](#4-ai-agent-chatbot)
   - [Network Simulator (Ping/Trace)](#5-network-simulator-pingtrace)
   - [Global Config Pusher](#6-global-config-pusher)
   - [Running Config Viewer ("show run")](#7-running-config-viewer-show-run)
6. [AI Agent Logic & Prompt Architecture](#ai-agent-logic--prompt-architecture)
7. [Syntax Validator Agent](#syntax-validator-agent)
8. [Tavily Web Search Integration](#tavily-web-search-integration)
9. [Internal Network Simulation Logic](#internal-network-simulation-logic)
10. [UI/UX Layout Specification](#uiux-layout-specification)
11. [Data Models (TypeScript Interfaces)](#data-models-typescript-interfaces)
12. [Component Tree](#component-tree)
13. [Environment Variables](#environment-variables)
14. [Implementation Phases](#implementation-phases)

---

## Overview

**NetLab AI** is a single-page application (SPA) that emulates a Cisco-based home lab network environment. The user can:

- **Define a network topology** by placing nodes on an interactive canvas (drag-and-drop)
- **Upload blank config tabs** per device to provide hardware context
- **Query an AI agent** in natural language for configuration tasks (e.g., "What commands do I need on Switch2 to reach Switch1?")
- **Receive validated, copy-pasteable Cisco CLI blocks** in the correct order for the software version
- **Simulate ping/traceroute** between any two nodes based on accumulated configs
- **Push global configuration** (e.g., "create VLAN 17 on all devices") and have each node's running config automatically updated
- **Review each node's current running config** (like `show run`) at any time

The app integrates with five AI providers (Gemini, OpenAI, Anthropic, Mistral, Ollama) and uses Tavily for real-time web search (for documentation lookup and syntax validation).

---

## Technology Stack

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

---

## Project Structure

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

---

## Core Application State (Zustand)

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

---

## Feature Modules

---

### 1. Settings Modal & AI Provider Configuration

**File:** `src/components/settings/SettingsModal.tsx`

**Trigger:** Click the gear icon ⚙ in the TopBar.

**Layout:** Full-screen modal with a left tab strip (one per provider + Tavily).

#### Per-Provider Panel (`ProviderCard.tsx`)

Each provider panel contains:

1. **API Key Field** — password input, stored in `useSettingsStore`.
2. **Base URL** — shown only for Ollama (default: `http://localhost:11434`).
3. **"Fetch Models" button** — calls the provider's model list endpoint, populates `availableModels`.
4. **Model Selector dropdown** — shows prefetched models. User selects the one to use.
5. **"Test Connection" button** — sends a minimal test prompt ("Reply with: OK") and shows pass/fail toast.
6. **Status indicator** — green dot (ok), red dot (error), yellow spinner (testing).

#### Model Prefetch Endpoints

| Provider | Endpoint |
|---|---|
| OpenAI | `GET https://api.openai.com/v1/models` (filter by `gpt-`) |
| Anthropic | Static list: claude-opus-4-5, claude-sonnet-4-5, claude-haiku-4-5, etc. |
| Gemini | `GET https://generativelanguage.googleapis.com/v1/models?key={KEY}` |
| Mistral | `GET https://api.mistral.ai/v1/models` |
| Ollama | `GET {BASE_URL}/api/tags` → `.models[].name` |

#### Tavily Panel (`TavilyConfig.tsx`)

- API Key input
- "Test Search" button — runs a test query: `"Cisco IOS show version syntax"` and displays the first result snippet.
- Status indicator

---

### 2. Canvas / Network Topology Builder

**File:** `src/components/canvas/NetworkCanvas.tsx`

Uses **React Flow** as the underlying graph library.

#### Initial State

On first load, the canvas is blank except for a centered prompt:  
*"Click 'Add CORE Device' to begin your lab topology."*

#### Adding the CORE Device

A prominent button in the left sidebar labelled **"＋ Add CORE Device"** opens a modal:

**CORE Device Setup Modal fields:**
- Hostname (e.g., `SW-CORE-01`)
- Management IP / Subnet (e.g., `192.168.1.1/24`)
- Vendor (dropdown: Cisco, Juniper, Arista, HP, other)
- Device Model (free text, e.g., `Catalyst 9300`)
- Software Version (free text, e.g., `17.06.01`)
- Device Type (dropdown: Switch / Router / Firewall / AP)
- Upload Blank Config Tab (file upload button, accepts `.txt`, `.log`, `.cfg`)

On submit, a node appears on the canvas with a Cisco device icon. It is tagged as `isCore: true`. The `coreNodeId` is set in the store.

#### Adding Additional Nodes

The left sidebar has a **"Add Device"** palette. The user **drags** a device type icon from this palette onto the canvas. On drop, a modal appears:

**New Node Setup Modal fields:**
- Hostname
- Management IP / Subnet
- Vendor
- Device Model
- Software Version
- Device Type
- Upload Blank Config Tab (optional at this stage)

The new node is connected to the canvas. The user can then draw edges between nodes by dragging from one node's handle to another.

#### Custom Node Component (`DeviceNode.tsx`)

Visual design per node:

```
┌─────────────────────────────┐
│  [ICON]  SW-CORE-01  [CORE] │  ← isCore gets a gold badge
│  Cisco Catalyst 9300        │
│  IOS-XE 17.06.01            │
│  192.168.1.1/24             │
│  ● Configured  (2 blocks)   │  ← green if has CLI config
└─────────────────────────────┘
```

**On click** → opens the Node Detail Panel (right panel slides in).

#### Edge Handling

When two nodes are connected via a React Flow edge, a modal prompts for:
- Interface on Node A (e.g., `GigabitEthernet1/0/1`)
- Interface on Node B (e.g., `GigabitEthernet0/1`)
- Link type (Trunk / Access / Routed)
- VLAN (if Access mode)

This data is stored in `LinkData` and is used by the simulator and AI agent.

---

### 3. Node Detail Panel

**File:** `src/components/node-detail/NodeDetailPanel.tsx`

Slides in from the right when a node is clicked. Three tabs:

#### Tab 1: Info

Displays all device metadata (hostname, IP, vendor, model, software version, type). All fields are editable inline. Also shows a re-upload button for the blank config tab.

**Blank Config Tab Parsing (`configTabParser.ts`):**

When a file is uploaded, the parser:
1. Reads the file as plain text.
2. Extracts key/value pairs from common Cisco "show" table formats.
3. Stores the parsed result as `DeviceNodeData.blankConfigContext` (a string blob used verbatim in AI prompts for context).
4. Shows a preview of the parsed content in the Info tab.

#### Tab 2: Running Config

**File:** `src/components/node-detail/RunningConfigTab.tsx`

Displays the accumulated CLI configuration for this device, formatted exactly as a `show running-config` output:

```
! ==============================
! Running Config: SW-CORE-01
! Last Updated: 2024-01-15 14:32
! ==============================
version 17.06.01
hostname SW-CORE-01
!
vlan 17
 name MGMT
!
interface GigabitEthernet1/0/1
 switchport mode trunk
 switchport trunk allowed vlan 1,17
!
```

Controls:
- **Copy All** button (copies full config to clipboard)
- **Clear Config** button (with confirmation dialog)
- Config is **read-only** in this view; it is updated programmatically by the AI agent and global config pusher.

#### Tab 3: Interfaces

Auto-derived from the running config. Shows a table:

| Interface | Status | Mode | VLANs | Description |
|---|---|---|---|---|
| Gi1/0/1 | Configured | Trunk | 1,17,100 | → SW-ACCESS-01 |
| Gi1/0/2 | Unconfigured | — | — | — |

---

### 4. AI Agent Chatbot

**File:** `src/components/chat/ChatPanel.tsx`

The chat panel is accessible from:
- The **right panel** (context: selected node)  
- A **floating chat button** (context: global / multi-node)

#### Context Selector (`ContextSelector.tsx`)

At the top of the chat panel, a multi-select chip list shows all nodes. The user toggles which nodes are "in context" for this conversation. By default, if a node is selected on canvas, it is pre-checked.

The AI agent receives the running configs of all checked nodes.

#### Chat Input

- Multi-line text area
- Shift+Enter for newline, Enter to send
- A small "🌐 Use Web Search" toggle (enables Tavily lookup for this message)

#### Message Rendering (`ChatMessage.tsx`)

AI responses are rendered as markdown. CLI sections are detected and extracted into `CLIBlock` components.

**CLI Block Detection:**  
Any fenced code block tagged with `cisco`, `ios`, `cli`, or just backticks with lines starting with IOS commands is extracted into a `CLIBlock`.

#### CLI Block Component (`CLIBlock.tsx`)

Each CLI block renders as:

```
╔══════════════════════════════════════════════════════════╗
║  📋 Section: Configure VLAN 17                           ║
║  Device: SW-CORE-01  |  Apply in order: Step 1 of 3     ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  SW-CORE-01# configure terminal                          ║
║  SW-CORE-01(config)# vlan 17                             ║
║  SW-CORE-01(config-vlan)# name MGMT_VLAN                 ║
║  SW-CORE-01(config-vlan)# exit                           ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  ✅ Validated: Syntax OK for IOS-XE 17.06.01             ║
║  [Copy Block]  [Apply to Running Config]                 ║
╚══════════════════════════════════════════════════════════╝
```

**"Apply to Running Config"** button: When clicked, the CLI from this block is appended to the target node's running config in the store. The running config parser normalises and deduplicates entries.

---

### 5. Network Simulator (Ping/Trace)

**File:** `src/components/simulator/SimulatorPanel.tsx`

Accessible via the bottom toolbar or the sidebar. This is a **fully synthetic simulation** — no real network traffic. All logic is deterministic based on stored configs.

#### UI

```
Source Node:   [SW-CORE-01   ▼]   Source IP: 192.168.1.1
Target Node:   [SW-ACCESS-04 ▼]   Target IP: 192.168.4.10

[  Simulate Ping  ]   [  Simulate Traceroute  ]
```

#### Output

```
Simulating: SW-CORE-01 → SW-ACCESS-04
Path: SW-CORE-01 → SW-DIST-01 → SW-ACCESS-04

Hop 1: SW-DIST-01  (192.168.1.2)   ✅ Reachable   <1ms (sim)
Hop 2: SW-ACCESS-04 (192.168.4.10) ✅ Reachable   <1ms (sim)

Result: SUCCESS — End-to-end connectivity confirmed.
        Common VLAN: 17 (MGMT_VLAN)

⚠️  Warning: GigabitEthernet1/0/3 on SW-DIST-01 has no trunk 
    allowed VLAN list defined. VLAN 17 may be blocked in a real 
    environment.
```

If the path fails, the simulator identifies **the exact hop, interface, and reason** (e.g., "No route", "VLAN not allowed on trunk", "Interface not configured").

---

### 6. Global Config Pusher

**File:** `src/components/global-config/GlobalConfigPanel.tsx`

Accessible from the sidebar. Allows applying a configuration directive to all (or selected) nodes at once.

#### UI

```
Global Configuration Command
─────────────────────────────
Enter a directive in plain English or Cisco CLI:

[ Create VLAN 17 named MGMT on all switches              ]

Target Nodes: ☑ All  ☐ Select...
              [SW-CORE-01] [SW-DIST-01] [SW-ACCESS-01] ...

[ Generate Configs ]
```

#### Flow

1. User enters directive.
2. Hits "Generate Configs".
3. `globalConfigAgent.ts` is called with the directive + all selected nodes' contexts.
4. The AI generates per-node CLI blocks (only the delta — what each node still needs).
5. A **diff view** is shown: for each node, the proposed config additions are displayed.
6. The user can approve individually per node or "Apply All".
7. On approval, configs are merged into each node's running config.

---

### 7. Running Config Viewer ("show run")

Already covered in Node Detail Panel Tab 2. Additional notes:

**Config Merger Logic (`runningConfigParser.ts`):**

When a new CLI block is applied:
1. Parse the existing running config into a structured tree (sections by mode: `vlan`, `interface`, `router`, global).
2. Parse the new CLI block.
3. Merge: for each config line, check if it already exists. If so, skip (idempotent). If not, insert into the correct section.
4. Re-serialise to IOS text format.
5. Store the result.

This ensures the running config never has duplicate entries.

---

## AI Agent Logic & Prompt Architecture

**File:** `src/agents/configAgent.ts`

### System Prompt Template

```
You are NetLab AI, an expert Cisco network engineer assistant specialising in 
Cisco IOS, IOS-XE, IOS-XR, and NX-OS configuration for lab environments.

## Your Capabilities:
- Generate precise, copy-pasteable Cisco CLI configuration blocks
- Always reference the EXACT software version provided for syntax compatibility
- Ask clarifying questions if any detail is ambiguous
- Validate your own output before presenting it

## Current Network Topology:
{{TOPOLOGY_SUMMARY}}

## Nodes In Context:
{{NODE_CONTEXTS}}

## Rules for Output:
1. ALWAYS structure CLI output in numbered sections (Step 1, Step 2...).
2. Each step must be in a fenced code block tagged with: ```cisco
3. Each code block must start with the device prompt (e.g., SW-CORE-01#)
4. Include ALL prerequisite commands (e.g., `conf t` before interface config)
5. Include `end` and optionally `write memory` / `copy run start` at the end
6. If web search was used, cite the source URL in a note below the block
7. If you need information not provided, ask the user before generating config

## Software Version Awareness:
- Always check syntax compatibility for the stated IOS version
- Flag deprecated or version-incompatible commands with a ⚠️ warning
```

### Node Context Block Format

For each node in context, inject:

```
--- Node: {{HOSTNAME}} ---
Vendor: {{VENDOR}} | Model: {{MODEL}} | Software: {{SOFTWARE_VERSION}}
Management IP: {{MGMT_IP}}
Device Type: {{DEVICE_TYPE}}
Connected to: {{CONNECTION_LIST}}

Blank Config Tab (hardware capabilities):
{{BLANK_CONFIG_TAB_CONTENT}}

Current Running Config:
{{RUNNING_CONFIG}}
---
```

### Topology Summary Format

```
Network Topology ({{NODE_COUNT}} devices, {{EDGE_COUNT}} links):
{{FOR EACH EDGE}}
- {{NODE_A_HOSTNAME}} [{{INTERFACE_A}}] ←→ [{{INTERFACE_B}}] {{NODE_B_HOSTNAME}}
  Link: {{LINK_TYPE}} | VLANs: {{VLANS}}
{{END FOR}}
```

### AI Gateway (`aiGateway.ts`)

Unified dispatcher that routes to the active provider:

```typescript
async function callAI(messages: ChatMessage[], options?: AIOptions): Promise<string> {
  const { activeProvider, providers } = useSettingsStore.getState();
  switch (activeProvider) {
    case 'openai':    return callOpenAI(messages, providers.openai);
    case 'anthropic': return callAnthropic(messages, providers.anthropic);
    case 'gemini':    return callGemini(messages, providers.gemini);
    case 'mistral':   return callMistral(messages, providers.mistral);
    case 'ollama':    return callOllama(messages, providers.ollama);
  }
}
```

Each provider function normalises the messages array to that provider's format and handles streaming if available. The response is streamed token-by-token to the chat UI via a callback.

---

## Syntax Validator Agent

**File:** `src/agents/validatorAgent.ts`

This agent runs **before** the configuration output is shown to the user. It is a second AI call (or a structured self-critique pass).

### Validation Prompt

```
You are a Cisco IOS syntax validator.

Review the following CLI commands for the device:
  Software Version: {{SOFTWARE_VERSION}}
  Vendor: {{VENDOR}}
  Device Type: {{DEVICE_TYPE}}

CLI to validate:
{{CLI_BLOCK}}

Respond ONLY with a JSON object:
{
  "valid": true | false,
  "issues": [
    {
      "line": "the exact problematic line",
      "issue": "description of the problem",
      "severity": "error" | "warning",
      "fix": "corrected command"
    }
  ],
  "softwareNotes": "any version-specific caveats",
  "webSearchNeeded": true | false,
  "searchQuery": "optional: what to search if uncertain"
}
```

### Validator Flow

```
AI generates CLI output
         ↓
validatorAgent() called with CLI + device metadata
         ↓
If webSearchNeeded → tavilySearch(searchQuery)
         ↓          inject results into validator prompt
         ↓          re-run validator
         ↓
If issues found → AI corrects CLI (targeted fix prompt)
         ↓
Validated CLI is returned with ValidationResult attached
         ↓
CLIBlock renders with ✅ or ⚠️ status + issue details
```

### Validator Display

If issues are found, the CLIBlock shows an expandable section:

```
⚠️  Validation Issues Found (1 warning):
└── Line: "spanning-tree portfast trunk"
    Warning: 'portfast trunk' is only valid on IOS-XE 16.x+
    Your version: 17.06.01 — This command is valid ✓
    Note: Confirmed via Cisco documentation (search result cited)
```

---

## Tavily Web Search Integration

**File:** `src/agents/tavilySearch.ts`

### API Call

```typescript
async function tavilySearch(query: string): Promise<TavilyResult[]> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: useSettingsStore.getState().tavily.apiKey,
      query,
      search_depth: 'advanced',
      include_domains: ['cisco.com', 'networklessons.com', 'packetlife.net'],
      max_results: 5
    })
  });
  const data = await response.json();
  return data.results;
}
```

### When Tavily is Used

1. **Validator Agent** — when `webSearchNeeded: true` in validation JSON.
2. **Config Agent** — when user has the "🌐 Use Web Search" toggle on.
3. **Simulator** — when a routing/VLAN scenario is ambiguous and needs best-practice lookup.
4. **Global Config Agent** — when applying a complex directive (e.g., "configure OSPF area 0").

Search results are injected into the agent prompt as a `[WEB CONTEXT]` section and citations are appended to the AI output.

---

## Internal Network Simulation Logic

**File:** `src/simulation/networkSimulator.ts`

This is a **pure TypeScript logic engine** — no AI calls. It operates on the deterministic state stored in the network store.

### Data Structures

```typescript
interface SimNode {
  id: string;
  hostname: string;
  interfaces: SimInterface[];
  vlans: SimVlan[];
  routes: SimRoute[];      // parsed from running config
}

interface SimInterface {
  name: string;           // e.g., "GigabitEthernet1/0/1"
  mode: 'access' | 'trunk' | 'routed' | 'shutdown';
  accessVlan?: number;
  trunkAllowedVlans?: number[];
  ipAddress?: string;
  subnetMask?: string;
  connectedTo?: { nodeId: string; interface: string };
}

interface SimRoute {
  prefix: string;
  mask: string;
  nextHop?: string;
  isConnected: boolean;
}
```

### Config Parsing into Simulation Model

`runningConfigParser.ts` exports a function:

```typescript
function parseRunningConfigToSimNode(rawConfig: string, deviceMeta: DeviceNodeData): SimNode
```

This parses the IOS text config into the structured `SimNode` format used by the simulator.

### Path Resolution Algorithm

```
simulatePing(sourceNodeId, targetIP):

1. Parse all node running configs → build array of SimNodes
2. Build adjacency graph from React Flow edges + parsed interface data
3. BFS/Dijkstra from source node:
   a. At each hop, check:
      - Does this node have a route to targetIP?
      - Is the outgoing interface configured and not shutdown?
      - Is the VLAN allowed on the trunk link to the next hop?
      - Is the target IP in the same subnet or reachable via default route?
4. At each hop, collect warnings (e.g., "trunk missing VLAN", "no route")
5. Return: { success, hops[], warnings[], failReason? }
```

### Ping Result

```typescript
interface PingResult {
  success: boolean;
  hops: {
    nodeId: string;
    hostname: string;
    ingressInterface: string;
    egressInterface: string;
    ipAddress: string;
    reachable: boolean;
  }[];
  warnings: string[];
  failedAtHop?: number;
  failReason?: string;
}
```

---

## UI/UX Layout Specification

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

---

## Data Models (TypeScript Interfaces)

**File:** `src/types/index.ts`

```typescript
// ─── Device ───────────────────────────────────────────────────────────

export type DeviceType = 'switch' | 'router' | 'firewall' | 'ap' | 'server';
export type Vendor = 'cisco' | 'juniper' | 'arista' | 'hp' | 'other';

export interface DeviceNodeData {
  hostname: string;
  managementIp: string;         // e.g., "192.168.1.1/24"
  vendor: Vendor;
  deviceModel: string;          // e.g., "Catalyst 9300"
  softwareVersion: string;      // e.g., "17.06.01"
  deviceType: DeviceType;
  isCore: boolean;
  blankConfigContext: string;   // raw text of uploaded config tab
  runningConfig: string;        // accumulated IOS config (show run equivalent)
  configBlockCount: number;     // how many CLI blocks have been applied
  label: string;                // display name on canvas
}

// ─── Link / Edge ──────────────────────────────────────────────────────

export type LinkMode = 'trunk' | 'access' | 'routed' | 'unconfigured';

export interface LinkData {
  interfaceA: string;           // e.g., "GigabitEthernet1/0/1"
  interfaceB: string;
  linkMode: LinkMode;
  allowedVlans?: number[];      // for trunk links
  accessVlan?: number;          // for access links
  description?: string;
}

// ─── CLI Blocks ────────────────────────────────────────────────────────

export interface CLIBlock {
  id: string;
  section: string;              // e.g., "Configure VLAN 17"
  targetNodeId: string;
  step: number;
  totalSteps: number;
  commands: string;             // raw CLI text
  validation: ValidationResult | null;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  softwareNotes: string;
  webSearchUsed: boolean;
  searchCitations?: string[];
}

export interface ValidationIssue {
  line: string;
  issue: string;
  severity: 'error' | 'warning';
  fix: string;
}

// ─── Simulation ─────────────────────────────────────────────────────────

export interface SimHop {
  nodeId: string;
  hostname: string;
  ingressInterface: string;
  egressInterface: string;
  ipAddress: string;
  reachable: boolean;
}

export interface PingResult {
  success: boolean;
  sourceNodeId: string;
  targetNodeId: string;
  targetIp: string;
  hops: SimHop[];
  warnings: string[];
  failedAtHop?: number;
  failReason?: string;
}

// ─── AI Provider ──────────────────────────────────────────────────────

export type ProviderName = 'gemini' | 'openai' | 'anthropic' | 'mistral' | 'ollama';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TavilyResult {
  url: string;
  title: string;
  content: string;
  score: number;
}
```

---

## Component Tree

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

---

## Environment Variables

**File:** `.env` (add to `.gitignore`)

```env
# These are fallback defaults. Users set their keys in the Settings modal.
# Keys entered in the UI are stored in localStorage via Zustand persist.

VITE_DEFAULT_OPENAI_KEY=
VITE_DEFAULT_ANTHROPIC_KEY=
VITE_DEFAULT_GEMINI_KEY=
VITE_DEFAULT_MISTRAL_KEY=
VITE_DEFAULT_TAVILY_KEY=
VITE_OLLAMA_BASE_URL=http://localhost:11434
```

---

## Implementation Phases

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

---

## Agent Files

### `AGENT_CONFIG.md` — Config Agent Specification

```markdown
# Config Agent — NetLab AI

## Role
Expert Cisco network engineer. Generate correct CLI configs.

## Input Schema
- userMessage: string
- nodesInContext: DeviceNodeData[]
- topologyEdges: LinkData[]
- tavilyResults?: TavilyResult[]

## Output Schema
Respond in markdown. CLI must be in fenced blocks tagged ```cisco.
Each block must have a comment header: ! === Section Name ===
Number all blocks sequentially.

## Constraints
- Never skip prerequisite modes (conf t, interface declarations)
- Always include 'end' at the close of each block
- Always note if a command is version-specific
- Ask one clarifying question if ANY required detail is missing
```

### `AGENT_VALIDATOR.md` — Validator Agent Specification

```markdown
# Validator Agent — NetLab AI

## Role
Cisco IOS syntax checker. Validate before output.

## Input
Raw CLI block + device metadata (vendor, model, software version).

## Output
JSON only. No prose. Schema:
{
  "valid": boolean,
  "issues": Array<{line, issue, severity, fix}>,
  "softwareNotes": string,
  "webSearchNeeded": boolean,
  "searchQuery": string | null
}

## Rules
- Flag deprecated commands for the given IOS version
- Flag IOS-XE vs IOS-classic syntax differences
- Flag NX-OS syntax if device is Nexus series
- Flag commands that require feature enablement (e.g., `feature ospf` on NX-OS)
```

