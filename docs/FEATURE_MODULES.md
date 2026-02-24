# Feature Modules

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
