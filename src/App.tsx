import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import RightPanel from './components/layout/RightPanel';
import NetworkCanvas from './components/canvas/NetworkCanvas';
import DeviceModal from './components/canvas/DeviceModal';
import BulkUploadModal from './components/canvas/BulkUploadModal';
import NodeDetailPanel from './components/node-detail/NodeDetailPanel';
import SettingsModal from './components/settings/SettingsModal';
import GlobalConfigPanel from './components/global-config/GlobalConfigPanel';
import SimulatorPanel from './components/simulator/SimulatorPanel';
import ChatPanel from './components/chat/ChatPanel';
import { useNetworkStore } from './store/useNetworkStore';
import { DeviceNodeData } from './types';

const App: React.FC = () => {
    const [activeView, setActiveView] = useState('topology');
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
    const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'core' | 'normal'>('normal');

    const [rightPanelContent, setRightPanelContent] = useState<{ title: string; type: 'node' | 'chat' }>({
        title: '',
        type: 'node',
    });

    const selectedNodeId = useNetworkStore((state) => state.selectedNodeId);
    const setSelectedNodeId = useNetworkStore((state) => state.setSelectedNodeId);
    const addDevice = useNetworkStore((state) => state.addDevice);

    const handleOpenSettings = () => {
        setIsSettingsModalOpen(true);
    };

    const handleCloseRightPanel = () => {
        setIsRightPanelOpen(false);
        setSelectedNodeId(null);
    };

    const handleAddCore = () => {
        setModalMode('core');
        setIsDeviceModalOpen(true);
    };

    const handleAddNode = () => {
        setModalMode('normal');
        setIsDeviceModalOpen(true);
    };

    const handleAddMultiple = () => {
        setIsBulkUploadModalOpen(true);
    };

    const autoConnectNodes = useNetworkStore((state) => state.autoConnectNodes);
    const onDeviceSubmit = (data: Partial<DeviceNodeData>) => {
        const id = addDevice(data, { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 });
        if (data.blankConfigContext && data.blankConfigContext.length > 0) {
            autoConnectNodes(id);
        }
    };

    return (
        <div className="flex h-screen w-screen flex-col bg-background text-white selection:bg-cisco-blue/30 overflow-hidden">
            <TopBar onOpenSettings={handleOpenSettings} />

            <main className="flex flex-1 overflow-hidden relative">
                <Sidebar
                    activeView={activeView}
                    setActiveView={setActiveView}
                    onAddCore={handleAddCore}
                    onAddNode={handleAddNode}
                    onAddMultiple={handleAddMultiple}
                />

                <div className="flex-1 bg-canvas relative overflow-hidden">
                    {activeView === 'topology' && (
                        <div className="h-full w-full">
                            <NetworkCanvas />
                        </div>
                    )}
                    {activeView === 'simulator' && (
                        <div className="h-full w-full overflow-auto bg-background custom-scrollbar">
                            <SimulatorPanel />
                        </div>
                    )}
                    {activeView === 'global' && (
                        <div className="h-full w-full overflow-auto bg-background custom-scrollbar">
                            <GlobalConfigPanel />
                        </div>
                    )}
                    {activeView === 'chat' && (
                        <div className="h-full w-full overflow-hidden bg-background">
                            <ChatPanel />
                        </div>
                    )}
                </div>

                <RightPanel
                    isOpen={isRightPanelOpen || !!selectedNodeId}
                    onClose={handleCloseRightPanel}
                    title={selectedNodeId ? 'Device Panel' : rightPanelContent.title}
                >
                    <div className="h-full flex flex-col">
                        {selectedNodeId ? (
                            <NodeDetailPanel nodeId={selectedNodeId} />
                        ) : (
                            <div className="p-6">
                                <p className="text-gray-500 text-sm italic">Panel content pending...</p>
                            </div>
                        )}
                    </div>
                </RightPanel>
            </main>

            <DeviceModal
                isOpen={isDeviceModalOpen}
                onClose={() => setIsDeviceModalOpen(false)}
                isCore={modalMode === 'core'}
                onSubmit={onDeviceSubmit}
            />

            <BulkUploadModal
                isOpen={isBulkUploadModalOpen}
                onClose={() => setIsBulkUploadModalOpen(false)}
            />

            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />

            <footer className="h-10 border-t border-node-border bg-background px-6 flex items-center justify-between z-50">
                <div className="flex gap-6">
                    {['topology', 'simulator', 'global'].map((view) => (
                        <button
                            key={view}
                            onClick={() => setActiveView(view)}
                            className={`text-[10px] uppercase font-black tracking-[0.2em] transition-all ${activeView === view
                                ? 'text-cisco-blue drop-shadow-[0_0_8px_rgba(27,160,215,0.5)]'
                                : 'text-gray-600 hover:text-white'
                                }`}
                        >
                            {view}
                        </button>
                    ))}
                </div>
                <p className="text-[10px] text-gray-600 font-mono tracking-tighter uppercase opacity-50">
                    SYS_STATUS: <span className="text-terminal-green">OPERATIONAL</span> | V1.0.0_STABLE
                </p>
            </footer>
        </div>
    );
};

export default App;
