import React, { useState, useEffect, useMemo } from 'react';
import { X, Network, Share2, Info, Cable, Zap, Search } from 'lucide-react';
import { LinkData, LinkMode, LinkMedium, DeviceNodeData } from '../../types';
import { ConfigTabParser } from '../../parsers/configTabParser';

interface LinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: LinkData) => void;
    onDelete?: () => void;
    sourceHostname: string;
    targetHostname: string;
    sourceDevice?: DeviceNodeData;
    targetDevice?: DeviceNodeData;
}

const LinkModal: React.FC<LinkModalProps> = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    onDelete,
    sourceHostname, 
    targetHostname,
    sourceDevice,
    targetDevice
}) => {
    const [formData, setFormData] = useState<LinkData>({
        interfaceA: '',
        interfaceB: '',
        linkMode: 'unconfigured',
        medium: 'ethernet',
        description: '',
    });

    // Intelligent Port Detection
    const detectedPorts = useMemo(() => {
        const getPortInfo = (device?: DeviceNodeData) => {
            if (!device?.blankConfigContext) return [];
            const parsed = ConfigTabParser.parse(device.blankConfigContext);
            return parsed.interfaces.map(iface => {
                let label = iface.name;
                if (iface.vlan) label += ` VLAN ${iface.vlan}`;
                if (iface.mediaType) label += ` ${iface.mediaType}`;
                
                return {
                    name: iface.name,
                    label,
                    isUplink: iface.description?.toLowerCase().includes('uplink') || false,
                    hasRouting: !!iface.ipAddress || iface.mode === 'routed'
                };
            });
        };

        const sourcePorts = getPortInfo(sourceDevice);
        const targetPorts = getPortInfo(targetDevice);

        const getRelevantPorts = (ports: any[], peerHostname?: string) => {
            return ports.filter(p => 
                p.isUplink || 
                p.hasRouting || 
                (peerHostname && p.label.toLowerCase().includes(peerHostname.toLowerCase()))
            );
        };

        return {
            source: getRelevantPorts(sourcePorts, targetHostname),
            target: getRelevantPorts(targetPorts, sourceHostname),
            sourceAll: sourcePorts,
            targetAll: targetPorts
        };
    }, [sourceDevice, targetDevice, sourceHostname, targetHostname]);

    const [showAllSource, setShowAllSource] = useState(false);
    const [showAllTarget, setShowAllTarget] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                interfaceA: detectedPorts.source[0]?.name || '',
                interfaceB: detectedPorts.target[0]?.name || '',
                linkMode: 'unconfigured',
                medium: 'ethernet',
                description: '',
            });
        }
    }, [isOpen, detectedPorts]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    const linkModes: { value: LinkMode; label: string; desc: string }[] = [
        { value: 'trunk', label: 'Trunk', desc: 'Carries multiple VLANs (802.1Q)' },
        { value: 'access', label: 'Access', desc: 'Carries single VLAN traffic' },
        { value: 'routed', label: 'Routed (L3)', desc: 'Point-to-point IP link' },
    ];

    const mediums: { value: LinkMedium; label: string; icon: any }[] = [
        { value: 'ethernet', label: 'Copper / Ethernet', icon: Cable },
        { value: 'fiber', label: 'Fiber Optic', icon: Zap },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-node-border bg-background shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
                <div className="flex items-center justify-between border-b border-node-border p-5 bg-cisco-blue/5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cisco-blue text-white shadow-[0_0_10px_rgba(27,160,215,0.4)]">
                            <Share2 size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold italic uppercase tracking-tight">Configure Network Link</h2>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Intelligent Port Selection</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-node hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-node-border bg-node/30 p-4">
                        <div className="text-center">
                            <p className="text-[9px] uppercase text-gray-500 font-black mb-1">Source Node</p>
                            <p className="text-sm font-black text-white uppercase italic">{sourceHostname}</p>
                        </div>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-cisco-blue/30 to-transparent relative">
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-node-border bg-background p-1.5 text-cisco-blue shadow-[0_0_10px_rgba(27,160,215,0.2)]">
                                <Search size={12} />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] uppercase text-gray-500 font-black mb-1">Target Node</p>
                            <p className="text-sm font-black text-white uppercase italic">{targetHostname}</p>
                        </div>
                    </div>

                    {/* Port Selection */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <div className="flex items-center justify-between mb-2 ml-1">
                                <label className="block text-[10px] font-black uppercase text-gray-500">Interface (Source)</label>
                                <button
                                    type="button"
                                    onClick={() => setShowAllSource(!showAllSource)}
                                    className="text-[8px] font-black uppercase text-cisco-blue hover:underline"
                                >
                                    {showAllSource ? 'Suggested' : 'Show All'}
                                </button>
                            </div>
                            <div className="space-y-2">
                                <select
                                    required
                                    className="w-full rounded-lg border border-node-border bg-node px-4 py-2.5 text-sm font-bold text-white focus:border-cisco-blue focus:outline-none"
                                    value={formData.interfaceA}
                                    onChange={(e) => setFormData({ ...formData, interfaceA: e.target.value })}
                                >
                                    <option value="" disabled>Select Interface</option>
                                    {(showAllSource ? detectedPorts.sourceAll : detectedPorts.source).map(port => (
                                        <option key={port.name} value={port.name}>{port.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2 ml-1">
                                <label className="block text-[10px] font-black uppercase text-gray-500">Interface (Target)</label>
                                <button
                                    type="button"
                                    onClick={() => setShowAllTarget(!showAllTarget)}
                                    className="text-[8px] font-black uppercase text-cisco-blue hover:underline"
                                >
                                    {showAllTarget ? 'Suggested' : 'Show All'}
                                </button>
                            </div>
                            <div className="space-y-2">
                                <select
                                    required
                                    className="w-full rounded-lg border border-node-border bg-node px-4 py-2.5 text-sm font-bold text-white focus:border-cisco-blue focus:outline-none"
                                    value={formData.interfaceB}
                                    onChange={(e) => setFormData({ ...formData, interfaceB: e.target.value })}
                                >
                                    <option value="" disabled>Select Interface</option>
                                    {(showAllTarget ? detectedPorts.targetAll : detectedPorts.target).map(port => (
                                        <option key={port.name} value={port.name}>{port.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Medium Selection */}
                    <div className="mb-6">
                        <label className="block text-[10px] font-black uppercase text-gray-500 mb-3 ml-1">Physical Medium</label>
                        <div className="grid grid-cols-2 gap-3">
                            {mediums.map((m) => (
                                <button
                                    key={m.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, medium: m.value })}
                                    className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${formData.medium === m.value
                                            ? 'border-cisco-blue bg-cisco-blue/10 shadow-[0_0_15px_rgba(27,160,215,0.1)]'
                                            : 'border-node-border bg-node hover:border-gray-600'
                                        }`}
                                >
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${formData.medium === m.value ? 'bg-cisco-blue text-white' : 'bg-node-border text-gray-500'}`}>
                                        <m.icon size={16} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${formData.medium === m.value ? 'text-cisco-blue' : 'text-gray-400'}`}>
                                        {m.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div className="mb-6">
                        <label className="block text-[10px] font-black uppercase text-gray-500 mb-3 ml-1">Logical Mode</label>
                        <div className="grid grid-cols-1 gap-2">
                            {linkModes.map((mode) => (
                                <button
                                    key={mode.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, linkMode: mode.value })}
                                    className={`flex items-center gap-4 rounded-xl border p-3 text-left transition-all ${formData.linkMode === mode.value
                                            ? 'border-cisco-blue bg-cisco-blue/10'
                                            : 'border-node-border bg-node hover:border-gray-600'
                                        }`}
                                >
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${formData.linkMode === mode.value ? 'bg-cisco-blue text-white' : 'bg-node-border text-gray-500'
                                        }`}>
                                        {mode.value === 'trunk' && <Network size={16} />}
                                        {mode.value === 'access' && <Share2 size={16} />}
                                        {mode.value === 'routed' && <Share2 size={16} className="rotate-90" />}
                                    </div>
                                    <div>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${formData.linkMode === mode.value ? 'text-cisco-blue' : 'text-white'}`}>{mode.label}</p>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">{mode.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        {onDelete && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this link?')) {
                                        onDelete();
                                    }
                                }}
                                className="flex-1 rounded-lg border border-red-500/20 bg-red-500/10 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 transition-colors hover:bg-red-500/20"
                            >
                                Delete Link
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-node-border bg-transparent py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-colors hover:bg-node hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 rounded-lg bg-cisco-blue py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-[0_4px_15px_rgba(27,160,215,0.3)] hover:opacity-90"
                        >
                            Confirm Link
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LinkModal;
