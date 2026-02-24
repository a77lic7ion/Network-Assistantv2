import React, { useState, useMemo } from 'react';
import { X, Upload, FileText, CheckCircle2, Loader2, AlertCircle, Link2, Info, Check, Trash2 } from 'lucide-react';
import { useNetworkStore, ProposedLink } from '../../store/useNetworkStore';
import { ConfigTabParser } from '../../parsers/configTabParser';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface BulkUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose }) => {
    const [files, setFiles] = useState<{ name: string; content: string; parsed: any }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<'upload' | 'verify'>('upload');
    const [proposals, setProposedLinks] = useState<ProposedLink[]>([]);
    
    const bulkAddDevices = useNetworkStore((state) => state.bulkAddDevices);
    const applyProposedLinks = useNetworkStore((state) => state.applyProposedLinks);

    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        setIsProcessing(true);
        const newFiles: { name: string; content: string; parsed: any }[] = [];

        for (const file of selectedFiles) {
            const content = await file.text();
            const parsed = ConfigTabParser.parse(content);
            newFiles.push({ name: file.name, content, parsed });
        }

        setFiles(prev => [...prev, ...newFiles]);
        setIsProcessing(false);
        toast.success(`Loaded ${selectedFiles.length} files`);
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const generateProposals = () => {
        setIsProcessing(true);
        const newProposals: ProposedLink[] = [];
        
        // 1. First, create a mapping of hostname -> parsed file for all uploaded files
        const hostnameToFileMap: Record<string, typeof files[0]> = {};
        files.forEach(f => {
            if (f.parsed.hostname) {
                hostnameToFileMap[f.parsed.hostname.toLowerCase()] = f;
            }
        });

        // 2. Iterate through each file to find adjacencies
        files.forEach(f => {
            const sourceHostname = f.parsed.hostname;
            if (!sourceHostname) return;

            f.parsed.interfaces.forEach((iface: any) => {
                // Scenario A: Explicit CDP/LLDP neighbor found in description or show output
                // STRICT FILTER: Only consider physical interfaces (Gi, Te, Eth, etc.)
                if (iface.cdpNeighbor && ConfigTabParser.isPhysicalInterface(iface.name)) {
                    const targetHostname = iface.cdpNeighbor.hostname.toLowerCase();
                    const targetFile = hostnameToFileMap[targetHostname];
                    
                    if (targetFile) {
                        // Check if this link already exists in proposals (bi-directional)
                        const exists = newProposals.some(p => 
                            (p.sourceHostname.toLowerCase() === sourceHostname.toLowerCase() && p.targetHostname.toLowerCase() === targetHostname) ||
                            (p.sourceHostname.toLowerCase() === targetHostname && p.targetHostname.toLowerCase() === sourceHostname.toLowerCase())
                        );

                        if (!exists) {
                            newProposals.push({
                                id: uuidv4(),
                                sourceId: '', // Will be assigned during handleConfirm
                                targetId: '', 
                                sourceHostname,
                                targetHostname: targetFile.parsed.hostname,
                                interfaceA: iface.name,
                                interfaceB: iface.cdpNeighbor.localPort || 'unknown',
                                linkMode: iface.mode || 'trunk',
                                medium: iface.mediaType === 'Fiber' ? 'fiber' : 'ethernet',
                                confidence: 0.95,
                                reason: `Direct Adjacency: ${iface.description || 'Neighbor discovered via CDP/LLDP'}`
                            });
                        }
                    }
                }

                // Scenario B: IP-based adjacency (same subnet on different devices)
                // STRICT FILTER: Only consider physical interfaces (Gi, Te, Eth, etc.)
                if (iface.ipAddress && iface.mask && ConfigTabParser.isPhysicalInterface(iface.name)) {
                    files.forEach(otherFile => {
                        if (otherFile.parsed.hostname === sourceHostname) return;

                        otherFile.parsed.interfaces.forEach((otherIface: any) => {
                            if (otherIface.ipAddress && otherIface.mask === iface.mask && ConfigTabParser.isPhysicalInterface(otherIface.name)) {
                                // Check if they are in the same subnet (simplified check)
                                const ip1 = iface.ipAddress.split('.').slice(0, 3).join('.');
                                const ip2 = otherIface.ipAddress.split('.').slice(0, 3).join('.');
                                
                                if (ip1 === ip2 && ip1 !== '0.0.0') {
                                    const exists = newProposals.some(p => 
                                        (p.sourceHostname.toLowerCase() === sourceHostname.toLowerCase() && p.targetHostname.toLowerCase() === otherFile.parsed.hostname.toLowerCase()) ||
                                        (p.sourceHostname.toLowerCase() === otherFile.parsed.hostname.toLowerCase() && p.targetHostname.toLowerCase() === sourceHostname.toLowerCase())
                                    );

                                    if (!exists) {
                                        newProposals.push({
                                            id: uuidv4(),
                                            sourceId: '',
                                            targetId: '',
                                            sourceHostname,
                                            targetHostname: otherFile.parsed.hostname,
                                            interfaceA: iface.name,
                                            interfaceB: otherIface.name,
                                            linkMode: 'routed',
                                            medium: iface.mediaType === 'Fiber' ? 'fiber' : 'ethernet',
                                            confidence: 0.7,
                                            reason: `Subnet Adjacency: Both on ${ip1}.0/${iface.mask}`
                                        });
                                    }
                                }
                            }
                        });
                    });
                }
            });
        });

        setProposedLinks(newProposals);
        setStep('verify');
        setIsProcessing(false);
    };

    const handleConfirm = () => {
        // 1. Prepare devices for bulk adding
        const deviceConfigs = files.map(f => ({
            data: {
                hostname: f.parsed.hostname || f.name.replace(/\.[^/.]+$/, ""),
                managementIp: f.parsed.managementIp,
                vendor: 'cisco',
                deviceModel: f.parsed.hardwareModel,
                softwareVersion: f.parsed.osVersion,
                macAddress: f.parsed.macAddress,
                serialNumber: f.parsed.serialNumber,
                activeInterfacesCount: f.parsed.interfaces.length,
            },
            config: f.content
        }));

        // 2. Add devices and get their generated IDs
        // We need to modify bulkAddDevices to return the mapping or use a predictable way
        // Instead of modifying store now, let's use the hostname to ID mapping after adding
        bulkAddDevices(deviceConfigs);
        
        // 3. Wait for state update and then map proposals to actual node IDs
        setTimeout(() => {
            const currentNodes = useNetworkStore.getState().nodes;
            const hostnameToId: Record<string, string> = {};
            currentNodes.forEach(n => {
                hostnameToId[n.data.hostname.toLowerCase()] = n.id;
            });

            const finalProposals = proposals.map(p => ({
                ...p,
                sourceId: hostnameToId[p.sourceHostname.toLowerCase()],
                targetId: hostnameToId[p.targetHostname.toLowerCase()]
            })).filter(p => p.sourceId && p.targetId);

            applyProposedLinks(finalProposals);
            toast.success(`Successfully built topology for ${files.length} devices.`);
            onClose();
            setStep('upload');
            setFiles([]);
            setProposedLinks([]);
        }, 500);
    };

    const toggleProposal = (id: string) => {
        // Just remove for now as a "reject"
        setProposedLinks(prev => prev.filter(p => p.id !== id));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-node-border bg-background shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between border-b border-node-border p-6 bg-node/50">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cisco-blue text-white">
                            <Upload size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold italic uppercase tracking-tight">Bulk Network Intake</h2>
                            <p className="text-xs text-gray-400 font-black uppercase tracking-widest">
                                {step === 'upload' ? 'Topology Auto-Generation' : 'AI Verification Loop'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-node hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                    {step === 'upload' ? (
                        <>
                            {/* Upload Area */}
                            <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-node-border bg-node/20 p-10 transition-all hover:border-cisco-blue/50 cursor-pointer group mb-6">
                                {isProcessing ? (
                                    <Loader2 className="mb-4 text-cisco-blue animate-spin" size={48} />
                                ) : (
                                    <Upload className="mb-4 text-gray-500 group-hover:text-cisco-blue transition-colors" size={48} />
                                )}
                                <p className="text-sm font-black uppercase tracking-widest text-white mb-1">Select Multiple Config Files</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Supported: .txt, .cfg, .log</p>
                                <input
                                    type="file"
                                    multiple
                                    accept=".txt,.cfg,.log"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={isProcessing}
                                />
                            </label>

                            {/* File List */}
                            <div className="space-y-2 mb-6">
                                {files.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                        <FileText size={32} className="mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Queue Empty</p>
                                    </div>
                                ) : (
                                    files.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between rounded-xl border border-node-border bg-node/40 p-3 animate-in slide-in-from-left-2 duration-200">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-node-border flex items-center justify-center text-cisco-blue">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black uppercase text-white truncate max-w-[200px]">{file.name}</p>
                                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                                        {file.parsed.hostname || 'Unknown Host'} • {file.parsed.hardwareModel || 'Generic'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveFile(idx)}
                                                className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-cisco-blue/5 border border-cisco-blue/20 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle size={18} className="text-cisco-blue mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-black uppercase text-cisco-blue mb-1">Verify Proposed Adjacencies</p>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase leading-relaxed">
                                        The AI has identified {proposals.length} potential links. Review and remove any incorrect detections before generating the topology.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {proposals.map((p) => (
                                    <div key={p.id} className="group flex items-center justify-between rounded-xl border border-node-border bg-node/30 p-4 transition-all hover:border-cisco-blue/30">
                                        <div className="flex items-center gap-6 flex-1">
                                            <div className="w-32 text-right">
                                                <p className="text-[10px] font-black text-white uppercase italic truncate">{p.sourceHostname}</p>
                                                <p className="text-[9px] font-bold text-cisco-blue uppercase">{p.interfaceA}</p>
                                            </div>
                                            
                                            <div className="flex-1 flex items-center gap-3">
                                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-node-border to-transparent" />
                                                <div className="flex flex-col items-center gap-1">
                                                    <Link2 size={14} className="text-gray-600" />
                                                    <span className="text-[8px] font-black uppercase text-gray-500 tracking-tighter">{p.medium}</span>
                                                </div>
                                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-node-border to-transparent" />
                                            </div>

                                            <div className="w-32 text-left">
                                                <p className="text-[10px] font-black text-white uppercase italic truncate">{p.targetHostname}</p>
                                                <p className="text-[9px] font-bold text-cisco-blue uppercase">{p.interfaceB}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 ml-8">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                                                    <span className="text-[9px] font-black text-white">{(p.confidence * 100).toFixed(0)}%</span>
                                                </div>
                                                <p className="text-[8px] text-gray-500 uppercase font-bold max-w-[150px] truncate">{p.reason}</p>
                                            </div>
                                            <button 
                                                onClick={() => toggleProposal(p.id)}
                                                className="p-2 rounded-lg text-gray-600 hover:bg-red-500/10 hover:text-red-500 transition-all"
                                                title="Reject this link"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-node-border p-6 bg-node/20">
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-node-border bg-transparent py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-colors hover:bg-node hover:text-white"
                        >
                            Cancel
                        </button>
                        {step === 'upload' ? (
                            <button
                                onClick={generateProposals}
                                disabled={files.length === 0 || isProcessing}
                                className="flex-1 rounded-lg bg-cisco-blue py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-[0_4px_15px_rgba(27,160,215,0.3)] hover:opacity-90 disabled:opacity-50 transition-all"
                            >
                                Analyze Configurations
                            </button>
                        ) : (
                            <button
                                onClick={handleConfirm}
                                className="flex-1 rounded-lg bg-green-600 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-[0_4px_15px_rgba(34,197,94,0.3)] hover:opacity-90 transition-all"
                            >
                                <Check size={14} className="inline-block mr-2 -mt-0.5" />
                                Commit Topology
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkUploadModal;