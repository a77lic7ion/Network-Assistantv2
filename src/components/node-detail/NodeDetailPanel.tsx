import React, { useState } from 'react';
import { Info, Terminal, Activity, X, Cpu, MessageSquare } from 'lucide-react';
import { useNetworkStore } from '../../store/useNetworkStore';
import NodeInfoTab from './NodeInfoTab';
import RunningConfigTab from './RunningConfigTab';
import InterfacesTab from './InterfacesTab';
import SimulationTab from './SimulationTab';
import ChatPanel from '../chat/ChatPanel';

interface NodeDetailPanelProps {
    nodeId: string;
}

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ nodeId }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'config' | 'interfaces' | 'chat'>('info');
    const setRunningConfig = useNetworkStore((state) => state.setRunningConfig);
    const device = useNetworkStore((state) => state.nodes.find((node) => node.id === nodeId)?.data);

    if (!device) return null;

    const tabs = [
        { id: 'info', label: 'Info', icon: Info },
        { id: 'config', label: 'Running Config', icon: Terminal },
        { id: 'interfaces', label: 'Interfaces', icon: Activity },
        { id: 'chat', label: 'AI Config', icon: MessageSquare },
        { id: 'simulation', label: 'Simulation', icon: Cpu },
    ];

    return (
        <div className="flex h-full flex-col">
            {/* Node Header */}
            <div className="bg-node/50 p-6 border-b border-node-border">
                <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${device.isCore ? 'bg-core-accent text-black' : 'bg-cisco-blue text-white shadow-[0_5px_15px_rgba(27,160,215,0.3)]'}`}>
                        <span className="font-black text-xl italic">{(device.hostname || '?').charAt(0)}</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-black tracking-tight text-white uppercase italic">{device.hostname || 'Unknown Device'}</h3>
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">
                            {device.vendor} {device.deviceModel} | {device.deviceType}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-node-border bg-background">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex flex-1 items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-cisco-blue text-white'
                                : 'text-gray-400 hover:bg-node/50 hover:text-white'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'info' && <NodeInfoTab device={device} id={nodeId} />}
                {activeTab === 'config' && (
                    <RunningConfigTab
                        config={device.runningConfig}
                        hostname={device.hostname}
                        onClear={() => setRunningConfig(nodeId, '')}
                        nodeId={nodeId}
                    />
                )}
                {activeTab === 'interfaces' && <InterfacesTab config={device.runningConfig} />}
                {activeTab === 'chat' && <ChatPanel isEmbedded nodeId={nodeId} />}
                {activeTab === 'simulation' && <SimulationTab device={device} />}
            </div>
        </div>
    );
};

export default NodeDetailPanel;
