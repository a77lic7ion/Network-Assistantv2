import React from 'react';
import { Settings, ShieldCheck, Activity, Save, Trash2, Plus } from 'lucide-react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { toast } from 'sonner';

interface TopBarProps {
    onOpenSettings: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onOpenSettings }) => {
    const activeProvider = useSettingsStore((state) => state.activeProvider);
    const providerStatus = useSettingsStore((state) => state.providerStatus[activeProvider]);
    const projects = useNetworkStore((state) => state.projects);
    const currentProjectId = useNetworkStore((state) => state.currentProjectId);
    const setCurrentProjectId = useNetworkStore((state) => state.setCurrentProjectId);
    const addProject = useNetworkStore((state) => state.addProject);
    const removeProject = useNetworkStore((state) => state.removeProject);

    const statusColors: Record<string, string> = {
        unconfigured: 'bg-gray-500',
        testing: 'bg-yellow-500 animate-pulse',
        ok: 'bg-green-500',
        error: 'bg-red-500',
    };

    const handleAddProject = () => {
        const name = window.prompt('Enter project name:');
        if (name) {
            const id = addProject(name);
            setCurrentProjectId(id);
            toast.success(`Project "${name}" created`);
        }
    };

    const handleDeleteProject = () => {
        if (!currentProjectId) return;
        const project = projects.find(p => p.id === currentProjectId);
        if (project && window.confirm(`Are you sure you want to delete project "${project.name}"? All devices in this project will be removed.`)) {
            removeProject(currentProjectId);
            toast.success(`Project "${project.name}" deleted`);
        }
    };

    return (
        <header className="flex h-16 items-center justify-between border-b border-node-border bg-background px-6">
            <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cisco-blue">
                    <Activity className="text-white" size={20} />
                </div>
                <h1 className="text-xl font-bold tracking-tight">
                    NetLab <span className="text-cisco-blue">AI</span>
                </h1>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-full border border-node-border bg-node px-3 py-1">
                    <select
                        value={currentProjectId || ''}
                        onChange={(e) => setCurrentProjectId(e.target.value || null)}
                        className="bg-transparent text-xs font-bold uppercase text-gray-400 outline-none"
                        title="Select project"
                    >
                        <option value="">All Projects</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <div className="flex items-center gap-1 border-l border-node-border ml-2 pl-2">
                        <button
                            onClick={handleAddProject}
                            className="p-1 text-gray-400 hover:text-cisco-blue transition-colors"
                            title="Add project"
                        >
                            <Plus size={14} />
                        </button>
                        {currentProjectId && (
                            <button
                                onClick={handleDeleteProject}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete current project"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-node-border bg-node px-3 py-1">
                    <div className={`h-2 w-2 rounded-full ${statusColors[providerStatus]}`} />
                    <span className="text-xs font-medium uppercase text-gray-400">
                        {activeProvider}: {providerStatus}
                    </span>
                </div>

                <button
                    onClick={() => toast.success('Work saved successfully!')}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-node border border-node-border text-gray-400 hover:bg-node-border hover:text-white transition-colors"
                    title="Save Work"
                >
                    <Save size={20} />
                </button>

                <button
                    onClick={onOpenSettings}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-node border border-node-border text-gray-400 hover:bg-node-border hover:text-white transition-colors"
                    title="Open Settings"
                >
                    <Settings size={20} />
                </button>
            </div>
        </header>
    );
};

export default TopBar;
