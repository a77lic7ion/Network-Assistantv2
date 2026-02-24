import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect, applyNodeChanges, applyEdgeChanges, addEdge, XYPosition } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { DeviceNodeData, LinkData, Project } from '../types';
import { RunningConfigParser } from '../parsers/runningConfigParser';
import { ConfigTabParser, ParsedInterface } from '../parsers/configTabParser';

interface NetworkState {
    nodes: Node<DeviceNodeData>[];
    edges: Edge<LinkData>[];
    selectedNodeId: string | null;
    coreNodeId: string | null;
    projects: Project[];
    currentProjectId: string | null;

    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;

    addDevice: (device: Partial<DeviceNodeData>, position: XYPosition) => string;
    updateDevice: (id: string, updates: Partial<DeviceNodeData>) => void;
    removeDevice: (id: string) => void;
    getDevice: (id: string) => DeviceNodeData | undefined;
    getNodesForCurrentProject: () => Node<DeviceNodeData>[];

    appendToRunningConfig: (deviceId: string, cliBlock: string) => void;
    setRunningConfig: (deviceId: string, config: string) => void;
    getRunningConfig: (deviceId: string) => string;

    setSelectedNodeId: (id: string | null) => void;
    setCoreNodeId: (id: string) => void;
    autoConnectNodes: (deviceId: string) => void;
    bulkAddDevices: (devices: { data: Partial<DeviceNodeData>, config: string }[]) => void;
    addProject: (name: string) => string;
    removeProject: (id: string) => void;
    setCurrentProjectId: (id: string | null) => void;
    assignNodeToProject: (nodeId: string, projectId: string) => void;
    applyProposedLinks: (proposals: ProposedLink[]) => void;
    generateSyncCLI: (edge: Edge<LinkData>) => void;
    groupConnectedDevices: () => void;
    clearCurrentProject: () => void;
}

export interface ProposedLink {
    id: string;
    sourceId: string;
    targetId: string;
    sourceHostname: string;
    targetHostname: string;
    interfaceA: string;
    interfaceB: string;
    linkMode: 'trunk' | 'access' | 'routed' | 'unconfigured';
    medium: 'ethernet' | 'fiber';
    confidence: number;
    reason: string;
}

