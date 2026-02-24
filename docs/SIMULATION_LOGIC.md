# Internal Network Simulation Logic

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
