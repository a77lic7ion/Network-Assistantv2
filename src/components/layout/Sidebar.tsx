import React from 'react';
import { Settings, Network, Zap, Globe, MessageSquare, HelpCircle, Plus, Layout, Trash2 } from 'lucide-react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { toast } from 'sonner';

interface SidebarProps {
    onAddCore: () => void;
    onAddNode: () => void;
    onAddMultiple: () => void;
    activeView: string;
    setActiveView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onAddCore, onAddNode, onAddMultiple, activeView, setActiveView }) => {
    const coreNodeId = useNetworkStore((state) => state.coreNodeId);
    const groupConnectedDevices = useNetworkStore((state) => state.groupConnectedDevices);
    const clearCurrentProject = useNetworkStore((state) => state.clearCurrentProject);

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

                <div className="flex flex-col gap-2">
                    <button
                        onClick={onAddNode}
                        className="flex w-full items-center justify-center gap-2 rounded-md border border-node-border bg-node px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-node-border"
                    >
                        <Plus size={16} />
                        Add Node
                    </button>

                    <button
                        onClick={onAddMultiple}
                        className="flex w-full items-center justify-center gap-2 rounded-md border border-node-border bg-node px-4 py-2 text-[10px] font-black uppercase tracking-widest text-cisco-blue transition-colors hover:bg-node-border"
                    >
                        <Plus size={12} />
                        Add Multiple Files
                    </button>

                    <button
                        onClick={groupConnectedDevices}
                        className="flex w-full items-center justify-center gap-2 rounded-md border border-node-border bg-node/40 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-colors hover:bg-node-border hover:text-white"
                    >
                        <Layout size={12} />
                        Auto-Group Topology
                    </button>

                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete ALL devices and links in this project? This cannot be undone.')) {
                                clearCurrentProject();
                                toast.success('Topology cleared successfully');
                            }
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 transition-colors hover:bg-red-500/20"
                    >
                        <Trash2 size={12} />
                        Clear Topology
                    </button>
                </div>
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
