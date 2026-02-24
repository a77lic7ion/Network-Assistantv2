import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    NodeTypes,
    Panel,
    addEdge,
    Connection,
    ReactFlowProvider,
    useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';

import DeviceNode from './DeviceNode';
import GroupNode from './GroupNode';
import LinkModal from './LinkModal';
import { useNetworkStore } from '../../store/useNetworkStore';
import { LinkData } from '../../types';

const NetworkCanvasInner: React.FC = () => {
    const {
        nodes,
        edges,
        currentProjectId,
        onNodesChange,
        onEdgesChange,
        setSelectedNodeId,
        getDevice,
        generateSyncCLI
    } = useNetworkStore();

    const { project, setCenter } = useReactFlow();
    const [linkConnection, setLinkConnection] = useState<Connection | null>(null);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    const visibleNodes = useMemo(() => {
        if (!currentProjectId) return nodes;
        return nodes.filter(n => n.data.projectId === currentProjectId);
    }, [nodes, currentProjectId]);

    const visibleEdges = useMemo(() => {
        if (!currentProjectId) return edges;
        const nodeIds = new Set(visibleNodes.map(n => n.id));
        return edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
    }, [edges, visibleNodes, currentProjectId]);

    const nodeTypes = useMemo<NodeTypes>(() => ({
        deviceNode: DeviceNode,
        groupNode: GroupNode,
    }), []);

    const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
        setSelectedNodeId(node.id);
    }, [setSelectedNodeId]);

    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null);
    }, [setSelectedNodeId]);

    const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
        setLinkConnection({
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle
        });
        setIsLinkModalOpen(true);
    }, []);

    const handleConnect = useCallback((params: Connection) => {
        setLinkConnection(params);
        setIsLinkModalOpen(true);
    }, []);

    const onLinkSubmit = (linkData: LinkData) => {
        if (linkConnection) {
            useNetworkStore.setState((state) => {
                // Check if we are updating an existing edge
                const existingEdgeIndex = state.edges.findIndex(e => 
                    (e.source === linkConnection.source && e.target === linkConnection.target && e.sourceHandle === linkConnection.sourceHandle && e.targetHandle === linkConnection.targetHandle) ||
                    (e.source === linkConnection.target && e.target === linkConnection.source && e.sourceHandle === linkConnection.targetHandle && e.targetHandle === linkConnection.sourceHandle)
                );

                let updatedEdge: any;

                if (existingEdgeIndex >= 0) {
                    const newEdges = [...state.edges];
                    updatedEdge = {
                        ...newEdges[existingEdgeIndex],
                        data: linkData,
                        label: `${linkData.interfaceA} <> ${linkData.interfaceB}`,
                        animated: true, // Always animated for traffic direction
                        style: { 
                            stroke: linkData.medium === 'fiber' ? '#f97316' : '#22c55e',
                            strokeWidth: 3,
                        }
                    };
                    newEdges[existingEdgeIndex] = updatedEdge;
                    
                    // Trigger sync CLI
                    setTimeout(() => generateSyncCLI(updatedEdge), 100);
                    
                    return { edges: newEdges };
                }

                updatedEdge = {
                    ...linkConnection,
                    id: `edge-${Date.now()}`,
                    data: linkData,
                    label: `${linkData.interfaceA} <> ${linkData.interfaceB}`,
                    animated: true, // Always animated for traffic direction
                    style: { 
                        stroke: linkData.medium === 'fiber' ? '#f97316' : '#22c55e',
                        strokeWidth: 3,
                    }
                };

                // Trigger sync CLI
                setTimeout(() => generateSyncCLI(updatedEdge), 100);

                return {
                    edges: addEdge(updatedEdge, state.edges)
                };
            });
        }
        setLinkConnection(null);
        setIsLinkModalOpen(false);
    };

    const handleLinkDelete = () => {
        if (linkConnection) {
            useNetworkStore.setState((state) => ({
                edges: state.edges.filter(e => 
                    !(e.source === linkConnection.source && e.target === linkConnection.target && e.sourceHandle === linkConnection.sourceHandle && e.targetHandle === linkConnection.targetHandle) &&
                    !(e.source === linkConnection.target && e.target === linkConnection.source && e.sourceHandle === linkConnection.targetHandle && e.targetHandle === linkConnection.sourceHandle)
                )
            }));
        }
        setLinkConnection(null);
        setIsLinkModalOpen(false);
    };

    const sourceDevice = linkConnection ? getDevice(linkConnection.source!) : null;
    const targetDevice = linkConnection ? getDevice(linkConnection.target!) : null;

    return (
        <div className="h-full w-full bg-canvas">
            <ReactFlow
                nodes={visibleNodes}
                edges={visibleEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={handleConnect}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
                snapToGrid
                snapGrid={[15, 15]}
                className="react-flow-custom"
            >
                <Background color="#2a3347" gap={30} size={1} />
                <Controls className="!bg-node !border-node-border !fill-white" />
                <MiniMap
                    style={{ backgroundColor: '#1e2433' }}
                    maskColor="rgba(15, 17, 23, 0.7)"
                    nodeColor={(node) => (node.data.isCore ? '#f5a623' : '#1ba0d7')}
                />

                {visibleNodes.length === 0 && (
                    <Panel position="center">
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-node-border animate-bounce">
                                <div className="text-gray-500 text-3xl font-bold">+</div>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2 italic">No Topology Found</h2>
                            <p className="text-sm text-gray-500 max-w-[300px]">
                                Click <span className="text-core-accent font-bold">"Add CORE Device"</span> in the sidebar to begin your lab environment.
                            </p>
                        </div>
                    </Panel>
                )}
            </ReactFlow>

            {isLinkModalOpen && (
                    <LinkModal
                        isOpen={isLinkModalOpen}
                        onClose={() => setIsLinkModalOpen(false)}
                        onSubmit={onLinkSubmit}
                        onDelete={handleLinkDelete}
                        sourceHostname={sourceDevice?.hostname || ''}
                        targetHostname={targetDevice?.hostname || ''}
                        sourceDevice={sourceDevice || undefined}
                        targetDevice={targetDevice || undefined}
                    />
                )}

            {/* Global CSS Overrides for React Flow */}
            <style>{`
        .react-flow__handle {
          width: 8px !important;
          height: 8px !important;
          border: 2px solid #0f1117 !important;
        }
        .react-flow__edge-path {
          stroke: #2a3347 !important;
          stroke-width: 2 !important;
        }
        .react-flow__edge.selected .react-flow__edge-path {
          stroke: #1ba0d7 !important;
        }
        .react-flow__controls-button {
          border-bottom: 1px solid #2a3347 !important;
        }
        .react-flow__controls-button:hover {
          background-color: #2a3347 !important;
        }
        .react-flow__controls-button svg {
          fill: #9ca3af !important;
        }
      `}</style>
        </div>
    );
};

const NetworkCanvas: React.FC = () => (
    <ReactFlowProvider>
        <NetworkCanvasInner />
    </ReactFlowProvider>
);

export default NetworkCanvas;
