import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect, applyNodeChanges, applyEdgeChanges, addEdge, XYPosition } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { DeviceNodeData, LinkData } from '../types';
import { RunningConfigParser } from '../parsers/runningConfigParser';
import { ConfigTabParser, ParsedInterface } from '../parsers/configTabParser';

interface NetworkState {
    nodes: Node<DeviceNodeData>[];
    edges: Edge<LinkData>[];
    selectedNodeId: string | null;
    coreNodeId: string | null;

    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;

    addDevice: (device: Partial<DeviceNodeData>, position: XYPosition) => string;
    updateDevice: (id: string, updates: Partial<DeviceNodeData>) => void;
    removeDevice: (id: string) => void;
    getDevice: (id: string) => DeviceNodeData | undefined;

    appendToRunningConfig: (deviceId: string, cliBlock: string) => void;
    setRunningConfig: (deviceId: string, config: string) => void;
    getRunningConfig: (deviceId: string) => string;

    setSelectedNodeId: (id: string | null) => void;
    setCoreNodeId: (id: string) => void;
    autoConnectNodes: (deviceId: string) => void;
}

export const useNetworkStore = create<NetworkState>()(
    persist(
        (set, get) => ({
            nodes: [],
            edges: [],
            selectedNodeId: null,
            coreNodeId: null,

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
                        blankConfigContext: '',
                        runningConfig: '',
                        configBlockCount: 0,
                        label: device.hostname || `Device-${id.slice(0, 4)}`,
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
                    if (sourceIntf.cdpNeighbor) {
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
                                    sourceHandle: sourceIntf.name, // Use interface name as handle
                                    targetHandle: targetLocalPort, // Use neighbor's local port as handle
                                    type: 'default', // Or a custom edge type if needed
                                    data: {
                                        interfaceA: sourceIntf.name,
                                        interfaceB: targetLocalPort,
                                        linkMode: sourceIntf.mode || 'unconfigured', // Default to unconfigured
                                        allowedVlans: sourceIntf.allowedVlans ? sourceIntf.allowedVlans.split(',').map((v: string) => parseInt(v.trim())) : undefined,
                                        accessVlan: sourceIntf.vlan ? parseInt(sourceIntf.vlan) : undefined,
                                        description: sourceIntf.description,
                                    }
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
