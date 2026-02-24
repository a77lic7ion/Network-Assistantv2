import React, { useState } from 'react';
import { Zap, ShieldCheck, AlertTriangle, Play, CheckCircle2, Loader2, Globe } from 'lucide-react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { GlobalConfigAgent } from '../../agents/globalConfigAgent';
import { toast } from 'sonner';

const GlobalConfigPanel: React.FC = () => {
    const { getNodesForCurrentProject, appendToRunningConfig, currentProjectId } = useNetworkStore();
    const nodes = getNodesForCurrentProject();
    const [directive, setDirective] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [proposedConfigs, setProposedConfigs] = useState<Record<string, string>>({});
    const [appliedNodes, setAppliedNodes] = useState<Set<string>>(new Set());

    // Reset when project changes
    React.useEffect(() => {
        setDirective('');
        setProposedConfigs({});
        setAppliedNodes(new Set());
    }, [currentProjectId]);

    const handleGenerate = async () => {
        if (!directive.trim()) return;
        setIsGenerating(true);
        setProposedConfigs({});
        setAppliedNodes(new Set());

        try {
            const scopedNodes = currentProjectId ? nodes.filter(n => n.data.projectId === currentProjectId) : nodes;
            const deviceData = scopedNodes.map(n => n.data);
            const configs = await GlobalConfigAgent.generateGlobalConfigs(directive, deviceData);
            setProposedConfigs(configs);
            toast.success('Global configuration generated successfully.');
        } catch (error: any) {
            toast.error(`Generation failed: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApplyAll = () => {
        const scopedNodes = currentProjectId ? nodes.filter(n => n.data.projectId === currentProjectId) : nodes;
        const mapByHostname = new Map(scopedNodes.map(n => [n.data.hostname.trim().toLowerCase(), n]));
        let count = 0;
        Object.entries(proposedConfigs).forEach(([hostname, cli]) => {
            if (!cli.trim()) return;
            const key = hostname.trim().toLowerCase();
            const node = mapByHostname.get(key);
            if (node) {
                appendToRunningConfig(node.id, cli);
                count++;
            }
        });
        setAppliedNodes(new Set(Object.keys(proposedConfigs)));
        toast.success(`Applied configuration to ${count} devices.`);
    };

    const handleApplySingle = (hostname: string) => {
        const cli = proposedConfigs[hostname];
        const node = nodes.find(n => n.data.hostname === hostname);
        if (node && cli) {
            appendToRunningConfig(node.id, cli);
            setAppliedNodes(prev => new Set(prev).add(hostname));
            toast.success(`Applied to ${hostname}`);
        }
    };

    return (
        <div className="p-10 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500">
            <header>
                <div className="flex items-center gap-4 mb-2">
                    <div className="h-12 w-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                        <Globe size={28} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase">Global Orchestrator</h2>
                        <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em]">Autonomous Multi-Node Synchronization</p>
                    </div>
                </div>
                <div className="h-1 w-24 bg-orange-500 mt-4 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
            </header>

            <section className="bg-node/20 border border-node-border rounded-3xl p-8 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-6">
                    <ShieldCheck size={18} className="text-orange-500" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-white/80">Directive Entry</h3>
                </div>

                <div className="space-y-6">
                    <textarea
                        value={directive}
                        onChange={(e) => setDirective(e.target.value)}
                        placeholder="e.g. 'Enable OSPF area 0 on all core switches' or 'Create VLAN 99 named GUEST on every node'"
                        className="w-full h-32 bg-background/50 border border-node-border rounded-2xl p-6 text-sm text-white focus:outline-none focus:border-orange-500 transition-all placeholder:text-gray-700"
                    />

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !directive.trim()}
                        className="w-full bg-orange-500 text-white font-black uppercase tracking-[0.2em] py-4 rounded-2xl shadow-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Analyzing Topology...
                            </>
                        ) : (
                            <>
                                <Zap size={20} />
                                Generate Synchronized Configs
                            </>
                        )}
                    </button>
                </div>
            </section>

            {Object.keys(proposedConfigs).length > 0 && (
                <section className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={20} className="text-yellow-500" />
                            <h3 className="text-lg font-black uppercase tracking-tight italic">Proposed Changes</h3>
                        </div>
                        <button
                            onClick={handleApplyAll}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all"
                        >
                            Commit All Changes
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(proposedConfigs).map(([hostname, cli]) => (
                            <div key={hostname} className={`rounded-2xl border transition-all ${appliedNodes.has(hostname) ? 'border-green-500/50 bg-green-500/5' : 'border-node-border bg-node/40'}`}>
                                <div className="flex items-center justify-between p-4 border-b border-node-border">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-2 w-2 rounded-full ${appliedNodes.has(hostname) ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`} />
                                        <span className="text-xs font-black uppercase tracking-widest">{hostname}</span>
                                    </div>
                                    <button
                                        disabled={appliedNodes.has(hostname) || !cli.trim()}
                                        onClick={() => handleApplySingle(hostname)}
                                        className={`p-2 rounded-lg transition-all ${appliedNodes.has(hostname) ? 'text-green-500' : 'text-gray-500 hover:text-white hover:bg-node'}`}
                                    >
                                        {appliedNodes.has(hostname) ? <CheckCircle2 size={16} /> : <Play size={16} />}
                                    </button>
                                </div>
                                <div className="p-4 bg-black/40 min-h-[100px] flex items-center justify-center">
                                    {cli.trim() ? (
                                        <pre className="text-[10px] text-gray-400 font-mono w-full overflow-x-auto">
                                            {cli}
                                        </pre>
                                    ) : (
                                        <span className="text-[10px] font-black uppercase text-gray-700 tracking-tighter">No Changes Required</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default GlobalConfigPanel;
