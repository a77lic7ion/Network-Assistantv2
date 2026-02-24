# Data Models (TypeScript Interfaces)

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