export const useNetworkStore = create<NetworkState>()(
    persist(
        (set, get) => ({
            nodes: [],
            edges: [],
            selectedNodeId: null,
            coreNodeId: null,
            projects: [],
            currentProjectId: null,

            onNodesChange: (changes) => {
                set({
                    nodes: applyNodeChanges(changes, get().nodes),
                });
            },
            onEdgesChange: (changes) => {
                set({
                    edges: applyEdgeChanges(changes, get().edges),
                });
            },
            onConnect: (connection) => {
                // Edge handling: Opens link configuration modal BEFORE adding edge per user rules
                // This will be triggered by the UI, but here we provide the state update
                set({
                    edges: addEdge(connection, get().edges),
                });
            },

            addDevice: (device, position) => {
                const id = uuidv4();
                const projectId = get().currentProjectId || null;
                const newNode: Node<DeviceNodeData> = {
                    id,
                    type: 'deviceNode',
                    position,
                    data: {
                        hostname: device.hostname || `Device-${id.slice(0, 4)}`,
                        managementIp: device.managementIp || '',
                        vendor: device.vendor || 'cisco',
                        deviceModel: device.deviceModel || '',
                        softwareVersion: device.softwareVersion || '',
                        deviceType: device.deviceType || 'switch',
                        isCore: device.isCore || false,
                        blankConfigContext: device.blankConfigContext || '',
                        runningConfig: device.runningConfig || '',
                        configBlockCount: 0,
                        label: device.hostname || `Device-${id.slice(0, 4)}`,
                        projectId: projectId || undefined,
                    },
                };

                set((state: NetworkState) => ({
                    nodes: [...state.nodes, newNode],
                    coreNodeId: device.isCore ? id : state.coreNodeId,
                }));

                return id;
            },

            updateDevice: (id: string, updates: Partial<DeviceNodeData>) => {
                set((state: NetworkState) => ({
                    nodes: state.nodes.map((node: Node<DeviceNodeData>) =>
                        node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
                    ),
                }));
            },

            removeDevice: (id: string) => {
                set((state: NetworkState) => ({
                    nodes: state.nodes.filter((node: Node<DeviceNodeData>) => node.id !== id),
                    edges: state.edges.filter((edge: Edge<LinkData>) => edge.source !== id && edge.target !== id),
                    selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
                    coreNodeId: state.coreNodeId === id ? null : state.coreNodeId,
                }));
            },

            getDevice: (id: string) => {
                return get().nodes.find((node: Node<DeviceNodeData>) => node.id === id)?.data;
            },

            appendToRunningConfig: (deviceId: string, cliBlock: string) => {
                set((state: NetworkState) => ({
                    nodes: state.nodes.map((node: Node<DeviceNodeData>) =>
                        node.id === deviceId
                            ? {
                                ...node,
                                data: {
                                    ...node.data,
                                    runningConfig: RunningConfigParser.smartMerge(node.data.runningConfig, cliBlock),
                                    configBlockCount: node.data.configBlockCount + 1,
                                },
                            }
                            : node
                    ),
                }));
            },

            setRunningConfig: (deviceId: string, config: string) => {
                set((state: NetworkState) => ({
                    nodes: state.nodes.map((node: Node<DeviceNodeData>) =>
                        node.id === deviceId
                            ? { ...node, data: { ...node.data, runningConfig: config } }
                            : node
                    ),
                }));
            },

            getRunningConfig: (deviceId: string) => {
                return get().getDevice(deviceId)?.runningConfig || '';
            },

            setSelectedNodeId: (id: string | null) => set({ selectedNodeId: id }),
            setCoreNodeId: (id: string) => set({ coreNodeId: id }),
            getNodesForCurrentProject: () => {
                const { nodes, currentProjectId } = get();
                if (!currentProjectId) return nodes;
                return nodes.filter(n => n.data.projectId === currentProjectId);
            },
            addProject: (name: string) => {
                const id = uuidv4();
                const newProject: Project = { id, name };
                set((state: NetworkState) => ({
                    projects: [...state.projects, newProject],
                    currentProjectId: id,
                }));
                return id;
            },
            removeProject: (id: string) => {
                set((state: NetworkState) => ({
                    projects: state.projects.filter(p => p.id !== id),
                    currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
                    nodes: state.nodes.filter(n => n.data.projectId !== id),
                    edges: state.edges.filter(e => {
                        const sourceNode = state.nodes.find(n => n.id === e.source);
                        const targetNode = state.nodes.find(n => n.id === e.target);
                        return sourceNode?.data.projectId !== id && targetNode?.data.projectId !== id;
                    })
                }));
            },
            setCurrentProjectId: (id: string | null) => set({ currentProjectId: id }),
            assignNodeToProject: (nodeId: string, projectId: string) => {
                set((state: NetworkState) => ({
                    nodes: state.nodes.map((node: Node<DeviceNodeData>) =>
                        node.id === nodeId ? { ...node, data: { ...node.data, projectId } } : node
                    ),
                }));
            },

            generateSyncCLI: (edge: Edge<LinkData>) => {
                const { interfaceA, interfaceB, linkMode, accessVlan, allowedVlans } = edge.data || {};
                if (!interfaceA || !interfaceB || !linkMode) return;

                const generateCommands = (iface: string, mode: string, vlan?: number, allowed?: number[]) => {
                    let cmds = `interface ${iface}\n`;
                    cmds += ` description Connected to peer via NetLab Canvas\n`;
                    
                    if (mode === 'trunk') {
                        cmds += ` switchport mode trunk\n`;
                        if (allowed && allowed.length > 0) {
                            cmds += ` switchport trunk allowed vlan ${allowed.join(',')}\n`;
                        }
                    } else if (mode === 'access') {
                        cmds += ` switchport mode access\n`;
                        if (vlan) {
                            cmds += ` switchport access vlan ${vlan}\n`;
                        }
                    } else if (mode === 'routed') {
                        cmds += ` no switchport\n`;
                        cmds += ` ip address 10.255.${Math.floor(Math.random() * 255)}.1 255.255.255.252\n`;
                    }
                    cmds += ` no shutdown\n`;
                    return cmds;
                };

                const sourceCmds = generateCommands(interfaceA, linkMode, accessVlan, allowedVlans);
                const targetCmds = generateCommands(interfaceB, linkMode, accessVlan, allowedVlans);

                // Apply to source
                get().appendToRunningConfig(edge.source, `! --- AUTO-GENERATED SYNC FROM CANVAS ---\n${sourceCmds}`);
                // Apply to target
                get().appendToRunningConfig(edge.target, `! --- AUTO-GENERATED SYNC FROM CANVAS ---\n${targetCmds}`);
                
                console.log(`Bidirectional Sync: Applied CLI to ${edge.source} and ${edge.target}`);
            },

            groupConnectedDevices: () => {
                const { nodes, edges, currentProjectId } = get();
                const deviceNodes = nodes.filter(n => n.type === 'deviceNode' && (!currentProjectId || n.data.projectId === currentProjectId));
                if (deviceNodes.length === 0) return;

                // Simple Disjoint Set or BFS to find components
                const visited = new Set<string>();
                const components: string[][] = [];

                deviceNodes.forEach(node => {
                    if (!visited.has(node.id)) {
                        const component: string[] = [];
                        const queue = [node.id];
                        visited.add(node.id);

                        while (queue.length > 0) {
                            const currId = queue.shift()!;
                            component.push(currId);

                            edges.forEach(edge => {
                                if (edge.source === currId && !visited.has(edge.target)) {
                                    // Only follow edges to nodes that are in our filtered set
                                    const targetNode = deviceNodes.find(n => n.id === edge.target);
                                    if (targetNode) {
                                        visited.add(edge.target);
                                        queue.push(edge.target);
                                    }
                                } else if (edge.target === currId && !visited.has(edge.source)) {
                                    const sourceNode = deviceNodes.find(n => n.id === edge.source);
                                    if (sourceNode) {
                                        visited.add(edge.source);
                                        queue.push(edge.source);
                                    }
                                }
                            });
                        }
                        components.push(component);
                    }
                });

                // Create group nodes for each component
                // Filter out existing group nodes that belong to the current project
                // If currentProjectId is null, we might be removing all group nodes?
                // Let's assume we replace group nodes for the current project.
                const otherProjectNodes = nodes.filter(n => {
                    if (n.type !== 'groupNode') return true; // Keep all non-group nodes (we will re-add groups)
                    // If it's a group node, keep it only if it's NOT in the current project
                    return currentProjectId && n.data.projectId !== currentProjectId;
                });
                
                const newNodes = [...otherProjectNodes];
                
                components.forEach((comp, idx) => {
                    if (comp.length < 2) return; // Don't group single nodes

                    const groupId = `group-${currentProjectId || 'default'}-${idx}`;
                    const compNodes = nodes.filter(n => comp.includes(n.id));
                    
                    // Calculate bounding box
                    const minX = Math.min(...compNodes.map(n => n.position.x));
                    const minY = Math.min(...compNodes.map(n => n.position.y));
                    const maxX = Math.max(...compNodes.map(n => n.position.x + 350)); // Approx width
                    const maxY = Math.max(...compNodes.map(n => n.position.y + 450)); // Approx height

                    const padding = 50;
                    
                    newNodes.push({
                        id: groupId,
                        type: 'groupNode',
                        position: { x: minX - padding, y: minY - padding },
                        style: { width: (maxX - minX) + padding * 2, height: (maxY - minY) + padding * 2 },
                        data: { 
                            label: `Logical Cluster ${idx + 1}`,
                            projectId: currentProjectId || undefined
                        },
                        zIndex: -1,
                    });

                    // Assign parentId to nodes (only modify those in the component)
                    // We need to update the nodes in newNodes array
                    comp.forEach(nodeId => {
                        const nodeIdx = newNodes.findIndex(n => n.id === nodeId);
                        if (nodeIdx >= 0) {
                            newNodes[nodeIdx] = {
                                ...newNodes[nodeIdx],
                                parentId: groupId,
                                extent: 'parent',
                                // Make position relative to parent
                                position: {
                                    x: newNodes[nodeIdx].position.x - (minX - padding),
                                    y: newNodes[nodeIdx].position.y - (minY - padding)
                                }
                            };
                        }
                    });
                });

                set({ nodes: newNodes });
            },

            clearCurrentProject: () => {
                const { currentProjectId, nodes, edges, coreNodeId } = get();
                
                // Keep nodes that do NOT belong to the current project
                // If currentProjectId is null, we clear everything (return false for all)
                const nodesKeeping = nodes.filter(n => 
                    currentProjectId ? n.data.projectId !== currentProjectId : false
                );
                
                const keptNodeIds = new Set(nodesKeeping.map(n => n.id));

                set({
                    nodes: nodesKeeping,
                    // Keep edges only if both source and target exist in kept nodes
                    edges: edges.filter(e => keptNodeIds.has(e.source) && keptNodeIds.has(e.target)),
                    selectedNodeId: null,
                    // If the core node was deleted, clear the ID
                    coreNodeId: (coreNodeId && keptNodeIds.has(coreNodeId)) ? coreNodeId : null
                });
            },

            applyProposedLinks: (proposals) => {
                const { edges } = get();
                const newEdges: Edge<LinkData>[] = proposals.map(p => ({
                    id: uuidv4(),
                    source: p.sourceId,
                    target: p.targetId,
                    sourceHandle: `right-source`, // Default to side-to-side
                    targetHandle: `left-target`,
                    data: {
                        interfaceA: p.interfaceA,
                        interfaceB: p.interfaceB,
                        linkMode: p.linkMode,
                        medium: p.medium,
                        description: p.reason
                    },
                    label: `${p.interfaceA} <> ${p.interfaceB}`,
                    animated: p.linkMode === 'trunk',
                    style: {
                        stroke: p.linkMode === 'routed' ? '#ef4444' : '#1ba0d7',
                        strokeDasharray: p.medium === 'fiber' ? '5,5' : 'none'
                    }
                }));

                set((state: NetworkState) => ({
                    edges: [...state.edges, ...newEdges]
                }));
            },

            bulkAddDevices: (devices) => {
                const { currentProjectId } = get();
                const newNodes: Node<DeviceNodeData>[] = [];
                const nodeIds: string[] = [];

                devices.forEach((dev, index) => {
                    const id = uuidv4();
                    const newNode: Node<DeviceNodeData> = {
                        id,
                        type: 'deviceNode',
                        // Arrange in a simple grid or circle for bulk upload
                        position: { 
                            x: 200 + (index % 4) * 350, 
                            y: 200 + Math.floor(index / 4) * 450 
                        },
                        data: {
                            hostname: dev.data.hostname || `Device-${id.slice(0, 4)}`,
                            managementIp: dev.data.managementIp || '',
                            vendor: dev.data.vendor || 'cisco',
                            deviceModel: dev.data.deviceModel || '',
                            softwareVersion: dev.data.softwareVersion || '',
                            deviceType: dev.data.deviceType || 'switch',
                            isCore: dev.data.isCore || false,
                            blankConfigContext: dev.config,
                            runningConfig: dev.config,
                            configBlockCount: 0,
                            label: dev.data.hostname || `Device-${id.slice(0, 4)}`,
                            projectId: currentProjectId || undefined,
                            status: 'OK',
                            configuredDate: new Date().toISOString().split('T')[0]
                        },
                    };
                    newNodes.push(newNode);
                    nodeIds.push(id);
                });

                set((state: NetworkState) => ({
                    nodes: [...state.nodes, ...newNodes],
                }));

                // Trigger auto-connect for all newly added nodes
                setTimeout(() => {
                    nodeIds.forEach(id => get().autoConnectNodes(id));
                }, 500);
            },

            autoConnectNodes: (deviceId: string) => {
                const { nodes, edges } = get();
                const sourceNode = nodes.find((node: Node<DeviceNodeData>) => node.id === deviceId);

                if (!sourceNode || !sourceNode.data.blankConfigContext) {
                    console.warn(`autoConnectNodes: Source node ${deviceId} not found or no blank config context.`);
                    return;
                }

                const parsedSourceConfig = ConfigTabParser.parse(sourceNode.data.blankConfigContext);

                if (!parsedSourceConfig.interfaces || parsedSourceConfig.interfaces.length === 0) {
                    console.log(`autoConnectNodes: No interfaces found for node ${sourceNode.data.hostname}`);
                    return;
                }

                const newEdges: Edge<LinkData>[] = [];

                parsedSourceConfig.interfaces.forEach((sourceIntf: ParsedInterface) => {
                    // STRICT FILTER: Only consider physical interfaces for auto-connection
                    if (sourceIntf.cdpNeighbor && ConfigTabParser.isPhysicalInterface(sourceIntf.name)) {
                        const targetHostname = sourceIntf.cdpNeighbor.hostname;
                        const targetLocalPort = sourceIntf.cdpNeighbor.localPort;

                        const targetNode = nodes.find((node: Node<DeviceNodeData>) => node.data.hostname.toLowerCase() === targetHostname.toLowerCase());

                        if (targetNode) {
                            // Check if an edge already exists between these two nodes/interfaces
                            const existingEdge = edges.some((edge: Edge<LinkData>) =>
                                (edge.source === sourceNode.id && edge.target === targetNode.id && edge.sourceHandle === sourceIntf.name && edge.targetHandle === targetLocalPort) ||
                                (edge.source === targetNode.id && edge.target === sourceNode.id && edge.sourceHandle === targetLocalPort && edge.targetHandle === sourceIntf.name)
                            );

                            if (!existingEdge) {
                                // Create a new edge
                                const newEdge: Edge<LinkData> = {
                                    id: uuidv4(),
                                    source: sourceNode.id,
                                    target: targetNode.id,
                                    sourceHandle: 'right-source', // Default to right side
                                    targetHandle: 'left-target', // Default to left side
                                    type: 'default', // Or a custom edge type if needed
                                    data: {
                                        interfaceA: sourceIntf.name,
                                        interfaceB: targetLocalPort,
                                        linkMode: sourceIntf.mode || 'unconfigured', // Default to unconfigured
                                        allowedVlans: sourceIntf.allowedVlans ? sourceIntf.allowedVlans.split(',').map((v: string) => parseInt(v.trim())) : undefined,
                                        accessVlan: sourceIntf.vlan ? parseInt(sourceIntf.vlan) : undefined,
                                        description: sourceIntf.description,
                                        medium: sourceIntf.mediaType === 'Fiber' ? 'fiber' : 'ethernet',
                                    },
                                    style: {
                                        strokeWidth: 3,
                                        stroke: sourceIntf.mediaType === 'Fiber' ? '#f97316' : '#22c55e', // Orange for fiber, Green for eth
                                    },
                                    animated: true, // Flashing/animated traffic direction
                                };
                                newEdges.push(newEdge);
                                console.log(`autoConnectNodes: Created new edge between ${sourceNode.data.hostname} (${sourceIntf.name}) and ${targetNode.data.hostname} (${targetLocalPort})`);
                            } else {
                                console.log(`autoConnectNodes: Edge already exists between ${sourceNode.data.hostname} (${sourceIntf.name}) and ${targetNode.data.hostname} (${targetLocalPort})`);
                            }
                        } else {
                            console.log(`autoConnectNodes: Target node ${targetHostname} not found for CDP neighbor of ${sourceNode.data.hostname}`);
                        }
                    }
                });

                if (newEdges.length > 0) {
                    set((state: NetworkState) => ({
                        edges: [...state.edges, ...newEdges],
                    }));
                }
            },

        }),
        {
            name: 'netlab-network-storage',
        }
    )
);
