import React from 'react';
import { Settings, Network, Zap, Globe, MessageSquare, HelpCircle, Plus } from 'lucide-react';
import { useNetworkStore } from '../../store/useNetworkStore';

interface SidebarProps {
    onAddCore: () => void;
    onAddNode: () => void;
    activeView: string;
    setActiveView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onAddCore, onAddNode, activeView, setActiveView }) => {
    const coreNodeId = useNetworkStore((state) => state.coreNodeId);

    const menuItems = [
        { id: 'topology', label: 'Topology', icon: Network },
        { id: 'simulator', label: 'Simulator', icon: Zap },
        { id: 'global', label: 'Global Config', icon: Globe },
        { id: 'chat', label: 'Chat', icon: MessageSquare },
    ];

    return (
        <aside className="flex w-64 flex-col border-r border-node-border bg-background">
            <div className="p-6">
                <h2 className="mb-6 text-xs font-semibold uppercase tracking-wider text-gray-500">Inventory</h2>

                <button
                    onClick={onAddCore}
                    disabled={!!coreNodeId}
                    className="mb-3 flex w-full items-center justify-center gap-2 rounded-md bg-core-accent px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                    <Plus size={16} />
                    Add CORE Device
                </button>

                <button
                    onClick={onAddNode}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-node-border bg-node px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-node-border"
                >
                    <Plus size={16} />
                    Add Node
                </button>
            </div>

            <nav className="flex-1 px-4">
                <h2 className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Navigation</h2>
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${activeView === item.id
                            ? 'bg-cisco-blue/10 text-cisco-blue'
                            : 'text-gray-400 hover:bg-node hover:text-white'
                            }`}
                    >
                        <item.icon size={18} />
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-node-border">
                <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-400 hover:bg-node hover:text-white transition-colors">
                    <HelpCircle size={18} />
                    Help & Docs
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
