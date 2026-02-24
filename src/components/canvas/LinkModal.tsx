import React, { useState } from 'react';
import { X, Network, Share2, Info } from 'lucide-react';
import { LinkData, LinkMode } from '../../types';

interface LinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: LinkData) => void;
    sourceHostname: string;
    targetHostname: string;
}

const LinkModal: React.FC<LinkModalProps> = ({ isOpen, onClose, onSubmit, sourceHostname, targetHostname }) => {
    const [formData, setFormData] = useState<LinkData>({
        interfaceA: '',
        interfaceB: '',
        linkMode: 'unconfigured',
        description: '',
    });

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-node-border bg-background shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
                <div className="flex items-center justify-between border-b border-node-border p-5 bg-cisco-blue/5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cisco-blue text-white shadow-[0_0_10px_rgba(27,160,215,0.4)]">
                            <Share2 size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold">Configure Network Link</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Establishing Adjacency</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-node hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-node-border bg-node/30 p-4">
                        <div className="text-center">
                            <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Source Node</p>
                            <p className="text-sm font-bold text-white uppercase">{sourceHostname}</p>
                        </div>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-cisco-blue/30 to-transparent relative">
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-node-border bg-background p-1.5 text-cisco-blue">
                                <Network size={12} />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Target Node</p>
                            <p className="text-sm font-bold text-white uppercase">{targetHostname}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5 ml-1">Interface (Src)</label>
                            <input
                                required
                                placeholder="e.g. Gi1/0/1"
                                className="w-full rounded-lg border border-node-border bg-node px-3 py-2 text-sm font-medium focus:border-cisco-blue focus:outline-none"
                                value={formData.interfaceA}
                                onChange={(e) => setFormData({ ...formData, interfaceA: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5 ml-1">Interface (Dst)</label>
                            <input
                                required
                                placeholder="e.g. Gi0/1"
                                className="w-full rounded-lg border border-node-border bg-node px-3 py-2 text-sm font-medium focus:border-cisco-blue focus:outline-none"
                                value={formData.interfaceB}
                                onChange={(e) => setFormData({ ...formData, interfaceB: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-3 ml-1">Link Operational Mode</label>
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
                                        <p className={`text-sm font-bold ${formData.linkMode === mode.value ? 'text-cisco-blue' : 'text-white'}`}>{mode.label}</p>
                                        <p className="text-[10px] text-gray-500 font-medium">{mode.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-node-border bg-transparent py-2.5 text-xs font-bold uppercase text-gray-400 transition-colors hover:bg-node hover:text-white"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            className="flex-1 rounded-lg bg-cisco-blue py-2.5 text-xs font-bold uppercase text-white shadow-[0_4px_15px_rgba(27,160,215,0.3)] hover:opacity-90"
                        >
                            Confirm Topology Link
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LinkModal;
