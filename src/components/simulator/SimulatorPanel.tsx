import React, { useState } from 'react';
import { Activity, ArrowRight, CheckCircle2, XCircle, AlertCircle, PlayCircle, Loader2, Info } from 'lucide-react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { NetworkSimulator } from '../../simulation/networkSimulator';
import { PingResult } from '../../types';
import { toast } from 'sonner';

const SimulatorPanel: React.FC = () => {
    const { getNodesForCurrentProject, edges, currentProjectId } = useNetworkStore();
    const nodes = getNodesForCurrentProject();
    const [sourceId, setSourceId] = useState('');
    const [targetId, setTargetId] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [result, setResult] = useState<PingResult | null>(null);

    // Reset selection when project changes
    React.useEffect(() => {
        setSourceId('');
        setTargetId('');
        setResult(null);
    }, [currentProjectId]);

    const handleSimulate = () => {
        if (!sourceId || !targetId) {
            toast.error('Please select both source and target nodes.');
            return;
        }

        setIsSimulating(true);
        setResult(null);

        // Simulate a delay for "processing"
        setTimeout(() => {
            const nodesArray = nodes.map(n => ({ id: n.id, data: n.data }));
            const edgesArray = edges.map(e => ({ source: e.source, target: e.target, data: e.data as any }));

            const simResult = NetworkSimulator.simulatePing(sourceId, targetId, nodesArray, edgesArray);
            setResult(simResult);
            setIsSimulating(false);

            if (simResult.success) {
                toast.success('Simulation complete: Path Reachable');
            } else {
                toast.error('Simulation complete: Path Blocked');
            }
        }, 1500);
    };

    return (
        <div className="p-10 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500">
            <header>
                <div className="flex items-center gap-4 mb-2">
                    <div className="h-12 w-12 rounded-2xl bg-cisco-blue flex items-center justify-center text-white shadow-[0_0_20px_rgba(27,160,215,0.4)]">
                        <Activity size={28} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase">Packet Trace Analytics</h2>
                        <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em]">Deterministic State-Based Traffic Simulation</p>
                    </div>
                </div>
                <div className="h-1 w-24 bg-cisco-blue mt-4 shadow-[0_0_10px_rgba(27,160,215,0.5)]" />
            </header>

            <section className="bg-node/20 border border-node-border rounded-3xl p-8 backdrop-blur-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Originating Source</label>
                        <select
                            value={sourceId}
                            onChange={(e) => setSourceId(e.target.value)}
                            className="w-full bg-background/50 border border-node-border rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-cisco-blue transition-all"
                            title="Select source node"
                        >
                            <option value="">Select Source Node...</option>
                            {nodes.map(n => (
                                <option key={n.id} value={n.id}>{n.data.hostname} ({n.data.managementIp || 'No IP'})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Destination Target</label>
                        <select
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                            className="w-full bg-background/50 border border-node-border rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-cisco-blue transition-all"
                            title="Select target node"
                        >
                            <option value="">Select Target Node...</option>
                            {nodes.map(n => (
                                <option key={n.id} value={n.id}>{n.data.hostname} ({n.data.managementIp || 'No IP'})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                    <button
                        onClick={handleSimulate}
                        disabled={isSimulating || !sourceId || !targetId}
                        className="group relative flex items-center gap-3 bg-white text-black font-black uppercase tracking-[0.2em] px-12 py-4 rounded-2xl shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {isSimulating ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Analyzing Routes...
                            </>
                        ) : (
                            <>
                                <PlayCircle size={20} />
                                START SIMULATION
                            </>
                        )}
                    </button>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Info size={12} /> Verification mode: Deterministic CLI Inspection
                    </p>
                </div>
            </section>

            {result && (
                <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
                    <div className={`p-1 rounded-3xl bg-gradient-to-r ${result.success ? 'from-green-500/20 to-transparent' : 'from-red-500/20 to-transparent'}`}>
                        <div className="bg-background rounded-[22px] border border-node-border p-8 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className={`h-16 w-16 rounded-full flex items-center justify-center text-white ${result.success ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}>
                                    {result.success ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase italic italic">{result.success ? 'Connectivity Verified' : 'Traffic Blocked'}</h3>
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-tight">
                                        {result.success
                                            ? `Target ${result.targetIp} is reachable from ${nodes.find(n => n.id === sourceId)?.data.hostname}`
                                            : `Failed at hop ${result.failedAtHop || '??'} - ${result.failReason}`}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right hidden md:block">
                                <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Protocol</p>
                                <p className="text-sm font-black text-white italic">ICMP/ECHO (SYNTH)</p>
                            </div>
                        </div>
                    </div>

                    {result.hops.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 ml-4">Logical Hop-by-Hop Analytics</h4>
                            <div className="flex flex-col gap-3">
                                {result.hops.map((hop, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="bg-node/40 border border-node-border rounded-2xl p-5 flex-1 flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <span className="text-[10px] font-black text-cisco-blue w-6">0{i + 1}</span>
                                                <div>
                                                    <p className="text-xs font-black uppercase text-white">{hop.hostname}</p>
                                                    <p className="text-[10px] font-mono text-gray-500">{hop.ipAddress}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-8">
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black text-gray-700 uppercase">Ingress</p>
                                                    <p className="text-[10px] font-medium text-white">{hop.ingressInterface}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black text-gray-700 uppercase">Egress</p>
                                                    <p className="text-[10px] font-medium text-white">{hop.egressInterface}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {i < result.hops.length - 1 && (
                                            <ArrowRight size={20} className="text-gray-700 shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {result.warnings.length > 0 && (
                        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 flex items-start gap-4">
                            <AlertCircle size={20} className="text-yellow-500 shrink-0" />
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-yellow-500 mb-2">Engine Caveats</h4>
                                <ul className="space-y-1">
                                    {result.warnings.map((w, i) => (
                                        <li key={i} className="text-[11px] text-gray-400 font-medium italic">— {w}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SimulatorPanel;
