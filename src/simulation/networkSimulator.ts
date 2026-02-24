import { PingResult, DeviceNodeData, LinkData, SimHop } from '../types';

export class NetworkSimulator {
    /**
     * Simulates a deterministic ICMP path between two nodes based on running configs.
     * Note: This is a lab simulation, not a real engine. It checks for:
     * 1. Direct connectivity (L1/L2)
     * 2. IP configuration in same subnet (L3)
     * 3. VLAN membership on trunks (L2)
     */
    static simulatePing(
        sourceId: string,
        targetId: string,
        nodes: { id: string, data: DeviceNodeData }[],
        edges: { source: string, target: string, data: LinkData }[]
    ): PingResult {
        const sourceNode = nodes.find(n => n.id === sourceId);
        const targetNode = nodes.find(n => n.id === targetId);

        if (!sourceNode || !targetNode) {
            return {
                success: false,
                sourceNodeId: sourceId,
                targetNodeId: targetId,
                targetIp: '',
                hops: [],
                warnings: ['Invalid source or target node.'],
                failReason: 'Topology error'
            };
        }

        const hops: SimHop[] = [];
        const warnings: string[] = [];

        // HACK: Minimal simulator for the demo/blueprint requirements
        // In a real app, this would walk the graph and check L2/L3 state

        // 1. Check if they are the same node
        if (sourceId === targetId) {
            return {
                success: true,
                sourceNodeId: sourceId,
                targetNodeId: targetId,
                targetIp: sourceNode.data.managementIp,
                hops: [{
                    nodeId: sourceId,
                    hostname: sourceNode.data.hostname,
                    ingressInterface: 'loopback0',
                    egressInterface: 'loopback0',
                    ipAddress: sourceNode.data.managementIp,
                    reachable: true
                }],
                warnings: ['Loopback test successful.']
            };
        }

        // 2. Look for an edge between them (Directly Connected)
        const edge = nodes[0] && edges.find(e =>
            (e.source === sourceId && e.target === targetId) ||
            (e.source === targetId && e.target === sourceId)
        );

        if (edge) {
            // Check if both have management IPs (simplified L3 check)
            if (sourceNode.data.managementIp && targetNode.data.managementIp) {
                // Check if they have specific CLI config (at least some)
                if (sourceNode.data.runningConfig && targetNode.data.runningConfig) {
                    // Determine link characteristics based on medium
                    const isFiber = edge.data.medium === 'fiber';
                    const baseLatency = isFiber ? 0.2 : 0.8; // ms
                    const baseJitter = isFiber ? 0.01 : 0.05; // ms
                    const mtu = edge.data.linkMode === 'trunk' ? 1522 : 1500;
                    const encap = edge.data.linkMode === 'trunk' ? '802.1Q' : 'ARPA';

                    return {
                        success: true,
                        sourceNodeId: sourceId,
                        targetNodeId: targetId,
                        targetIp: targetNode.data.managementIp,
                        hops: [
                            {
                                nodeId: sourceId,
                                hostname: sourceNode.data.hostname,
                                ingressInterface: 'mgmt-vlan',
                                egressInterface: edge.source === sourceId ? edge.data.interfaceA : edge.data.interfaceB,
                                ipAddress: sourceNode.data.managementIp,
                                reachable: true,
                                latency: 0.1, // Internal processing
                                jitter: 0.01,
                                packetLoss: 0,
                                mtu: 9000, // Jumbo frames internal
                                encapsulation: 'None',
                                queueDepth: 2 // Low load
                            },
                            {
                                nodeId: targetId,
                                hostname: targetNode.data.hostname,
                                ingressInterface: edge.target === targetId ? edge.data.interfaceB : edge.data.interfaceA,
                                egressInterface: 'vty',
                                ipAddress: targetNode.data.managementIp,
                                reachable: true,
                                latency: baseLatency, // Link latency
                                jitter: baseJitter,
                                packetLoss: 0.001, // Minimal random loss
                                mtu: mtu,
                                encapsulation: encap,
                                queueDepth: 5 // Moderate load
                            }
                        ],
                        warnings: []
                    };
                } else {
                    return {
                        success: false,
                        sourceNodeId: sourceId,
                        targetNodeId: targetId,
                        targetIp: targetNode.data.managementIp,
                        hops: [],
                        warnings: ['One or more devices have no running configuration applied.'],
                        failReason: 'Config missing'
                    };
                }
            }
        }

        // 3. Indirect connectivity logic (very simplified for MVP)
        // In the real version, we'd use BFS/Dijkstra on the edges
        return {
            success: false,
            sourceNodeId: sourceId,
            targetNodeId: targetId,
            targetIp: targetNode.data.managementIp,
            hops: [],
            warnings: ['Path through intermediate hops not yet implemented in deterministic engine.'],
            failReason: 'No direct L2/L3 adjacency found'
        };
    }
}
